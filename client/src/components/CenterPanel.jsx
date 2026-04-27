import { useState } from 'react';
import Gauge from './Gauge';
import PredictionChart from './PredictionChart';
import CameraPanel from './CameraPanel';
import InternalSystems from './InternalSystems';
import ManualViewer from './ManualViewer';
import InspectionChecklist from './InspectionChecklist';
import { acknowledgeAlert, completeWorkOrder, createWorkOrder } from '../api';

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

export default function CenterPanel({ aircraft, activeView, cameraData, inspections, exteriorZonePhotos, onRefresh, onRefreshAll, onToggleInspection }) {
  const [activeTab, setActiveTab] = useState('ov');
  const [woTitle, setWoTitle] = useState('');
  const [woType, setWoType] = useState('Corrective');
  const [woPriority, setWoPriority] = useState('medium');
  const [woDays, setWoDays] = useState(7);
  const [woSubmitting, setWoSubmitting] = useState(false);
  const [woError, setWoError] = useState(null);

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

  const handleAddWorkOrder = async (e) => {
    e.preventDefault();
    if (!woTitle.trim()) {
      setWoError('Enter a title for the work order.');
      return;
    }
    setWoSubmitting(true);
    setWoError(null);
    try {
      await createWorkOrder(ac.tailNumber, {
        title: woTitle.trim(),
        type: woType,
        priority: woPriority,
        days: Number(woDays) || 7,
      });
      setWoTitle('');
      setWoType('Corrective');
      setWoPriority('medium');
      setWoDays(7);
      onRefresh();
    } catch (err) {
      setWoError(err?.message || String(err));
    } finally {
      setWoSubmitting(false);
    }
  };

  // For camera, manuals, inspections — render full-page views
  if (activeView === 'camera') {
    return (
      <main className="center">
        <div className="center-head">
          <div>
            <div className="center-title">{ac.tailNumber} — Exterior capture</div>
            <div className="center-route">Browser camera / upload · Gemini exterior inspection · {ac.name}</div>
            <div className="center-bay">{ac.bayLocation}</div>
          </div>
          <span className={`badge badge-${ac.status}`}>{ac.status}</span>
        </div>
        <div className="pane active">
          <CameraPanel cameraData={cameraData} aircraft={ac} onExteriorAnalyzed={onRefresh} />
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
          <InspectionChecklist
            inspections={inspections}
            exteriorZonePhotos={exteriorZonePhotos || []}
            onToggle={onToggleInspection}
            aircraftTail={ac.tailNumber}
            onRefreshExterior={onRefresh}
          />
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
        <div className="section-title">New work order</div>
        <form className="wo-add-form" onSubmit={handleAddWorkOrder}>
          <input
            className="wo-add-input wo-add-title"
            type="text"
            placeholder="Title (e.g. Replace hydraulic line per AMM)"
            value={woTitle}
            onChange={(e) => setWoTitle(e.target.value)}
            maxLength={220}
            autoComplete="off"
          />
          <div className="wo-add-row">
            <select className="wo-add-select" value={woType} onChange={(e) => setWoType(e.target.value)} aria-label="Work order type">
              <option value="Inspection">Inspection</option>
              <option value="Corrective">Corrective</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Deferred">Deferred</option>
            </select>
            <select className="wo-add-select" value={woPriority} onChange={(e) => setWoPriority(e.target.value)} aria-label="Priority">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <label className="wo-add-days-label">
              <span className="wo-add-days-text">Due in</span>
              <input
                className="wo-add-days"
                type="number"
                min={1}
                max={365}
                value={woDays}
                onChange={(e) => setWoDays(Number(e.target.value))}
              />
              <span className="wo-add-days-text">days</span>
            </label>
          </div>
          {woError && <div className="wo-add-error">{woError}</div>}
          <button type="submit" className="wo-add-submit" disabled={woSubmitting}>
            {woSubmitting ? 'Adding…' : 'Add work order'}
          </button>
        </form>

        <div className="section-title" style={{ marginTop: 20 }}>Open work orders</div>
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
