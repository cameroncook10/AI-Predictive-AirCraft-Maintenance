import Gauge from './Gauge';

function healthColor(h) {
  if (h < 60) return 'var(--red)';
  if (h < 80) return 'var(--amber)';
  return 'var(--green)';
}

function trendClass(trend) {
  if (trend.includes('critical') || trend.includes('↓↓')) return 'critical-card';
  if (trend.includes('declining') || trend.includes('↓')) return 'declining';
  return '';
}

export default function InternalSystems({ aircraft }) {
  if (!aircraft || !aircraft.internalComponents) {
    return <div className="empty-state">No internal system data available</div>;
  }

  const components = aircraft.internalComponents;

  return (
    <div className="fade-in">
      <div className="section-title">Internal Aircraft Systems</div>
      <div className="comp-grid">
        {Object.entries(components).map(([name, comp]) => (
          <div className={`comp-card ${trendClass(comp.trend)}`} key={name}>
            <Gauge value={comp.health} />
            <div>
              <div className="comp-name">{name}</div>
              <div className="comp-pct" style={{ color: healthColor(comp.health) }}>
                {comp.health}%
              </div>
              <div className="comp-trend">{comp.trend}</div>
              {comp.zone && <div className="comp-zone">{comp.zone}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
