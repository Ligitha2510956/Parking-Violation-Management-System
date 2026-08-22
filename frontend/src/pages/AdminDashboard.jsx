import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeTab, setActiveTab] = useState("overview");

  const [violations, setViolations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [accuracy, setAccuracy] = useState([]);

  const [catName, setCatName] = useState("");
  const [catFine, setCatFine] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catMessage, setCatMessage] = useState("");

  const [offName, setOffName] = useState("");
  const [offEmail, setOffEmail] = useState("");
  const [offPassword, setOffPassword] = useState("");
  const [offMessage, setOffMessage] = useState("");

  const [warningOpenFor, setWarningOpenFor] = useState(null);
  const [warningText, setWarningText] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const admin = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [officerSearch, setOfficerSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const loadData = async () => {
    const v = await axios.get("http://localhost:8080/api/violations");
    setViolations(v.data);
    const c = await axios.get("http://localhost:8080/api/categories");
    setCategories(c.data);
    const o = await axios.get("http://localhost:8080/api/users/officers");
    setOfficers(o.data);
  };

  const loadAppeals = async () => {
    const a = await axios.get("http://localhost:8080/api/appeals");
    setAppeals(a.data);
  };

  const loadAccuracy = async () => {
    const acc = await axios.get("http://localhost:8080/api/officers/accuracy");
    setAccuracy(acc.data);
  };

  useEffect(() => {
    loadData();
    loadAppeals();
    loadAccuracy();
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

  const handleUpdateAppealStatus = async (appealId, newStatus) => {
    try {
      await axios.put(`http://localhost:8080/api/appeals/${appealId}/status`, { status: newStatus });
      loadAppeals();
      loadData(); // violation's fine_status may have changed to WAIVED
      loadAccuracy(); // an APPROVED appeal changes officer accuracy numbers
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendWarning = async (officerId) => {
    setWarningMessage("");
    try {
      await axios.post(`http://localhost:8080/api/officers/${officerId}/warning`, { message: warningText });
      setWarningMessage("Warning sent.");
      setWarningText("");
      setWarningOpenFor(null);
    } catch (err) {
      setWarningMessage("Failed to send warning.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const pendingCount = violations.filter((v) => v.fineStatus === "PENDING").length;
  const fineCollected = violations
    .filter((v) => v.fineStatus === "PAID")
    .reduce((sum, v) => sum + Number(v.fineAmount || 0), 0);

  useEffect(() => {
    setCurrentPage(1);
  }, [vehicleSearch, officerSearch, categoryFilter, statusFilter]);

  const filteredViolations = violations.filter((v) => {
    const matchesVehicle = v.vehicle.vehicleNumber.toLowerCase().includes(vehicleSearch.toLowerCase());
    const matchesOfficer = v.officer.name.toLowerCase().includes(officerSearch.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || v.category.categoryId === Number(categoryFilter);
    const matchesStatus = statusFilter === "ALL" || v.fineStatus === statusFilter;
    return matchesVehicle && matchesOfficer && matchesCategory && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredViolations.length / pageSize));
  const paginatedViolations = filteredViolations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pendingAppealsCount = appeals.filter((a) => a.status !== "APPROVED" && a.status !== "CANCELLED").length;

  // Next-step button(s) for a given appeal, based on the 5-stage workflow
  const renderAppealActions = (appeal) => {
    switch (appeal.status) {
      case "SUBMITTED":
        return (
          <button className="btn btn-primary btn-sm" onClick={() => handleUpdateAppealStatus(appeal.appealId, "UNDER_REVIEW")}>
            Start Review
          </button>
        );
      case "UNDER_REVIEW":
        return (
          <button className="btn btn-primary btn-sm" onClick={() => handleUpdateAppealStatus(appeal.appealId, "EVIDENCE_REVIEWED")}>
            Mark Evidence Reviewed
          </button>
        );
      case "EVIDENCE_REVIEWED":
        return (
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-success btn-sm" onClick={() => handleUpdateAppealStatus(appeal.appealId, "APPROVED")}>
              Approve
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleUpdateAppealStatus(appeal.appealId, "CANCELLED")}>
              Reject
            </button>
          </div>
        );
      case "APPROVED":
        return <span className="pill-paid">Approved — Fine Waived</span>;
      case "CANCELLED":
        return <span className="pill-pending" style={{ background: "var(--error-bg)", color: "var(--error)" }}>Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="page">
      <div className="barrier-strip" aria-hidden="true"></div>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand-icon">🅿️</span>
          <nav className="topbar-nav">
            <span className="live-clock">
              {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <a href="#" className="btn-ghost" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              Log out
            </a>
          </nav>
        </div>
      </header>

      <main className="container">
        <div className="dash-head">
          <h1>Welcome, {admin?.name}</h1>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
            📊 Overview
          </button>
          <button className={`tab-btn ${activeTab === "officers" ? "active" : ""}`} onClick={() => setActiveTab("officers")}>
            👮 Officers
          </button>
          <button className={`tab-btn ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
            🏷️ Categories
          </button>
          <button className={`tab-btn ${activeTab === "violations" ? "active" : ""}`} onClick={() => setActiveTab("violations")}>
            🔍 Search Violations
          </button>
          <button className={`tab-btn ${activeTab === "appeals" ? "active" : ""}`} onClick={() => setActiveTab("appeals")}>
            📨 Appeals {pendingAppealsCount > 0 && `(${pendingAppealsCount})`}
          </button>
          <button className={`tab-btn ${activeTab === "accuracy" ? "active" : ""}`} onClick={() => setActiveTab("accuracy")}>
            🎯 Officer Accuracy
          </button>
        </div>

        {/* ---------------- OVERVIEW TAB ---------------- */}
        {activeTab === "overview" && (
          <div className="tab-panel">
            <div className="stat-row">
              <div className="stat-card"><span className="stat-num">{violations.length}</span><span className="stat-label">Total Violations</span></div>
              <div className="stat-card"><span className="stat-num">{pendingCount}</span><span className="stat-label">Pending</span></div>
              <div className="stat-card"><span className="stat-num">{officers.length}</span><span className="stat-label">Active Officers</span></div>
              <div className="stat-card"><span className="stat-num">₹{fineCollected}</span><span className="stat-label">Fines Collected</span></div>
            </div>

            <div className="overview-split">
              <div>
                <div className="section-header-icon">
                  <span className="icon-circle">🕒</span>
                  Recent Activity
                </div>
                <div className="vehicle-list">
                  {violations.length === 0 && <p className="empty-state">No violations recorded yet.</p>}
                  {[...violations]
                    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
                    .slice(0, 6)
                    .map((v) => (
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
                        <div className="bill-row">
                          <span className="bill-row-label">Date &amp; Time</span>
                          <span className="bill-row-value">
                            {new Date(v.recordedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <div className="section-header-icon">
                  <span className="icon-circle">💰</span>
                  Fine Collection Summary
                </div>
                <div className="bill-card">
                  <div className="bill-card-header">
                    <span className="bill-card-header-title">All Violations</span>
                  </div>
                  <div className="bill-card-body">
                    <div className="bill-row">
                      <span className="bill-row-label">Total Issued</span>
                      <span className="bill-row-value">
                        ₹{violations.reduce((sum, v) => sum + Number(v.fineAmount || 0), 0)}
                      </span>
                    </div>
                    <div className="bill-row">
                      <span className="bill-row-label">Collected (Paid)</span>
                      <span className="bill-row-value">₹{fineCollected}</span>
                    </div>
                    <div className="bill-row">
                      <span className="bill-row-label">Pending</span>
                      <span className="bill-row-value">
                        ₹{violations.filter((v) => v.fineStatus === "PENDING").reduce((sum, v) => sum + Number(v.fineAmount || 0), 0)}
                      </span>
                    </div>
                    <div className="bill-row">
                      <span className="bill-row-label">Waived</span>
                      <span className="bill-row-value">
                        ₹{violations.filter((v) => v.fineStatus === "WAIVED").reduce((sum, v) => sum + Number(v.fineAmount || 0), 0)}
                      </span>
                    </div>
                    <div className="bill-total-row">
                      <span>Total Violations</span>
                      <span>{violations.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- OFFICERS TAB ---------------- */}
        {activeTab === "officers" && (
          <div className="tab-panel">
            <div className="panel">
              <h3 className="panel-title">Create Officer Account</h3>
              <form onSubmit={handleCreateOfficer} className="register-form-row">
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
                <button type="submit" className="btn btn-primary">Create Officer</button>
              </form>
              {offMessage && (
                <p className={offMessage.includes("created") ? "msg-success" : "msg-error"}>{offMessage}</p>
              )}
            </div>

            <div className="section-header-icon">
              <span className="icon-circle">👮</span>
              Existing Officers ({officers.length})
            </div>
            <div className="vehicle-list">
              {officers.map((o) => (
                <div key={o.userId} className="vehicle-card">
                  <div className="bill-row">
                    <span className="bill-row-label">{o.name}</span>
                    <span className="bill-row-value" style={{ fontWeight: 400, color: "var(--ink-muted)" }}>{o.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- CATEGORIES TAB ---------------- */}
        {activeTab === "categories" && (
          <div className="tab-panel">
            <div className="panel">
              <h3 className="panel-title">Add Violation Category</h3>
              <form onSubmit={handleAddCategory} className="register-form-row">
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
                <button type="submit" className="btn btn-primary">Add Category</button>
              </form>
              {catMessage && (
                <p className={catMessage.includes("added") ? "msg-success" : "msg-error"}>{catMessage}</p>
              )}
            </div>

            <div className="section-header-icon">
              <span className="icon-circle">🏷️</span>
              Existing Categories ({categories.length})
            </div>
            <div className="vehicle-list">
              {categories.map((c) => (
                <div key={c.categoryId} className="vehicle-card">
                  <div className="bill-row">
                    <span className="bill-row-label">{c.categoryName}</span>
                    <span className="bill-row-value">₹{c.fineAmount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SEARCH VIOLATIONS TAB ---------------- */}
        {activeTab === "violations" && (
          <div className="tab-panel">
            <div className="search-grid">
              <input
                type="text"
                placeholder="Search by vehicle number..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
              />
              <input
                type="text"
                placeholder="Search by officer name..."
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
              />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="WAIVED">Waived</option>
              </select>
            </div>

            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", margin: "0 0 16px" }}>
              {filteredViolations.length} result{filteredViolations.length !== 1 ? "s" : ""}
            </p>

            {filteredViolations.length === 0 && <p className="empty-state">No violations match your search.</p>}

            <div className="vehicle-list">
              {paginatedViolations.map((v) => (
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
                  <div className="bill-row">
                    <span className="bill-row-label">Date &amp; Time</span>
                    <span className="bill-row-value">
                      {new Date(v.recordedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredViolations.length > 0 && (
              <div className="pagination">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  ← Prev
                </button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------- APPEALS TAB ---------------- */}
        {activeTab === "appeals" && (
          <div className="tab-panel">
            {appeals.length === 0 && <p className="empty-state">No appeals submitted yet.</p>}
            <div className="vehicle-list">
              {appeals.map((a) => (
                <div key={a.appealId} className="vehicle-card">
                  <div className="vehicle-card-header">
                    <span className="plate-chip">{a.violation.vehicle.vehicleNumber}</span>
                    {renderAppealActions(a)}
                  </div>
                  <div className="bill-row"><span className="bill-row-label">Owner</span><span className="bill-row-value">{a.owner.name}</span></div>
                  <div className="bill-row"><span className="bill-row-label">Category</span><span className="bill-row-value">{a.violation.category.categoryName}</span></div>
                  <div className="bill-row"><span className="bill-row-label">Fine Amount</span><span className="bill-row-value">₹{a.violation.fineAmount}</span></div>
                  <div className="bill-row"><span className="bill-row-label">Reason</span><span className="bill-row-value">{a.reason}</span></div>
                  <div className="bill-row">
                    <span className="bill-row-label">Submitted</span>
                    <span className="bill-row-value">
                      {new Date(a.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  {a.counterEvidenceUrl && (
                    <div className="evidence-frame">
                      <img src={`http://localhost:8080${a.counterEvidenceUrl}`} alt="Appeal evidence" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- OFFICER ACCURACY TAB ---------------- */}
        {activeTab === "accuracy" && (
          <div className="tab-panel">
            <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", margin: "0 0 16px" }}>
              Officers need at least 10 recorded violations to appear here. "Overturn %" = approved appeals ÷ total violations. Officers at or above 20% are flagged.
            </p>

            {accuracy.length === 0 && <p className="empty-state">No officers meet the minimum 10-violation threshold yet.</p>}

            <div className="vehicle-list">
              {accuracy.map((o) => (
                <div key={o.officerId} className="vehicle-card">
                  <div className="vehicle-card-header">
                    <span style={{ fontWeight: 700, color: "var(--navy)" }}>{o.name}</span>
                    {o.flagged && <span className="flag-badge">⚠ Flagged</span>}
                  </div>
                  <div className="bill-row"><span className="bill-row-label">Email</span><span className="bill-row-value">{o.email}</span></div>
                  <div className="bill-row"><span className="bill-row-label">Total Violations</span><span className="bill-row-value">{o.totalViolations}</span></div>
                  <div className="bill-row"><span className="bill-row-label">Approved Appeals</span><span className="bill-row-value">{o.approvedAppeals}</span></div>
                  <div className="bill-row"><span className="bill-row-label">Overturn Rate</span><span className="bill-row-value">{o.mistakePercent}%</span></div>

                  {warningOpenFor === o.officerId ? (
                    <div style={{ marginTop: "10px" }}>
                      <div className="field">
                        <label>Warning Message</label>
                        <textarea
                          value={warningText}
                          onChange={(e) => setWarningText(e.target.value)}
                          rows={2}
                          placeholder="Describe the concern..."
                        />
                      </div>
                      {warningMessage && <p className="msg-success">{warningMessage}</p>}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSendWarning(o.officerId)} disabled={!warningText.trim()}>
                          Send Warning
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => setWarningOpenFor(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: "10px" }}
                      onClick={() => { setWarningOpenFor(o.officerId); setWarningText(""); setWarningMessage(""); }}
                    >
                      Send Warning
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="foot"><span>@parking violation management</span></footer>
    </div>
  );
}

export default AdminDashboard;