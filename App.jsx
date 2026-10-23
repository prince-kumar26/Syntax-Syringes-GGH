import React, { useMemo, useState } from 'react';

const initialText = 'Urgently need 2 units of O positive blood at City Care Hospital, Bhilai today. Please help find available donors nearby.';
const demoDonors = [
  {id:1,name:'Demo Donor A',group:'O+',area:'Bhilai',status:'Listed available',phone:'XXX-XXX-0101'},
  {id:2,name:'Demo Donor B',group:'O+',area:'Durg',status:'Listed available',phone:'XXX-XXX-0102'},
  {id:3,name:'Demo Donor C',group:'A+',area:'Bhilai',status:'Listed available',phone:'XXX-XXX-0103'},
  {id:4,name:'Demo Donor D',group:'O-',area:'Bhilai',status:'Availability unconfirmed',phone:'XXX-XXX-0104'},
  {id:5,name:'Demo Donor E',group:'B+',area:'Raipur',status:'Listed available',phone:'XXX-XXX-0105'},
  {id:6,name:'Demo Donor F',group:'O+',area:'Bhilai',status:'Availability unconfirmed',phone:'XXX-XXX-0106'}
];

export default function App() {
  const [requestText, setRequestText] = useState(initialText);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [units, setUnits] = useState('2');
  const [hospital, setHospital] = useState('City Care Hospital');
  const [location, setLocation] = useState('Bhilai');
  const [urgency, setUrgency] = useState('Urgent');
  const [parsed, setParsed] = useState(false);
  const [matches, setMatches] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLabel, setAiLabel] = useState('Demo parser ready');
  const [missing, setMissing] = useState([]);
  const [donorGroup, setDonorGroup] = useState('O+');

  const matched = useMemo(() => {
    if (!matches) return [];
    // Simplified illustrative filter only, not clinical compatibility validation.
    return demoDonors.filter(d => d.group === donorGroup && d.area.toLowerCase() === location.trim().toLowerCase());
  }, [matches, donorGroup, location]);

  async function parseRequest() {
    setLoading(true); setNotice('');
    try {
      const res = await fetch('http://localhost:5000/api/parse-request', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ text:requestText })
      });
      if (!res.ok) throw new Error('Backend not available');
      const data = await res.json();
      const r = data.request || {};
      if (r.bloodGroup) setBloodGroup(r.bloodGroup);
      if (r.units) setUnits(String(r.units));
      if (r.hospital) setHospital(r.hospital);
      if (r.location) setLocation(r.location);
      if (r.urgency) setUrgency(r.urgency);
      setMissing(data.missingFields || []);
      setAiLabel(data.mode === 'gemini' ? 'Gemini API' : 'Demo fallback');
      setParsed(true);
    } catch {
      const text = requestText;
      const bg = text.match(/\b(AB|A|B|O)\s*(positive|negative|pos|neg|\+|-)\b/i);
      if (bg) {
        let v = bg[0].replace(/\s+/g,'').toUpperCase().replace('POSITIVE','+').replace('POS','+').replace('NEGATIVE','-').replace('NEG','-');
        setBloodGroup(v);
      }
      const u = text.match(/(\d+)\s*(units?|bags?)/i); if (u) setUnits(u[1]);
      if (/raipur/i.test(text)) setLocation('Raipur'); else if (/durg/i.test(text)) setLocation('Durg'); else if (/bhilai/i.test(text)) setLocation('Bhilai');
      if (/hospital/i.test(text)) { const h = text.match(/([A-Z][\w& ]*Hospital)/i); if (h) setHospital(h[1].trim()); }
      const m = [];
      if (!/(AB|A|B|O)\s*(positive|negative|pos|neg|\+|-)/i.test(text)) m.push('Blood group');
      if (!/\d+\s*(units?|bags?)/i.test(text)) m.push('Units required');
      if (!/hospital/i.test(text)) m.push('Hospital');
      setMissing(m); setAiLabel('Demo fallback'); setParsed(true);
    }
    setLoading(false);
  }

  function findMatches() {
    setDonorGroup(bloodGroup); setMatches(true); setNotice('');
    if (!parsed) setNotice('Tip: parse the request first to show the intended workflow.');
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">♥</div><div><strong>BloodLink <span>AI</span></strong><small>EMERGENCY DONOR COORDINATION · DEMO</small></div></div>
      <div className="live-pill"><i/> Prototype mode</div>
    </header>
    <main>
      <section className="hero">
        <div className="eyebrow">AI FOR SOCIETY & WELL-BEING</div>
        <h1>Every second matters.<br/><em>Make donor discovery simpler.</em></h1>
        <p>Structure urgent blood requests and explore potential donor matches in one place.</p>
        <div className="hero-stats"><div><b>01</b><span>Capture request</span></div><div><b>02</b><span>Parse with AI</span></div><div><b>03</b><span>Review matches</span></div></div>
      </section>
      <div className="notice"><b>Demo only:</b> all donor records are fictional. This tool does not contact donors or verify medical compatibility, eligibility, or real-time availability.</div>
      <div className="workspace">
        <section className="panel request-panel">
          <div className="panel-heading"><div><span className="step">01 / REQUEST</span><h2>Create blood request</h2></div><span className="icon">＋</span></div>
          <label>Describe the emergency in your own words</label>
          <textarea value={requestText} onChange={e=>setRequestText(e.target.value)} rows="4" placeholder="Example: Need 2 units of O positive blood in Bhilai..."/>
          <div className="field-grid">
            <div><label>Blood group</label><select value={bloodGroup} onChange={e=>setBloodGroup(e.target.value)}>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g=><option key={g}>{g}</option>)}</select></div>
            <div><label>Units required</label><input type="number" min="1" max="10" value={units} onChange={e=>setUnits(e.target.value)}/></div>
            <div><label>Hospital / facility</label><input value={hospital} onChange={e=>setHospital(e.target.value)} placeholder="Hospital name"/></div>
            <div><label>City / locality</label><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Bhilai"/></div>
            <div className="full"><label>Urgency</label><select value={urgency} onChange={e=>setUrgency(e.target.value)}><option>Critical</option><option>Urgent</option><option>Planned</option></select></div>
          </div>
          <button className="primary" onClick={parseRequest} disabled={loading}>{loading?'Processing…':'✦  Parse request with Gemini'}</button>
          <p className="subtle">AI output is assistive; review all extracted fields before proceeding.</p>
          {parsed && <div className="parsed-box"><div className="parsed-title"><span>✓ Request structured</span><small>{aiLabel}</small></div>
            <div className="parsed-grid"><div><small>Blood group</small><b>{bloodGroup}</b></div><div><small>Units</small><b>{units || '—'}</b></div><div><small>Urgency</small><b>{urgency}</b></div><div><small>Location</small><b>{location || '—'}</b></div></div>
            <div className="missing"><b>{missing.length ? 'Needs confirmation: ' : 'Validation: '}</b>{missing.length ? missing.join(', ') : 'No obvious missing fields detected by the prototype.'}</div>
          </div>}
        </section>
        <section className="panel match-panel">
          <div className="panel-heading"><div><span className="step">02 / MATCHING</span><h2>Potential donors</h2></div><span className="icon">⌖</span></div>
          <div className="match-summary"><div className="blood-drop">♥</div><div><b>{bloodGroup} blood request</b><span>{location || 'Location not set'} · {units || '—'} unit(s) requested</span></div></div>
          <div className="match-rules"><span>Matching criteria</span><div><b>01</b> Illustrative blood-group filter</div><div><b>02</b> Demo locality match</div><div><b>03</b> Availability needs confirmation</div></div>
          <button className="secondary" onClick={findMatches}>⌕  Find potential donors</button>
          {notice && <div className="inline-notice">{notice}</div>}
          {matches && <div className="donor-results">
            <div className="results-head"><b>{matched.length} potential demo match{matched.length===1?'':'es'}</b><small>Fictional records</small></div>
            {matched.length ? matched.map(d=><div className="donor" key={d.id}><div className="avatar">{d.group}</div><div className="donor-info"><b>{d.name}</b><span>{d.area} · {d.phone}</span><small>{d.status}</small></div><span className="status-dot">●</span></div>) : <div className="empty">No sample records match both this group and locality. Try O+ and Bhilai for the prepared demo.</div>}
            <button className="primary notify" onClick={()=>setNotice('Demo notification queued (simulated only). No message was sent and no donor was contacted.')}>↗ Simulate notification</button>
          </div>}
          {!matches && <div className="empty-state"><div className="empty-icon">⌕</div><b>Matches will appear here</b><span>Parse a request, then run the demo matching filter.</span></div>}
        </section>
      </div>
      <section className="bottom-row"><div className="mini-card"><span className="mini-icon">✦</span><div><b>Gemini-assisted intake</b><p>Extracts key details from natural-language requests and flags fields to review.</p></div></div><div className="mini-card"><span className="mini-icon">⇄</span><div><b>Human-reviewed coordination</b><p>Designed to support—not replace—hospital and blood-bank verification.</p></div></div></section>
      <footer><span>BloodLink AI · Syntax Syringes · CCET Bhilai</span><span>Hackathon prototype · Not for real emergencies</span></footer>
    </main>
  </div>;
}
