function riskColor(p) {
  if (p > 70) return '#ff4757';
  if (p > 45) return '#ffb020';
  return '#00d68f';
}

export default function RightPanel({ aircraft }) {
  if (!aircraft) return <aside className="rpanel" />;

  const ac = aircraft;

  return (
    <aside className="rpanel">
      {/* Predicted Savings */}
      <div className="rcard">
        <div className="rcard-label">
          <svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
          Predicted Savings (90d)
        </div>
        <div className="savings-v">{ac.savings}</div>
        <div className="savings-s">vs reactive maintenance baseline</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>AOG risk reduction</span>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--green)' }}>&minus;73%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Unscheduled events</span>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)' }}>{ac.savingsEvents}</span>
        </div>
      </div>

      {/* Tools Required */}
      {ac.toolsRequired && ac.toolsRequired.length > 0 && (
        <div className="rcard">
          <div className="rcard-label">
            <svg viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
            Tools Required
          </div>
          {ac.toolsRequired.map((tool, i) => (
            <div className="tool-item" key={i}>{tool}</div>
          ))}
        </div>
      )}

      {/* Safety Notes */}
      {ac.safetyNotes && ac.safetyNotes.length > 0 && (
        <div className="rcard" style={{ borderColor: 'var(--amber-border)' }}>
          <div className="rcard-label" style={{ color: 'var(--amber)' }}>
            <svg viewBox="0 0 24 24" style={{ fill: 'var(--amber)' }}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            Safety Notes
          </div>
          {ac.safetyNotes.map((note, i) => (
            <div className="safety-item" key={i}>{note}</div>
          ))}
        </div>
      )}

      {/* Risk Factors */}
      <div className="rcard">
        <div className="rcard-label">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          Risk Factors
        </div>
        {ac.riskFactors.map((rf, i) => (
          <div className="risk-row" key={i}>
            <div className="risk-name">{rf.name}</div>
            <div className="risk-track">
              <div className="risk-fill" style={{ width: `${rf.pct}%`, background: riskColor(rf.pct) }} />
            </div>
            <div className="risk-pct">{rf.pct}%</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
