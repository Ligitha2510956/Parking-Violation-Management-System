import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [violations, setViolations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);

  const [catName, setCatName] = useState("");
  const [catFine, setCatFine] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catMessage, setCatMessage] = useState("");

  const [offName, setOffName] = useState("");
  const [offEmail, setOffEmail] = useState("");
  const [offPassword, setOffPassword] = useState("");
  const [offMessage, setOffMessage] = useState("");

  const admin = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const loadData = async () => {
    const v = await axios.get("http://localhost:8080/api/violations");
    setViolations(v.data);
    const c = await axios.get("http://localhost:8080/api/categories");
    setCategories(c.data);
    const o = await axios.get("http://localhost:8080/api/users/officers");
    setOfficers(o.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatMessage("");
    try {
      await axios.post("http://localhost:8080/api/categories", {
        categoryName: catName,
        fineAmount: catFine,
        description: catDesc,
      });
      setCatMessage("Category added!");
      setCatName(""); setCatFine(""); setCatDesc("");
      loadData();
    } catch (err) {
      setCatMessage("Failed to add category.");
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setOffMessage("");
    try {
      await axios.post("http://localhost:8080/api/users/create-officer", {
        name: offName,
        email: offEmail,
        password: offPassword,
      });
      setOffMessage("Officer account created!");
      setOffName(""); setOffEmail(""); setOffPassword("");
      loadData();
    } catch (err) {
      setOffMessage("Failed to create officer.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const pendingCount = violations.filter((v) => v.fineStatus === "PENDING").length;
  const paidCount = violations.filter((v) => v.fineStatus === "PAID").length;
  const fineCollected = violations
    .filter((v) => v.fineStatus === "PAID")
    .reduce((sum, v) => sum + Number(v.fineAmount || 0), 0);

  return (
    <div className="page">
      <div className="barrier-strip" aria-hidden="true"></div>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand-icon">🅿️</span>
          <nav className="topbar-nav">
            <a href="#" className="btn-ghost" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              Log out
            </a>
          </nav>
        </div>
      </header>

      <main className="container">
        <div className="dash-head">
          <p className="eyebrow"><span className="live-dot"></span>Live overview</p>
          <h1>Welcome, {admin?.name}</h1>
        </div>

        <div className="stat-row">
          <div className="stat-card"><span className="stat-num">{violations.length}</span><span className="stat-label">Total Violations</span></div>
          <div className="stat-card"><span className="stat-num">{pendingCount}</span><span className="stat-label">Pending</span></div>
          <div className="stat-card"><span className="stat-num">{officers.length}</span><span className="stat-label">Active Officers</span></div>
          <div className="stat-card"><span className="stat-num">₹{fineCollected}</span><span className="stat-label">Fines Collected</span></div>
        </div>

        <div className="grid" style={{ marginBottom: "24px" }}>
          {/* Create Officer */}
          <div className="panel">
            <h3 className="panel-title">Create Officer Account</h3>
            <form onSubmit={handleCreateOfficer}>
              <div className="field">
                <label>Name</label>
                <input type="text" value={offName} onChange={(e) => setOffName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={offEmail} onChange={(e) => setOffEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={offPassword} onChange={(e) => setOffPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Create Officer</button>
              {offMessage && (
                <p className={offMessage.includes("created") ? "msg-success" : "msg-error"}>{offMessage}</p>
              )}
            </form>

            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-muted)", marginTop: "18px" }}>
              EXISTING OFFICERS ({officers.length})
            </p>
            {officers.map((o) => (
              <div key={o.userId} className="bill-row">
                <span className="bill-row-label">{o.name}</span>
                <span className="bill-row-value" style={{ fontWeight: 400, color: "var(--ink-muted)" }}>{o.email}</span>
              </div>
            ))}
          </div>

          {/* Add Category */}
          <div className="panel">
            <h3 className="panel-title">Add Violation Category</h3>
            <form onSubmit={handleAddCategory}>
              <div className="field">
                <label>Category Name</label>
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Fine Amount</label>
                <input type="number" value={catFine} onChange={(e) => setCatFine(e.target.value)} required />
              </div>
              <div className="field">
                <label>Description</label>
                <input type="text" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Add Category</button>
              {catMessage && (
                <p className={catMessage.includes("added") ? "msg-success" : "msg-error"}>{catMessage}</p>
              )}
            </form>

            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--ink-muted)", marginTop: "18px" }}>
              EXISTING CATEGORIES ({categories.length})
            </p>
            {categories.map((c) => (
              <div key={c.categoryId} className="bill-row">
                <span className="bill-row-label">{c.categoryName}</span>
                <span className="bill-row-value">₹{c.fineAmount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-header-icon">
          <span className="icon-circle">📋</span>
          All Recorded Violations ({violations.length})
        </div>
        <div className="vehicle-list">
          {violations.map((v) => (
            <div key={v.violationId} className="vehicle-card">
              <div className="vehicle-card-header">
                <span className="plate-chip">{v.vehicle.vehicleNumber}</span>
                <span className={
                  v.fineStatus === "PAID" ? "pill-paid" :
                  v.fineStatus === "WAIVED" ? "pill-waived" : "pill-pending"
                }>
                  {v.fineStatus}
                </span>
              </div>
              <div className="bill-row"><span className="bill-row-label">Category</span><span className="bill-row-value">{v.category.categoryName}</span></div>
              <div className="bill-row"><span className="bill-row-label">Officer</span><span className="bill-row-value">{v.officer.name}</span></div>
              <div className="bill-row"><span className="bill-row-label">Fine</span><span className="bill-row-value">₹{v.fineAmount}</span></div>
              <div className="bill-row"><span className="bill-row-label">Location</span><span className="bill-row-value">{v.location}</span></div>
            </div>
          ))}
        </div>
      </main>

      <footer className="foot"><span>@parking violation management</span></footer>
    </div>
  );
}

export default AdminDashboard;