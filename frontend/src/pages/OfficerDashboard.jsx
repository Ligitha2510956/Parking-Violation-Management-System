import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function OfficerDashboard() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [categories, setCategories] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [categoryId, setCategoryId] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const officer = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("http://localhost:8080/api/categories").then((res) => setCategories(res.data));
  }, []);

  const selectedCategory = categories.find((c) => c.categoryId === Number(categoryId));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!photo) {
      setMessage("Photo is mandatory — please attach evidence.");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    formData.append("vehicleNumber", vehicleNumber);
    formData.append("vehicleType", vehicleType);
    formData.append("officerId", officer.userId);
    formData.append("categoryId", categoryId);
    formData.append("location", location);
    formData.append("photo", photo);

    try {
      await axios.post("http://localhost:8080/api/violations", formData);
      setMessage("Violation recorded successfully!");
      setMessageType("success");
      setVehicleNumber("");
      setCategoryId("");
      setLocation("");
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setMessage("Failed to record violation.");
      setMessageType("error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="page">
      <div className="barrier-strip" aria-hidden="true"></div>
      <div className="app-header">
        <div className="app-header-brand">PVMS <span>Officer</span></div>
        <div className="app-header-right">
          <span className="live-clock">
            {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <div className="pill-badge accent">👮 {officer?.name}</div>
          <button className="logout-pill" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1000px" }}>
        <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
          {/* Form side */}
          <div style={{ flex: "1", minWidth: "340px" }}>
            <div className="section-header-icon">
              <span className="icon-circle">📋</span>
              Record a Violation
            </div>

            <div className="card">
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. TN01AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
                    required
                  />
                </div>

                <div className="field">
                  <label>Vehicle Type</label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="SUV">SUV</option>
                    <option value="Auto">Auto</option>
                    <option value="Truck">Truck</option>
                  </select>
                </div>

                <div className="field">
                  <label>Violation Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName} (₹{c.fineAmount})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
                </div>

                <div className="field">
                  <label>Photo Evidence (mandatory)</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} required />
                  {photoPreview && (
                    <div className="evidence-frame">
                      <img src={photoPreview} alt="Preview" />
                    </div>
                  )}
                </div>

                {message && <p className={messageType === "success" ? "msg-success" : "msg-error"}>{message}</p>}

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "8px" }}>
                  Submit Violation
                </button>
              </form>
            </div>
          </div>

          {/* Live preview side */}
          <div style={{ flex: "0 0 300px" }}>
            <div className="section-header-icon">
              <span className="icon-circle">🧾</span>
              Violation Summary
            </div>

            <div className="bill-card">
              <div className="bill-card-header">
                <span className="bill-card-header-title">
                  {vehicleNumber ? (
                    <span className="plate-chip" style={{ background: "transparent", borderColor: "rgba(255,255,255,0.5)", color: "var(--white)" }}>
                      {vehicleNumber}
                    </span>
                  ) : "New Entry"}
                </span>
                <span className="pill-pending">Pending</span>
              </div>
              <div className="bill-card-body">
                <div className="bill-row">
                  <span className="bill-row-label">Category</span>
                  <span className="bill-row-value">{selectedCategory ? selectedCategory.categoryName : "—"}</span>
                </div>
                <div className="bill-row">
                  <span className="bill-row-label">Location</span>
                  <span className="bill-row-value">{location || "—"}</span>
                </div>
                <div className="bill-row">
                  <span className="bill-row-label">Vehicle Type</span>
                  <span className="bill-row-value">{vehicleType}</span>
                </div>
                <div className="bill-total-row">
                  <span>Fine Amount</span>
                  <span>₹{selectedCategory ? selectedCategory.fineAmount : "0.00"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="foot"><span>@parking violation management</span></footer>
    </div>
  );
}

export default OfficerDashboard;