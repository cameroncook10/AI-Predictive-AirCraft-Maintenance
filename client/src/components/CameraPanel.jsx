import { useState } from 'react';

export default function CameraPanel({ cameraData }) {
  const [selectedZone, setSelectedZone] = useState(null);

  if (!cameraData) return <div className="empty-state">Loading camera data...</div>;

  const { cameraStatus, zones } = cameraData;
  const activeZone = selectedZone ? zones.find((z) => z.id === selectedZone) : null;

  return (
    <div className="fade-in">
      {/* Camera Status */}
      <div className="camera-status">
        <div className="cam-stat">
          <div className="cam-stat-label">Battery</div>
          <div className="cam-stat-value" style={{ color: 'var(--green)' }}>{cameraStatus.battery}</div>
        </div>
        <div className="cam-stat">
          <div className="cam-stat-label">Signal</div>
          <div className="cam-stat-value" style={{ color: 'var(--green)' }}>{cameraStatus.signal}</div>
        </div>
        <div className="cam-stat">
          <div className="cam-stat-label">Gyro</div>
          <div className="cam-stat-value" style={{ color: 'var(--teal)' }}>{cameraStatus.gyroAlignment}</div>
        </div>
        <div className="cam-stat">
          <div className="cam-stat-label">Mode</div>
          <div className="cam-stat-value" style={{ color: 'var(--blue)' }}>{cameraStatus.mode}</div>
        </div>
      </div>

      {/* Camera Viewer */}
      <div className="camera-viewer">
        <div className="camera-feed">
          <div className="camera-crosshair" />
          <div className="camera-overlay">
            <span>REC ● {activeZone ? activeZone.name : 'NO ZONE SELECTED'}</span>
            <span>PAN: 0° TILT: 0° ZOOM: 1.0×</span>
            <span>GYRO STABILIZED</span>
          </div>
          <div className="camera-overlay-right">
            <span>ISO 800 · f/2.8</span>
            <span>4K 30fps</span>
            <span>{activeZone ? `${activeZone.findings} findings` : '--'}</span>
          </div>
        </div>
        <div className="camera-controls">
          <button className="cam-btn">◀ PAN L</button>
          <button className="cam-btn">PAN R ▶</button>
          <button className="cam-btn">▲ TILT</button>
          <button className="cam-btn">▼ TILT</button>
          <button className="cam-btn">+ ZOOM</button>
          <button className="cam-btn">− ZOOM</button>
          <button className="cam-btn active">STABILIZE</button>
        </div>
      </div>

      {/* Camera Zones */}
      <div className="section-title">Inspection Zones — Click to Aim Camera</div>
      <div className="camera-zones">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`cam-zone zone-${zone.status}${selectedZone === zone.id ? ' active' : ''}`}
            onClick={() => setSelectedZone(zone.id)}
            style={selectedZone === zone.id ? { boxShadow: '0 0 0 2px var(--blue)', borderColor: 'var(--blue-border)' } : {}}
          >
            <div className="cam-zone-name">{zone.name}</div>
            <div className="cam-zone-desc">{zone.description}</div>
            <div className="cam-zone-meta">
              <span>Last: {zone.lastInspected}</span>
              {zone.findings > 0 && (
                <span className="cam-zone-findings has-findings">{zone.findings} findings</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
