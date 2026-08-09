import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post("http://localhost:8080/api/users/login", {
        email, password,
      });
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "OFFICER") navigate("/officer");
      else if (user.role === "OWNER") navigate("/owner");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="page">
      <div className="barrier-strip" aria-hidden="true"></div>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand-icon">🅿️</span>
        </div>
      </header>

      <div className="form-wrap-centered">
        <div className="form-card">
          <h2>Log in to your account</h2>
          

          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="msg-error">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block">
              Log in
            </button>
          </form>

          <p className="switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>

      <footer className="foot"><span>@parking violation management</span></footer>
    </div>
  );
}

export default Login;