import com.sun.net.httpserver.*;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Module 1 backend - Registration / Login / Logout / Authentication / Dashboard.
 *
 * No Maven, no Spring Boot, no Tomcat install needed - this uses Java's own
 * built-in HttpServer class (com.sun.net.httpserver), included with every JDK.
 *
 * How to run:
 *   1. Open a terminal INSIDE the "backend" folder.
 *   2. javac Server.java UserStore.java
 *   3. java backend.Server        (run this from the PARENT folder - see README)
 *   4. Open http://localhost:8080 in your browser.
 */
public class Server {

    // username -> session id ,  session id -> username
    private static final Map<String, String> sessions = new ConcurrentHashMap<>();
    private static final String FRONTEND_DIR = "../frontend";

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // --- API routes ---
        server.createContext("/api/register", Server::handleRegister);
        server.createContext("/api/login", Server::handleLogin);
        server.createContext("/api/logout", Server::handleLogout);
        server.createContext("/api/me", Server::handleMe);
        server.createContext("/api/google-login", Server::handleGoogleLogin);

        // --- Everything else = serve a file from the frontend folder ---
        server.createContext("/", Server::handleStatic);

        server.setExecutor(null);
        server.start();
        System.out.println("PVMS server running at http://localhost:8080");
    }

    // =================================================================
    // Static file serving (login.html, register.html, dashboard.html, css, js)
    // =================================================================
    private static void handleStatic(HttpExchange ex) throws IOException {
        String path = ex.getRequestURI().getPath();
        if (path.equals("/")) path = "/login.html";

        File file = new File(FRONTEND_DIR, path).getCanonicalFile();
        File frontendRoot = new File(FRONTEND_DIR).getCanonicalFile();

        if (!file.getPath().startsWith(frontendRoot.getPath()) || !file.exists() || file.isDirectory()) {
            respondText(ex, 404, "Not found");
            return;
        }

        String contentType = guessContentType(file.getName());
        byte[] bytes = Files.readAllBytes(file.toPath());
        ex.getResponseHeaders().set("Content-Type", contentType);
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String guessContentType(String name) {
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (name.endsWith(".svg")) return "image/svg+xml";
        return "application/octet-stream";
    }

    // =================================================================
    // POST /api/register
    // =================================================================
    private static void handleRegister(HttpExchange ex) throws IOException {
        if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
            respondJson(ex, 405, jsonError("Method not allowed"));
            return;
        }
        Map<String, String> form = parseForm(readBody(ex));

        String fullName = form.getOrDefault("fullName", "").trim();
        String username = form.getOrDefault("username", "").trim();
        String password = form.getOrDefault("password", "");
        String confirmPassword = form.getOrDefault("confirmPassword", "");
        String role = form.getOrDefault("role", "").trim();
        String contactNumber = form.getOrDefault("contactNumber", "").trim();
        String vehicleType = form.getOrDefault("vehicleType", "").trim();

        if (fullName.isEmpty() || username.isEmpty() || password.isEmpty() || role.isEmpty()) {
            respondJson(ex, 400, jsonError("Please fill in all required fields."));
            return;
        }
        if (!password.equals(confirmPassword)) {
            respondJson(ex, 400, jsonError("Passwords do not match."));
            return;
        }
        if (password.length() < 6) {
            respondJson(ex, 400, jsonError("Password must be at least 6 characters long."));
            return;
        }
        if (UserStore.existsByUsername(username)) {
            respondJson(ex, 400, jsonError("That username / vehicle number is already registered."));
            return;
        }

        UserStore.User user = new UserStore.User();
        user.fullName = fullName;
        user.username = username;
        user.passwordHash = UserStore.hash(password);
        user.role = role;
        user.contactNumber = contactNumber;
        user.vehicleType = role.equals("VEHICLE_OWNER") ? vehicleType : "";
        user.googleEmail = "";
        UserStore.save(user);

        respondJson(ex, 200, "{\"ok\":true,\"message\":\"Registration successful! Please log in.\"}");
    }

    // =================================================================
    // POST /api/login
    // =================================================================
    private static void handleLogin(HttpExchange ex) throws IOException {
        if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
            respondJson(ex, 405, jsonError("Method not allowed"));
            return;
        }
        Map<String, String> form = parseForm(readBody(ex));
        String username = form.getOrDefault("username", "").trim();
        String password = form.getOrDefault("password", "");

        Optional<UserStore.User> maybeUser = UserStore.findByUsername(username);
        if (maybeUser.isEmpty() || maybeUser.get().passwordHash.isEmpty()
                || !maybeUser.get().passwordHash.equals(UserStore.hash(password))) {
            respondJson(ex, 401, jsonError("Invalid username or password."));
            return;
        }

        startSession(ex, maybeUser.get().username);
        respondJson(ex, 200, "{\"ok\":true,\"message\":\"Login successful.\"}");
    }

    // =================================================================
    // POST /api/logout
    // =================================================================
    private static void handleLogout(HttpExchange ex) throws IOException {
        String sessionId = getCookie(ex, "PVMS_SESSION");
        if (sessionId != null) sessions.remove(sessionId);
        ex.getResponseHeaders().add("Set-Cookie", "PVMS_SESSION=; Path=/; Max-Age=0");
        respondJson(ex, 200, "{\"ok\":true}");
    }

    // =================================================================
    // GET /api/me  -> current logged-in user's details (used by dashboard.html)
    // =================================================================
    private static void handleMe(HttpExchange ex) throws IOException {
        String username = currentUsername(ex);
        if (username == null) {
            respondJson(ex, 401, jsonError("Not logged in."));
            return;
        }
        Optional<UserStore.User> maybeUser = UserStore.findByUsername(username);
        if (maybeUser.isEmpty()) {
            respondJson(ex, 401, jsonError("Not logged in."));
            return;
        }
        UserStore.User u = maybeUser.get();
        String json = "{\"ok\":true,\"fullName\":\"" + esc(u.fullName) + "\",\"username\":\""
                + esc(u.username) + "\",\"role\":\"" + esc(u.role) + "\"}";
        respondJson(ex, 200, json);
    }

    // =================================================================
    // POST /api/google-login  (body: credential=<Google ID token from the button>)
    // =================================================================
    private static void handleGoogleLogin(HttpExchange ex) throws IOException {
        if (!ex.getRequestMethod().equalsIgnoreCase("POST")) {
            respondJson(ex, 405, jsonError("Method not allowed"));
            return;
        }
        Map<String, String> form = parseForm(readBody(ex));
        String credential = form.getOrDefault("credential", "");
        if (credential.isEmpty()) {
            respondJson(ex, 400, jsonError("Missing Google credential."));
            return;
        }

        try {
            // Ask Google directly whether this token is genuine, and who it belongs to.
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + credential))
                    .GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                respondJson(ex, 401, jsonError("Google could not verify this sign-in. Please try again."));
                return;
            }

            String body = response.body();
            String email = extractJsonField(body, "email");
            String name = extractJsonField(body, "name");
            if (email == null) {
                respondJson(ex, 401, jsonError("Could not read your Google account email."));
                return;
            }

            Optional<UserStore.User> existing = UserStore.findByGoogleEmail(email);
            UserStore.User user;
            if (existing.isPresent()) {
                user = existing.get();
            } else {
                user = new UserStore.User();
                user.fullName = (name != null && !name.isEmpty()) ? name : email;
                user.username = email;
                user.passwordHash = "";
                user.role = "VEHICLE_OWNER"; // default role for self-service Google sign-ups
                user.contactNumber = "";
                user.vehicleType = "";
                user.googleEmail = email;
                UserStore.save(user);
            }

            startSession(ex, user.username);
            respondJson(ex, 200, "{\"ok\":true}");

        } catch (Exception e) {
            respondJson(ex, 500, jsonError("Google sign-in failed: " + e.getMessage()));
        }
    }

    // =================================================================
    // Small helpers
    // =================================================================
    private static void startSession(HttpExchange ex, String username) {
        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, username);
        ex.getResponseHeaders().add("Set-Cookie", "PVMS_SESSION=" + sessionId + "; Path=/; HttpOnly");
    }

    private static String currentUsername(HttpExchange ex) {
        String sessionId = getCookie(ex, "PVMS_SESSION");
        if (sessionId == null) return null;
        return sessions.get(sessionId);
    }

    private static String getCookie(HttpExchange ex, String name) {
        List<String> cookieHeaders = ex.getRequestHeaders().get("Cookie");
        if (cookieHeaders == null) return null;
        for (String header : cookieHeaders) {
            for (String part : header.split(";")) {
                String[] kv = part.trim().split("=", 2);
                if (kv.length == 2 && kv[0].equals(name)) return kv[1];
            }
        }
        return null;
    }

    private static String readBody(HttpExchange ex) throws IOException {
        try (InputStream is = ex.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseForm(String body) {
        Map<String, String> map = new HashMap<>();
        for (String pair : body.split("&")) {
            if (pair.isBlank()) continue;
            String[] kv = pair.split("=", 2);
            String key = java.net.URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
            String value = kv.length > 1 ? java.net.URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
            map.put(key, value);
        }
        return map;
    }

    private static String extractJsonField(String json, String field) {
        Matcher m = Pattern.compile("\"" + field + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : null;
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String jsonError(String message) {
        return "{\"ok\":false,\"message\":\"" + esc(message) + "\"}";
    }

    private static void respondJson(HttpExchange ex, int status, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void respondText(HttpExchange ex, int status, String text) throws IOException {
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
