
import React, { useMemo, useState } from "react";
import "./App.css";

const initialText =
  "Urgently need 2 units of O positive blood at City Care Hospital, Bhilai today.";

const demoDonors = [
  { id: 1, name: "Demo Donor A", group: "O+", area: "Bhilai", status: "Listed available" },
  { id: 2, name: "Demo Donor B", group: "O+", area: "Durg", status: "Listed available" },
  { id: 3, name: "Demo Donor C", group: "A+", area: "Bhilai", status: "Listed available" },
  { id: 4, name: "Demo Donor D", group: "O-", area: "Bhilai", status: "Unconfirmed" },
  { id: 5, name: "Demo Donor E", group: "B+", area: "Raipur", status: "Listed available" },
  { id: 6, name: "Demo Donor F", group: "O+", area: "Bhilai", status: "Unconfirmed" },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function extractFallback(text) {
  const group = text.match(/\b(AB|A|B|O)\s*(positive|negative|pos|neg|\+|-)\b/i);
  const units = text.match(/(\d+)\s*(units?|bags?)/i);
  const normalizedGroup = group
    ? group[0].replace(/\s+/g, "").toUpperCase()
        .replace("POSITIVE", "+").replace("POS", "+")
        .replace("NEGATIVE", "-").replace("NEG", "-")
    : null;

  const city = /\braipur\b/i.test(text)
    ? "Raipur"
    : /\bdurg\b/i.test(text)
      ? "Durg"
      : /\bbhilai\b/i.test(text)
        ? "Bhilai"
        : null;

  const missingFields = [];
  if (!normalizedGroup) missingFields.push("Blood group");
  if (!units) missingFields.push("Units required");
  if (!/hospital/i.test(text)) missingFields.push("Hospital");
  if (!city) missingFields.push("City/locality");

  return {
    request: {
      bloodGroup: normalizedGroup,
      units: units ? Number(units[1]) : null,
      hospital: null,
      location: city,
      urgency: /critical|immediately|life-threatening/i.test(text)
        ? "Critical"
        : /urgent|urgently|emergency|today/i.test(text)
          ? "Urgent"
          : "Planned",
    },
    missingFields,
  };
}

export default function App() {
  const [requestText, setRequestText] = useState(initialText);
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [units, setUnits] = useState("2");
  const [hospital, setHospital] = useState("City Care Hospital");
  const [location, setLocation] = useState("Bhilai");
  const [urgency, setUrgency] = useState("Urgent");

  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [aiLabel, setAiLabel] = useState("");
  const [missing, setMissing] = useState([]);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");

  const [matches, setMatches] = useState(false);
  const [donorGroup, setDonorGroup] = useState("O+");
  const [donorLocation, setDonorLocation] = useState("Bhilai");
  const [donorFilter, setDonorFilter] = useState("all");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("request");

  const matched = useMemo(() => {
    if (!matches) return [];

    return demoDonors.filter((donor) => {
      const groupMatches = donor.group === donorGroup;
      const locationMatches =
        donor.area.toLowerCase() === donorLocation.trim().toLowerCase();
      const statusMatches =
        donorFilter === "all" ||
        (donorFilter === "listed" && donor.status === "Listed available") ||
        (donorFilter === "unconfirmed" && donor.status === "Unconfirmed");

      return groupMatches && locationMatches && statusMatches;
    });
  }, [matches, donorGroup, donorLocation, donorFilter]);

  function showNotice(message, type = "info") {
    setNotice(message);
    setNoticeType(type);
  }

  async function parseRequest() {
    setNotice("");

    if (!requestText.trim()) {
      showNotice("Please describe the blood requirement.", "error");
      return;
    }

    if (!hospital.trim() || !location.trim()) {
      showNotice("Enter the hospital and city/locality first.", "error");
      return;
    }

    const count = Number(units);
    if (!Number.isInteger(count) || count < 1 || count > 10) {
      showNotice("Units must be a whole number between 1 and 10.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/parse-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: requestText }),
      });

      if (!response.ok) throw new Error("AI service unavailable");

      const data = await response.json();
      const request = data.request || {};

      if (request.bloodGroup && bloodGroups.includes(request.bloodGroup)) {
        setBloodGroup(request.bloodGroup);
      }
      if (request.units != null) setUnits(String(request.units));
      if (request.hospital) setHospital(request.hospital);
      if (request.location) setLocation(request.location);
      if (["Critical", "Urgent", "Planned"].includes(request.urgency)) {
        setUrgency(request.urgency);
      }

      setMissing(data.missingFields || []);
      setAiLabel(data.mode === "gemini" ? "Gemini AI" : "Backend parser");
      setParsed(true);
      showNotice("Request parsed. Review every field before proceeding.", "success");
    } catch {
      // Offline fallback is explicitly labelled and does not claim AI verification.
      const result = extractFallback(requestText);
      const request = result.request;

      if (request.bloodGroup && bloodGroups.includes(request.bloodGroup)) {
        setBloodGroup(request.bloodGroup);
      }
      if (request.units != null && request.units >= 1 && request.units <= 10) {
        setUnits(String(request.units));
      }
      if (request.location) setLocation(request.location);
      if (request.urgency) setUrgency(request.urgency);

      setMissing(result.missingFields);
      setAiLabel("Offline demo parser");
      setParsed(true);
      showNotice(
        "Backend unavailable. Demo parsing was used; verify the extracted fields manually.",
        "warning"
      );
    } finally {
      setLoading(false);
    }
  }

  function findMatches() {
    if (!parsed) {
      showNotice("Parse and review the request before searching sample records.", "warning");
      return;
    }

    setDonorGroup(bloodGroup);
    setDonorLocation(location);
    setMatches(true);
    setActiveTab("donors");
    showNotice(
      "Showing fictional sample records only. No real donor availability is verified.",
      "info"
    );
  }

  function saveRequest() {
    if (!parsed) {
      showNotice("Parse the request before adding it to demo history.", "warning");
      return;
    }

    const item = {
      id: Date.now(),
      bloodGroup,
      units,
      hospital,
      location,
      urgency,
      date: new Date().toLocaleString(),
    };

    setHistory((previous) => [item, ...previous].slice(0, 10));
    showNotice("Request saved in this page's temporary demo history.", "success");
  }

  function simulateNotification() {
    showNotice(
      "Simulation complete. No SMS, call, or message was sent and no donor was contacted.",
      "warning"
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="BloodLink home">
          <span className="brand-mark">♥</span>
          <span>
            <strong>BloodLink <em>AI</em></strong>
            <small>SMART DONOR COORDINATION</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className="prototype-badge"><i /> Prototype mode</span>
          <a className="topbar-link" href="#safety">Safety first</a>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">AI FOR SOCIETY &amp; WELL-BEING</span>
            <h1>Every second matters.<br /><em>Make donor discovery simpler.</em></h1>
            <p>
              Turn unstructured blood requests into clear information
              and explore illustrative donor matches in one workspace.
            </p>
            <div className="hero-actions">
              <button className="btn btn-light" onClick={() => document.getElementById("request")?.scrollIntoView({ behavior: "smooth" })}>
                Create a request <span>↘</span>
              </button>
              <span className="hero-caption">Built for responsible coordination</span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orb orb-one" />
            <div className="orb orb-two" />
            <div className="hero-heart">♥</div>
            <div className="floating-card floating-top"><span>✦</span><div><b>AI-assisted intake</b><small>Structure a request</small></div></div>
            <div className="floating-card floating-bottom"><span className="mini-check">✓</span><div><b>Human review</b><small>Before any action</small></div></div>
          </div>
        </section>

        <div className="safety-banner" id="safety">
          <span className="safety-icon">!</span>
          <div>
            <strong>Hackathon demo — not for real emergencies</strong>
            <p>All donor records are fictional. No real donor is contacted. Verify blood availability, eligibility and compatibility directly with a hospital or licensed blood bank.</p>
          </div>
        </div>

        <section className="workspace">
          <div className="section-intro">
            <div><span className="eyebrow dark">YOUR WORKSPACE</span><h2>Manage a blood request</h2></div>
            <span className="demo-label">DEMO ENVIRONMENT</span>
          </div>

          <div className="workspace-tabs" role="tablist" aria-label="Workspace views">
            <button className={activeTab === "request" ? "tab active" : "tab"} onClick={() => setActiveTab("request")}>01&nbsp; Request intake</button>
            <button className={activeTab === "donors" ? "tab active" : "tab"} onClick={() => setActiveTab("donors")}>02&nbsp; Donor explorer</button>
            <button className={activeTab === "history" ? "tab active" : "tab"} onClick={() => setActiveTab("history")}>03&nbsp; Request history <span className="count">{history.length}</span></button>
          </div>

          {notice && (
            <div className={`notice notice-${noticeType}`} role="status">
              <span>{noticeType === "success" ? "✓" : noticeType === "error" ? "!" : "i"}</span>
              {notice}
              <button aria-label="Dismiss notice" onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {activeTab === "request" && (
            <div className="workspace-grid" id="request">
              <section className="panel">
                <div className="panel-heading">
                  <div><span className="step-label">STEP 01 / INTAKE</span><h3>Describe the request</h3></div>
                  <span className="panel-icon">＋</span>
                </div>

                <label htmlFor="requestText">Emergency description</label>
                <textarea id="requestText" rows="4" value={requestText} onChange={(e) => { setRequestText(e.target.value); setParsed(false); }} placeholder="Describe the required blood group, units, hospital and location..." />

                <div className="form-grid">
                  <div><label htmlFor="bloodGroup">Blood group</label><select id="bloodGroup" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select></div>
                  <div><label htmlFor="units">Units required</label><input id="units" type="number" min="1" max="10" step="1" value={units} onChange={(e) => setUnits(e.target.value)} /></div>
                  <div className="field-wide"><label htmlFor="hospital">Hospital / facility</label><input id="hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Enter facility name" /></div>
                  <div className="field-wide"><label htmlFor="location">City / locality</label><input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bhilai" /></div>
                  <div className="field-wide"><label htmlFor="urgency">Urgency level</label><select id="urgency" value={urgency} onChange={(e) => setUrgency(e.target.value)}><option>Critical</option><option>Urgent</option><option>Planned</option></select></div>
                </div>

                <button className="btn btn-primary full-button" disabled={loading} onClick={parseRequest}>
                  {loading ? <><span className="spinner" /> Processing request...</> : <>✦ &nbsp; Parse request</>}
                </button>
                <p className="helper-text">AI output is assistive. Confirm all details before using them.</p>

                {parsed && (
                  <div className="parsed-card">
                    <div className="parsed-heading"><span className="success-mark">✓</span><div><b>Request structured</b><small>{aiLabel}</small></div><span className="review-pill">Review required</span></div>
                    <div className="parsed-grid">
                      <div><small>Blood group</small><b>{bloodGroup}</b></div>
                      <div><small>Units</small><b>{units || "—"}</b></div>
                      <div><small>Urgency</small><b>{urgency}</b></div>
                      <div><small>Location</small><b>{location || "—"}</b></div>
                    </div>
                    {missing.length > 0 && <p className="missing-fields">Needs confirmation: {missing.join(", ")}</p>}
                    <div className="parsed-actions">
                      <button className="btn btn-outline" onClick={saveRequest}>Save to history</button>
                      <button className="btn btn-primary" onClick={findMatches}>Explore matches →</button>
                    </div>
                  </div>
                )}
              </section>

              <aside className="panel summary-panel">
                <div className="panel-heading"><div><span className="step-label">LIVE PREVIEW</span><h3>Request summary</h3></div><span className="panel-icon">⌖</span></div>
                <div className="summary-blood">
                  <span className="blood-symbol">♥</span>
                  <div><span>Requested blood group</span><strong>{bloodGroup}</strong></div>
                  <span className="urgent-pill">{urgency}</span>
                </div>
                <div className="summary-list">
                  <div><span>◷ &nbsp; Units needed</span><b>{units || "—"} unit(s)</b></div>
                  <div><span>⌖ &nbsp; Location</span><b>{location || "Not entered"}</b></div>
                  <div><span>＋ &nbsp; Facility</span><b>{hospital || "Not entered"}</b></div>
                  <div><span>✓ &nbsp; Review status</span><b>{parsed ? "Needs human review" : "Draft"}</b></div>
                </div>
                <div className="summary-note"><span>✦</span><p><b>Human-in-the-loop</b><br />This prototype organizes information; it does not make clinical decisions.</p></div>
                <div className="workflow">
                  <span className="step-label">HOW IT WORKS</span>
                  <div className="workflow-item"><i className="workflow-number">1</i><div><b>Describe</b><small>Enter request details</small></div></div>
                  <div className="workflow-line" />
                  <div className="workflow-item"><i className="workflow-number">2</i><div><b>Structure</b><small>Review extracted fields</small></div></div>
                  <div className="workflow-line" />
                  <div className="workflow-item"><i className="workflow-number">3</i><div><b>Explore</b><small>View fictional sample matches</small></div></div>
                </div>
              </aside>
            </div>
          )}

          {activeTab === "donors" && (
            <section className="panel donor-panel">
              <div className="panel-heading"><div><span className="step-label">STEP 02 / EXPLORER</span><h3>Explore sample donors</h3></div><span className="panel-icon">⌖</span></div>
              <p className="panel-description">Filter fictional records by group and locality. Results are not real donor leads.</p>
              <div className="filter-grid">
                <div><label htmlFor="donorGroup">Blood group</label><select id="donorGroup" value={donorGroup} onChange={(e) => { setDonorGroup(e.target.value); setMatches(true); }}>{bloodGroups.map((g) => <option key={g}>{g}</option>)}</select></div>
                <div><label htmlFor="donorLocation">Locality</label><select id="donorLocation" value={donorLocation} onChange={(e) => { setDonorLocation(e.target.value); setMatches(true); }}><option>Bhilai</option><option>Durg</option><option>Raipur</option></select></div>
                <div><label htmlFor="donorFilter">Record status</label><select id="donorFilter" value={donorFilter} onChange={(e) => setDonorFilter(e.target.value)}><option value="all">All sample records</option><option value="listed">Listed available</option><option value="unconfirmed">Unconfirmed</option></select></div>
              </div>
              <div className="results-head"><div><b>{matches ? matched.length : 0} sample matches</b><small>Group + locality + selected status</small></div><span className="demo-label">FICTIONAL DATA</span></div>
              {!matches ? <div className="empty-state"><span className="empty-symbol">⌕</span><b>Ready to explore</b><p>Parse your request first, or use the filters to explore demo records.</p><button className="btn btn-primary" onClick={() => { setMatches(true); }}>Show sample records</button></div> :
                matched.length ? <div className="donor-grid">{matched.map((donor) => <article className="donor-card" key={donor.id}><div className="donor-card-top"><span className="donor-blood">{donor.group}</span><span className={donor.status === "Listed available" ? "status-tag" : "status-tag muted"}>{donor.status}</span></div><div className="donor-avatar">♥</div><h4>{donor.name}</h4><p>⌖ &nbsp;{donor.area}</p><div className="fictional-note">Sample profile · Not contactable</div></article>)}</div> :
                  <div className="empty-state"><span className="empty-symbol">⌕</span><b>No sample records match</b><p>Try a different locality, blood group or status filter.</p></div>}
              <div className="simulator-box"><div><b>Demo notification simulator</b><p>Demonstrates a workflow only. No messages will be sent.</p></div><button className="btn btn-outline" onClick={simulateNotification}>Simulate notification ↗</button></div>
            </section>
          )}

          {activeTab === "history" && (
            <section className="panel history-panel">
              <div className="panel-heading"><div><span className="step-label">STEP 03 / TRACKING</span><h3>Request history</h3></div><span className="panel-icon">↺</span></div>
              <p className="panel-description">Requests saved here are temporary and remain only in this page's current session.</p>
              {history.length === 0 ? <div className="empty-state"><span className="empty-symbol">↺</span><b>No saved requests yet</b><p>Parse a request and select “Save to history”.</p><button className="btn btn-primary" onClick={() => setActiveTab("request")}>Create a request</button></div> :
                <div className="history-list">{history.map((item) => <article className="history-item" key={item.id}><span className="donor-blood">{item.bloodGroup}</span><div className="history-main"><b>{item.hospital}</b><p>{item.location} · {item.units} unit(s) · {item.urgency}</p><small>{item.date}</small></div><span className="review-pill">Needs review</span></article>)}</div>}
              {history.length > 0 && <button className="btn btn-outline" onClick={() => setHistory([])}>Clear demo history</button>}
            </section>
          )}
        </section>

        <section className="feature-grid">
          <article className="feature-card"><span className="feature-icon">✦</span><div><h3>AI-assisted intake</h3><p>Turn natural-language requests into structured fields with a clearly labelled fallback mode.</p></div></article>
          <article className="feature-card"><span className="feature-icon">⇄</span><div><h3>Human-reviewed workflow</h3><p>Keep request details reviewable before moving to the next step.</p></div></article>
          <article className="feature-card"><span className="feature-icon">♡</span><div><h3>Responsible by design</h3><p>Clearly distinguish sample matches from real availability and clinical verification.</p></div></article>
        </section>

        <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark">♥</span><strong>BloodLink <em>AI</em></strong></a><span>Syntax Syringes · CCET Bhilai</span><span>Hackathon prototype · Not for real emergencies</span></footer>
      </main>
    </div>
  );
}
