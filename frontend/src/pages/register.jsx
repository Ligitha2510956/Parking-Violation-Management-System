import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Role is fixed to OWNER here — Officer/Admin accounts are created
      // by Admin only (constraint #2/#3), never through public registration.
      await axios.post("http://localhost:8080/api/users/register", {
        name,
        email,
        password,
        role: "OWNER",
      });
      navigate("/");
    } catch (err) {
      setError("Registration failed. That email may already be in use.");
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
        <div className="form-card form-card-wide">
          <h2>Create your account</h2>
          

          <form onSubmit={handleRegister}>
            <div className="field">
              <label>Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div style={{ display: "flex", gap: "14px" }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
              </div>
            </div>

            {error && <p className="msg-error">{error}</p>}

            <button type="submit" className="btn btn-primary btn-block">
              Create account
            </button>
          </form>

          <p className="switch">
            Already registered? <Link to="/">Log in</Link>
          </p>
        </div>
      </div>

      <footer className="foot"><span>@parking violation management</span></footer>
    </div>
  );
}

export default Register;