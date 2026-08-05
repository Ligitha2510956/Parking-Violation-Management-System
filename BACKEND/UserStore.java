import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;


public class UserStore {

    private static final String FILE_PATH = "users.txt";
    private static final Object LOCK = new Object();

    public static class User {
        public String id;
        public String fullName;
        public String username;
        public String passwordHash;
        public String role;           // ADMIN, OFFICER, VEHICLE_OWNER
        public String contactNumber;
        public String vehicleType;
        public String googleEmail;
    }

    
    // Password hashing  so passwords are never stored as plain text
    
    public static String hash(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    
    // File read/write helpers
   
    private static List<User> readAll() {
        synchronized (LOCK) {
            List<User> users = new ArrayList<>();
            Path path = Paths.get(FILE_PATH);
            if (!Files.exists(path)) return users;

            try {
                List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
                for (String line : lines) {
                    if (line.isBlank()) continue;
                    String[] parts = line.split("\\|", -1);
                    if (parts.length < 8) continue;
                    User u = new User();
                    u.id = parts[0];
                    u.fullName = parts[1];
                    u.username = parts[2];
                    u.passwordHash = parts[3];
                    u.role = parts[4];
                    u.contactNumber = parts[5];
                    u.vehicleType = parts[6];
                    u.googleEmail = parts[7];
                    users.add(u);
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            return users;
        }
    }

    private static void writeAll(List<User> users) {
        synchronized (LOCK) {
            try (BufferedWriter writer = Files.newBufferedWriter(
                    Paths.get(FILE_PATH), StandardCharsets.UTF_8)) {
                for (User u : users) {
                    writer.write(String.join("|",
                            u.id, u.fullName, u.username, u.passwordHash,
                            u.role, u.contactNumber, u.vehicleType, u.googleEmail));
                    writer.newLine();
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    
    // Public API used by the server
    
    public static Optional<User> findByUsername(String username) {
        return readAll().stream()
                .filter(u -> u.username.equalsIgnoreCase(username))
                .findFirst();
    }

    public static Optional<User> findByGoogleEmail(String email) {
        return readAll().stream()
                .filter(u -> u.googleEmail != null && u.googleEmail.equalsIgnoreCase(email))
                .findFirst();
    }

    public static boolean existsByUsername(String username) {
        return findByUsername(username).isPresent();
    }

    public static synchronized User save(User user) {
        List<User> users = readAll();
        if (user.id == null || user.id.isBlank()) {
            user.id = UUID.randomUUID().toString().substring(0, 8);
        }
        users.removeIf(u -> u.id.equals(user.id));
        users.add(user);
        writeAll(users);
        return user;
    }
}
