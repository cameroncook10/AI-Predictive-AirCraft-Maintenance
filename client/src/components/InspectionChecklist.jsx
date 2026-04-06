export default function InspectionChecklist({ inspections, onToggle }) {
  if (!inspections || inspections.length === 0) {
    return <div className="empty-state">No inspection data available</div>;
  }

  // Calculate progress
  let total = 0, completed = 0, passed = 0, failed = 0, skipped = 0;
  inspections.forEach((zone) => {
    zone.items.forEach((item) => {
      total++;
      if (item.status !== 'pending') completed++;
      if (item.status === 'pass') passed++;
      if (item.status === 'fail') failed++;
      if (item.status === 'skip') skipped++;
    });
  });
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const checkLabel = { pending: '', pass: '✓', fail: '✕', skip: '—' };
  const statusLabel = { pending: 'PENDING', pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };
  const statusColor = { pending: 'var(--muted)', pass: 'var(--green)', fail: 'var(--red)', skip: 'var(--amber)' };

  return (
    <div className="fade-in">
      {/* Progress */}
      <div className="inspection-progress">
        <div className="inspection-progress-label">Walk-Around Inspection Progress</div>
        <div className="inspection-progress-bar">
          <div className="inspection-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="inspection-stats">
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--blue)' }} />
            {completed}/{total} Complete ({pct}%)
          </div>
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--green)' }} />
            {passed} Pass
          </div>
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--red)' }} />
            {failed} Fail
          </div>
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--amber)' }} />
            {skipped} Skip
          </div>
        </div>
      </div>

      {/* Zones */}
      {inspections.map((zone, zi) => {
        const zoneCompleted = zone.items.filter((it) => it.status !== 'pending').length;
        return (
          <div className="inspection-zone" key={zi}>
            <div className="inspection-zone-header">
              <span>{zone.zone}</span>
              <span className="inspection-zone-count">{zoneCompleted}/{zone.items.length}</span>
            </div>
            <div className="inspection-items">
              {zone.items.map((item) => (
                <div className="insp-item" key={item.id} onClick={() => onToggle(item.id)}>
                  <button className={`insp-check ${item.status}`}>
                    {checkLabel[item.status]}
                  </button>
                  <span className="insp-task">{item.task}</span>
                  <span className="insp-status-label" style={{ color: statusColor[item.status] }}>
                    {statusLabel[item.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
