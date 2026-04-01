function riskColor(p) {
  if (p > 70) return '#e84040';
  if (p > 45) return '#f5a623';
  return '#22c87a';
}

export default function RightPanel({ aircraft }) {
  if (!aircraft) return <aside className="rpanel" />;

  const ac = aircraft;

  return (
    <aside className="rpanel">
      <div className="rcard">
        <div className="rcard-label">AI Model</div>
        <div className="rrow"><span className="rrow-k">Architecture</span><span className="rrow-v">LSTM + GBT</span></div>
        <div className="rrow"><span className="rrow-k">Test accuracy</span><span className="rrow-v" style={{ color: 'var(--green)' }}>91.3%</span></div>
        <div className="rrow"><span className="rrow-k">Confidence</span><span className="rrow-v">{ac.aiConfidence}</span></div>
        <div className="rrow"><span className="rrow-k">Features</span><span className="rrow-v">847</span></div>
        <div className="rrow"><span className="rrow-k">Sensor points</span><span className="rrow-v">2.1M</span></div>
        <div className="rrow"><span className="rrow-k">Last trained</span><span className="rrow-v">6d ago</span></div>
      </div>

      <div className="rcard">
        <div className="rcard-label">Predicted Savings (90d)</div>
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

      <div className="rcard">
        <div className="rcard-label">Risk Factors</div>
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
