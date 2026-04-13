const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Internal Components Template ──
function makeInternalComponents(overrides = {}) {
  const defaults = {
    'Environmental Control (ECS)': { health: 0, trend: '-', zone: '-' },
    'Electrical Power System': { health: 0, trend: '-', zone: '-' },
    'Fuel System': { health: 0, trend: '-', zone: '-' },
    'Pressurization System': { health: 0, trend: '-', zone: '-' },
    'Pneumatics / Bleed Air': { health: 0, trend: '-', zone: '-' },
    'Fire Protection System': { health: 0, trend: '-', zone: '-' },
    'Oxygen System': { health: 0, trend: '-', zone: '-' },
    'Flight Control Actuators': { health: 0, trend: '-', zone: '-' },
  };
  return { ...defaults, ...overrides };
}

// ── Camera Zones Template ──
function makeCameraZones(overrides = []) {
  const defaults = [
    { id: 'nose', name: 'Nose Section', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'left-wing', name: 'Left Wing Leading Edge', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'right-wing', name: 'Right Wing Leading Edge', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'engine-1', name: 'Engine 1 Cowling', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'engine-2', name: 'Engine 2 Cowling', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'landing-gear-nose', name: 'Nose Landing Gear', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'landing-gear-main-l', name: 'Left Main Landing Gear', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'landing-gear-main-r', name: 'Right Main Landing Gear', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'belly', name: 'Fuselage Belly Panels', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'empennage', name: 'Empennage', description: '-', status: '-', lastInspected: '-', findings: 0 },
    { id: 'apu-bay', name: 'APU Bay', description: '-', status: '-', lastInspected: '-', findings: 0 },
  ];
  const zones = [...defaults];
  overrides.forEach((ov) => {
    const idx = zones.findIndex((z) => z.id === ov.id);
    if (idx >= 0) zones[idx] = { ...zones[idx], ...ov };
  });
  return zones;
}

// ── Maintenance Manuals Template ──
function makeManuals(aircraftType) {
  return [
    { chapter: '-', title: '-', system: '-', description: '-', procedures: [] }
  ];
}

// ── Inspection Checklist Template ──
function makeInspectionChecklist() {
  return [
    { zone: '-', items: [] }
  ];
}

// ── Shared Zero Fleet Object ──
const genericFleetData = {
  health: 0,
  status: '-',
  bayLocation: '-',
  assignedMechanic: '-',
  components: {
    'Engine 1': { health: 0, trend: '-' },
    'Engine 2': { health: 0, trend: '-' },
    'Landing Gear': { health: 0, trend: '-' },
    Hydraulics: { health: 0, trend: '-' },
    Avionics: { health: 0, trend: '-' },
    APU: { health: 0, trend: '-' },
  },
  internalComponents: makeInternalComponents(),
  cameraZones: makeCameraZones(),
  maintenanceManuals: makeManuals(''),
  inspectionChecklist: makeInspectionChecklist(),
  workOrders: [],
  alerts: [],
  aiConfidence: '-',
  savings: '-',
  savingsEvents: '-',
  riskFactors: [],
  predictions: {
    labels: [],
    datasets: [],
  },
  toolsRequired: [],
  safetyNotes: [],
};

// ── Fleet Data ──
const fleet = {
  N787CC: { name: '-', route: '-', ...genericFleetData },
  N777AD: { name: '-', route: '-', ...genericFleetData },
  N737BA: { name: '-', route: '-', ...genericFleetData },
  N738EB: { name: '-', route: '-', ...genericFleetData },
  N789FG: { name: '-', route: '-', ...genericFleetData },
  N747HJ: { name: '-', route: '-', ...genericFleetData },
};

// ── Routes ──

app.get('/api/fleet', (req, res) => {
  const summary = Object.entries(fleet).map(([tailNumber, data]) => ({
    tailNumber,
    name: data.name,
    health: data.health,
    status: data.status,
    route: data.route,
    bayLocation: data.bayLocation,
    assignedMechanic: data.assignedMechanic,
    alertCount: data.alerts.length,
  }));
  res.json(summary);
});

app.get('/api/fleet/metrics', (req, res) => {
  res.json({
    aircraftCount: 0,
    averageHealth: 0,
    totalAlerts: 0,
    criticalCount: 0,
    pendingWorkOrders: 0,
    savingsYTD: '-',
  });
});

app.get('/api/aircraft/:tail', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, ...ac });
});

app.get('/api/aircraft/:tail/camera', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({
    tailNumber: req.params.tail,
    cameraStatus: { battery: '-', signal: '-', gyroAlignment: '-', mode: '-' },
    zones: ac.cameraZones,
  });
});

app.get('/api/aircraft/:tail/manuals', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, manuals: ac.maintenanceManuals });
});

app.get('/api/aircraft/:tail/inspections', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, checklist: ac.inspectionChecklist });
});

app.post('/api/aircraft/:tail/inspections/:itemId/toggle', (req, res) => {
  res.json({ success: true });
});

app.post('/api/aircraft/:tail/alerts/:index/acknowledge', (req, res) => {
  res.json({ success: true, remainingAlerts: [] });
});

app.patch('/api/aircraft/:tail/workorders/:index', (req, res) => {
  res.json({ success: true, workOrders: [] });
});

app.listen(PORT, () => {
  console.log(`AeroMind Ground Ops API running on port ${PORT}`);
});
