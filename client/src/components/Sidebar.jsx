function healthColor(h) {
  if (h < 60) return 'var(--red)';
  if (h < 80) return 'var(--amber)';
  return 'var(--green)';
}

export default function Sidebar({ fleet, metrics, selected, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-label">Fleet Overview</div>
      {metrics && (
        <div className="fleet-metrics">
          <div className="fleet-met">
            <div className="fleet-met-l">Aircraft</div>
            <div className="fleet-met-v">{metrics.aircraftCount}</div>
          </div>
          <div className="fleet-met">
            <div className="fleet-met-l">Health</div>
            <div className="fleet-met-v" style={{ color: healthColor(metrics.averageHealth) }}>
              {metrics.averageHealth}%
            </div>
          </div>
          <div className="fleet-met">
            <div className="fleet-met-l">Alerts</div>
            <div className="fleet-met-v" style={{ color: 'var(--red)' }}>
              {metrics.totalAlerts}
            </div>
          </div>
          <div className="fleet-met">
            <div className="fleet-met-l">Savings YTD</div>
            <div className="fleet-met-v" style={{ color: 'var(--green)', fontSize: 13 }}>
              {metrics.savingsYTD}
            </div>
          </div>
        </div>
      )}
      <div className="sidebar-label">Aircraft</div>
      {fleet.map((ac) => (
        <button
          key={ac.tailNumber}
          className={`ac-item${ac.tailNumber === selected ? ' active' : ''}`}
          onClick={() => onSelect(ac.tailNumber)}
        >
          <div>
            <div className="ac-tail">{ac.tailNumber}</div>
            <div className="ac-type">{ac.name.replace('Boeing ', '')}</div>
          </div>
          <span className="ac-score" style={{ color: healthColor(ac.health) }}>
            {ac.health}%
          </span>
        </button>
      ))}
    </aside>
  );
}
