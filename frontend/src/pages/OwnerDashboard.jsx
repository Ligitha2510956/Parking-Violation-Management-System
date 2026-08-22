import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const APPEAL_STEPS = ["SUBMITTED", "UNDER_REVIEW", "EVIDENCE_REVIEWED", "APPROVED"];
const APPEAL_LABELS = ["Submitted", "Under Review", "Evidence Reviewed", "Approved"];

function AppealStepper({ status }) {
  if (status === "CANCELLED") {
    return <div className="appeal-cancelled">❌ Appeal Cancelled — fine remains payable.</div>;
  }
  const currentIndex = APPEAL_STEPS.indexOf(status);
  return (
    <div className="stepper">
      {APPEAL_STEPS.map((step, i) => (
        <span key={step} style={{ display: "contents" }}>
          <div className={`step ${i < currentIndex ? "done" : i === currentIndex ? "active" : ""}`}>
            <span className="dot"></span>{APPEAL_LABELS[i]}
          </div>
          {i < APPEAL_STEPS.length - 1 && (
            <div className={`step-line ${i < currentIndex ? "done" : ""}`}></div>
          )}
        </span>
      ))}
    </div>
  );
}

function OwnerDashboard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [vehicles, setVehicles] = useState([]);
  const [violations, setViolations] = useState({}); // { vehicleId: [violations] }
  const [appeals, setAppeals] = useState({}); // { violationId: appeal }
  const [claimNumber, setClaimNumber] = useState("");
  const [claimType, setClaimType] = useState("Car");
  const [message, setMessage] = useState("");

  const [appealFormOpen, setAppealFormOpen] = useState(null); // violationId currently showing the form
  const [appealReason, setAppealReason] = useState("");
  const [appealEvidence, setAppealEvidence] = useState(null);
  const [appealMessage, setAppealMessage] = useState("");

  const owner = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const loadVehicles = async () => {
    const res = await axios.get(`http://localhost:8080/api/vehicles/owner/${owner.userId}`);
    setVehicles(res.data);

    const violationMap = {};
    for (const v of res.data) {
      const vRes = await axios.get(`http://localhost:8080/api/violations/vehicle/${v.vehicleId}`);
      violationMap[v.vehicleId] = vRes.data;
    }
    setViolations(violationMap);
  };

  const loadAppeals = async () => {
    const res = await axios.get(`http://localhost:8080/api/appeals/owner/${owner.userId}`);
    const map = {};
    res.data.forEach((a) => { map[a.violation.violationId] = a; });
    setAppeals(map);
  };

  useEffect(() => {
    loadVehicles();
    loadAppeals();
  }, []);

  const handleClaim = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await axios.post("http://localhost:8080/api/vehicles/claim", {
        vehicleNumber: claimNumber,
        ownerId: owner.userId,
        vehicleType: claimType,
      });
      setMessage("Vehicle registered successfully!");
      setClaimNumber("");
      loadVehicles();
    } catch (err) {
      setMessage(err.response?.data || "Failed to register vehicle.");
      console.error(err);
    }
  };

  const handleMarkPaid = async (violationId) => {
    try {
      await axios.put(`http://localhost:8080/api/violations/${violationId}/mark-paid`);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAppeal = async (violationId) => {
    setAppealMessage("");
    const formData = new FormData();
    formData.append("violationId", violationId);
    formData.append("ownerId", owner.userId);
    formData.append("reason", appealReason);
    if (appealEvidence) formData.append("evidence", appealEvidence);

    try {
      await axios.post("http://localhost:8080/api/appeals", formData);
      setAppealMessage("Appeal submitted successfully!");
      setAppealReason("");
      setAppealEvidence(null);
      setAppealFormOpen(null);
      loadAppeals();
    } catch (err) {
      setAppealMessage(err.response?.data || "Failed to submit appeal.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const allViolations = Object.values(violations).flat();
  const totalFines = allViolations.length;
  const pendingCount = allViolations.filter((v) => v.fineStatus === "PENDING").length;
  const paidCount = allViolations.filter((v) => v.fineStatus === "PAID").length;
  const waivedCount = allViolations.filter((v) => v.fineStatus === "WAIVED").length;

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
          <h1>Welcome, {owner?.name}</h1>
        </div>

        <div className="stat-row">
          <div className="stat-card"><span className="stat-num">{totalFines}</span><span className="stat-label">Total Fines</span></div>
          <div className="stat-card"><span className="stat-num">{pendingCount}</span><span className="stat-label">Pending</span></div>
          <div className="stat-card"><span className="stat-num">{paidCount}</span><span className="stat-label">Paid</span></div>
          <div className="stat-card"><span className="stat-num">{waivedCount}</span><span className="stat-label">Waived</span></div>
        </div>

        <div className="section-header-icon">
          <span className="icon-circle">🚗</span>
          Register / Claim a Vehicle
        </div>
        <div className="panel">
          <p style={{ color: "var(--ink-muted)", fontSize: "0.85rem", margin: "0 0 16px" }}>
            Link a vehicle you own to your account — any violations recorded against it will then show up below.
          </p>
          <form onSubmit={handleClaim} className="register-form-row">
            <div className="field">
              <label>Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. TN01AB1234"
                value={claimNumber}
                onChange={(e) => setClaimNumber(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                required
              />
            </div>
            <div className="field" style={{ flex: "0 0 140px" }}>
              <label>Type</label>
              <select value={claimType} onChange={(e) => setClaimType(e.target.value)}>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Register</button>
          </form>
          {message && (
            <p className={message.includes("success") ? "msg-success" : "msg-error"} style={{ marginTop: "10px" }}>
              {message}
            </p>
          )}
        </div>

        <div className="section-header-icon">
          <span className="icon-circle">🚧</span>
          My Vehicles &amp; Violations
        </div>

        {vehicles.length === 0 && <p className="empty-state">No vehicles registered yet.</p>}

        <div className="vehicle-list">
          {vehicles.map((v) => (
            <div key={v.vehicleId} className="vehicle-card">
              <div className="vehicle-card-header">
                <span className="plate-chip">{v.vehicleNumber}</span>
                <span style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>{v.vehicleType}</span>
              </div>

              {violations[v.vehicleId]?.length > 0 ? (
                violations[v.vehicleId].map((viol) => {
                  const appeal = appeals[viol.violationId];
                  return (
                    <div key={viol.violationId} className="violation-row">
                      <div className="bill-row">
                        <span className="bill-row-label">Category</span>
                        <span className="bill-row-value">{viol.category.categoryName}</span>
                      </div>
                      <div className="bill-row">
                        <span className="bill-row-label">Fine Amount</span>
                        <span className="bill-row-value">₹{viol.fineAmount}</span>
                      </div>
                      <div className="bill-row">
                        <span className="bill-row-label">Status</span>
                        <span className={
                          viol.fineStatus === "PAID" ? "pill-paid" :
                          viol.fineStatus === "WAIVED" ? "pill-waived" : "pill-pending"
                        }>
                          {viol.fineStatus}
                        </span>
                      </div>
                      <div className="bill-row">
                        <span className="bill-row-label">Location</span>
                        <span className="bill-row-value">{viol.location}</span>
                      </div>
                      <div className="bill-row">
                        <span className="bill-row-label">Date &amp; Time</span>
                        <span className="bill-row-value">
                          {new Date(viol.recordedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>

                      <div className="evidence-frame">
                        <img src={`http://localhost:8080${viol.photoUrl}`} alt="Violation evidence" />
                      </div>

                      {/* Appeal status / actions */}
                      {appeal ? (
                        <div style={{ marginTop: "14px" }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--ink-muted)", marginBottom: "10px", textTransform: "uppercase" }}>
                            Appeal Status
                          </p>
                          <AppealStepper status={appeal.status} />
                        </div>
                      ) : (
                        viol.fineStatus === "PENDING" && (
                          <>
                            <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                              <button onClick={() => handleMarkPaid(viol.violationId)} className="btn btn-success btn-sm">
                                Mark as Paid
                              </button>
                              <button
                                onClick={() => setAppealFormOpen(appealFormOpen === viol.violationId ? null : viol.violationId)}
                                className="btn btn-outline btn-sm"
                              >
                                {appealFormOpen === viol.violationId ? "Cancel" : "Submit an Appeal"}
                              </button>
                            </div>

                            {appealFormOpen === viol.violationId && (
                              <div className="panel" style={{ marginTop: "10px" }}>
                                <div className="field">
                                  <label>Reason for Appeal</label>
                                  <textarea
                                    value={appealReason}
                                    onChange={(e) => setAppealReason(e.target.value)}
                                    rows={3}
                                    placeholder="Explain why you're disputing this fine..."
                                    required
                                  />
                                </div>
                                <div className="field">
                                  <label>Evidence Photo (optional)</label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setAppealEvidence(e.target.files[0])}
                                  />
                                </div>
                                {appealMessage && (
                                  <p className={appealMessage.includes("success") ? "msg-success" : "msg-error"}>
                                    {appealMessage}
                                  </p>
                                )}
                                <button
                                  onClick={() => handleSubmitAppeal(viol.violationId)}
                                  className="btn btn-primary btn-sm"
                                  disabled={!appealReason.trim()}
                                >
                                  Submit Appeal
                                </button>
                              </div>
                            )}
                          </>
                        )
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="empty-state">No violations on this vehicle. 🎉</p>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="foot"><span>@parking violation management</span></footer>
    </div>
  );
}

export default OwnerDashboard;