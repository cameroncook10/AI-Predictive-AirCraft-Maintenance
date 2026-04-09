function healthColor(h) {
  if (h < 60) return 'var(--red)';
  if (h < 80) return 'var(--amber)';
  return 'var(--green)';
}

function statusDot(s) {
  if (s === 'critical') return 'var(--red)';
  if (s === 'warning') return 'var(--amber)';
  return 'var(--green)';
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Fleet Overview', icon: <svg viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { id: 'camera', label: 'Camera System', icon: <svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg> },
  { id: 'manuals', label: 'Maint. Manuals', icon: <svg viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg> },
  { id: 'inspections', label: 'Inspections', icon: <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
];

export default function Sidebar({ fleet, metrics, selected, onSelect, activeView, onViewChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-label">Fleet Metrics</div>
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

      <div className="sidebar-label">Navigation</div>
      <div className="nav-section">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item${activeView === item.id ? ' active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            {item.icon}
            {item.label}
            {item.id === 'inspections' && metrics && metrics.pendingWorkOrders > 0 && (
              <span className="nav-badge">{metrics.pendingWorkOrders}</span>
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-label">Aircraft</div>
      {fleet.map((ac) => (
        <button
          key={ac.tailNumber}
          className={`ac-item${ac.tailNumber === selected ? ' active' : ''}`}
          onClick={() => onSelect(ac.tailNumber)}
        >
          <div>
            <div className="ac-tail">
              {ac.tailNumber}
              <span className="ac-status-dot" style={{ display: 'inline-block', background: statusDot(ac.status) }} />
            </div>
            <div className="ac-type">{ac.name.replace('Boeing ', '')}</div>
            <div className="ac-bay">{ac.bayLocation}</div>
          </div>
          <span className="ac-score" style={{ color: healthColor(ac.health) }}>
            {ac.health}%
          </span>
        </button>
      ))}
    </aside>
  );
}
