import { useState } from 'react';
import Gauge from './Gauge';
import PredictionChart from './PredictionChart';
import CameraPanel from './CameraPanel';
import InternalSystems from './InternalSystems';
import ManualViewer from './ManualViewer';
import InspectionChecklist from './InspectionChecklist';
import { acknowledgeAlert, completeWorkOrder } from '../api';

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

function priorityColor(p) {
  return { critical: '#ff4757', high: '#ffb020', medium: '#3b82f6', low: '#00d68f' }[p] || '#6b6e7e';
}

function daysColor(d) {
  if (d <= 7) return 'var(--red)';
  if (d <= 14) return 'var(--amber)';
  return 'var(--muted)';
}

export default function CenterPanel({ aircraft, activeView, cameraData, inspections, onRefresh, onRefreshAll, onToggleInspection }) {
  const [activeTab, setActiveTab] = useState('ov');

  if (!aircraft) {
    return (
      <main className="center">
        <div className="empty-state">Loading aircraft data...</div>
      </main>
    );
  }

  const ac = aircraft;

  const handleAckAlert = async (index) => {
    await acknowledgeAlert(ac.tailNumber, index);
    onRefreshAll();
  };

  const handleCompleteWO = async (index) => {
    await completeWorkOrder(ac.tailNumber, index);
    onRefresh();
  };

  // For camera, manuals, inspections — render full-page views
  if (activeView === 'camera') {
    return (
      <main className="center">
        <div className="center-head">
          <div>
            <div className="center-title">{ac.tailNumber} — Camera System</div>
            <div className="center-route">Gyroscopic Inspection Camera · {ac.name}</div>
            <div className="center-bay">{ac.bayLocation}</div>
          </div>
          <span className={`badge badge-${ac.status}`}>{ac.status}</span>
        </div>
        <div className="pane active">
          <CameraPanel cameraData={cameraData} />
        </div>
      </main>
    );
  }

  if (activeView === 'manuals') {
    return (
      <main className="center">
        <div className="center-head">
          <div>
            <div className="center-title">{ac.tailNumber} — Maintenance Manuals</div>
            <div className="center-route">AMM / CMM Reference Library · {ac.name}</div>
            <div className="center-bay">{ac.bayLocation}</div>
          </div>
          <span className={`badge badge-${ac.status}`}>{ac.status}</span>
        </div>
        <div className="pane active">
          <ManualViewer manuals={ac.maintenanceManuals} />
        </div>
      </main>
    );
  }

  if (activeView === 'inspections') {
    return (
      <main className="center">
        <div className="center-head">
          <div>
            <div className="center-title">{ac.tailNumber} — Ground Inspection</div>
            <div className="center-route">Walk-Around Checklist · {ac.name}</div>
            <div className="center-bay">{ac.bayLocation}</div>
          </div>
          <span className={`badge badge-${ac.status}`}>{ac.status}</span>
        </div>
        <div className="pane active">
          <InspectionChecklist inspections={inspections} onToggle={onToggleInspection} />
        </div>
      </main>
    );
  }

  // Default: Fleet Overview with tabs
  const tabs = [
    { id: 'ov', label: 'Overview' },
    { id: 'int', label: 'Internal Systems', count: Object.keys(ac.internalComponents || {}).length },
    { id: 'pr', label: 'Predictions' },
    { id: 'wo', label: 'Work Orders', count: ac.workOrders.length },
  ];

  return (
    <main className="center">
      <div className="center-head">
        <div>
          <div className="center-title">{ac.tailNumber} — {ac.name}</div>
          <div className="center-route">{ac.route}</div>
          <div className="center-bay">{ac.bayLocation}</div>
        </div>
        <span className={`badge badge-${ac.status}`}>{ac.status}</span>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className={`pane${activeTab === 'ov' ? ' active' : ''}`}>
        <div className="section-title">External Systems</div>
        <div className="comp-grid">
          {Object.entries(ac.components).map(([name, comp]) => (
            <div className={`comp-card ${trendClass(comp.trend)}`} key={name}>
              <Gauge value={comp.health} />
              <div>
                <div className="comp-name">{name}</div>
                <div className="comp-pct" style={{ color: healthColor(comp.health) }}>
                  {comp.health}%
                </div>
                <div className="comp-trend">{comp.trend}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="alerts-label">Active Alerts</div>
        {ac.alerts.length === 0 && (
          <div className="empty-state">No active alerts</div>
        )}
        {ac.alerts.map((alert, i) => (
          <div className={`alert-item ${alert.severity}`} key={i}>
            <div className="alert-dot" />
            <div className="alert-msg">{alert.message}</div>
            <div className="alert-time">{alert.time}</div>
            <button className="alert-ack" onClick={() => handleAckAlert(i)}>
              ACK
            </button>
          </div>
        ))}
      </div>

      {/* Internal Systems */}
      <div className={`pane${activeTab === 'int' ? ' active' : ''}`}>
        <InternalSystems aircraft={ac} />
      </div>

      {/* Predictions */}
      <div className={`pane${activeTab === 'pr' ? ' active' : ''}`}>
        <PredictionChart predictions={ac.predictions} />
      </div>

      {/* Work Orders */}
      <div className={`pane${activeTab === 'wo' ? ' active' : ''}`}>
        <div className="wo-list">
          {ac.workOrders.length === 0 && (
            <div className="empty-state">No open work orders</div>
          )}
          {ac.workOrders.map((wo, i) => (
            <div className="wo-item" key={i}>
              <div className="wo-bar" style={{ background: priorityColor(wo.priority) }} />
              <div>
                <div className="wo-title">{wo.title}</div>
                <div className="wo-meta">{wo.type} · {wo.priority.toUpperCase()}</div>
              </div>
              <div className="wo-days" style={{ color: daysColor(wo.days) }}>+{wo.days}d</div>
              <button className="wo-complete" onClick={() => handleCompleteWO(i)}>
                COMPLETE
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
