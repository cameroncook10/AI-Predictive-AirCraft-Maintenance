const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Fleet Data ──
const fleet = {
  N787CC: {
    name: 'Boeing 787-9',
    route: 'LAX → JFK → LHR',
    health: 78,
    status: 'warning',
    components: {
      'Engine 1': { health: 91, trend: '→ stable' },
      'Engine 2': { health: 67, trend: '↓ declining' },
      'Landing Gear': { health: 88, trend: '→ stable' },
      Hydraulics: { health: 82, trend: '→ stable' },
      Avionics: { health: 95, trend: '→ stable' },
      APU: { health: 74, trend: '↓ declining' },
    },
    workOrders: [
      { title: 'Engine 2 sensor calibration', priority: 'high', days: 5, type: 'Predictive AI' },
      { title: 'APU oil pressure check', priority: 'medium', days: 12, type: 'Predictive AI' },
      { title: 'Annual C-check', priority: 'low', days: 47, type: 'Scheduled' },
    ],
    alerts: [
      { message: 'Engine 2 vibration sensor anomaly detected', severity: 'warning', time: '47m ago' },
      { message: 'APU oil pressure 8% below nominal range', severity: 'warning', time: '2h ago' },
      { message: 'AI recommends maintenance window in 5 days', severity: 'info', time: '4h ago' },
    ],
    aiConfidence: '89%',
    savings: '$148K',
    savingsEvents: '−2',
    riskFactors: [
      { name: 'Engine 2 vibration', pct: 73 },
      { name: 'APU oil system', pct: 58 },
      { name: 'Fuel efficiency drift', pct: 29 },
    ],
    predictions: {
      labels: ['0d', '10d', '20d', '30d', '40d', '50d', '60d', '70d', '80d', '90d'],
      datasets: [
        { label: 'Engine 2', data: [48, 55, 62, 68, 74, 79, 84, 88, 92, 95], color: '#e84040' },
        { label: 'APU', data: [35, 38, 42, 47, 51, 55, 59, 63, 66, 69], color: '#f5a623' },
      ],
    },
  },
  N777AD: {
    name: 'Boeing 777-300',
    route: 'JFK → CDG',
    health: 62,
    status: 'critical',
    components: {
      'Engine 1': { health: 78, trend: '↓ declining' },
      'Engine 2': { health: 83, trend: '→ stable' },
      'Landing Gear': { health: 44, trend: '↓↓ critical' },
      Hydraulics: { health: 59, trend: '↓ declining' },
      Avionics: { health: 91, trend: '→ stable' },
      APU: { health: 70, trend: '→ stable' },
    },
    workOrders: [
      { title: 'Landing gear hydraulic repair', priority: 'critical', days: 1, type: 'URGENT' },
      { title: 'Hydraulic system flush', priority: 'high', days: 3, type: 'Predictive AI' },
      { title: 'Engine 1 borescope inspection', priority: 'medium', days: 8, type: 'Predictive AI' },
    ],
    alerts: [
      { message: 'CRITICAL: Landing gear hydraulic pressure −22%', severity: 'critical', time: '12m ago' },
      { message: 'Hydraulic fluid below minimum threshold', severity: 'critical', time: '31m ago' },
      { message: 'Engine 1 EGT trending above nominal range', severity: 'warning', time: '1h ago' },
    ],
    aiConfidence: '94%',
    savings: '$310K',
    savingsEvents: '−4',
    riskFactors: [
      { name: 'Landing gear hydraulics', pct: 91 },
      { name: 'Hydraulic system', pct: 78 },
      { name: 'Engine 1 EGT', pct: 52 },
    ],
    predictions: {
      labels: ['0d', '10d', '20d', '30d', '40d', '50d', '60d', '70d', '80d', '90d'],
      datasets: [
        { label: 'Landing Gear', data: [78, 82, 86, 90, 93, 95, 96, 97, 98, 99], color: '#e84040' },
        { label: 'Hydraulics', data: [62, 67, 71, 74, 77, 80, 82, 84, 86, 88], color: '#f5a623' },
      ],
    },
  },
  N737BA: {
    name: 'Boeing 737-800',
    route: 'ORD → LAX',
    health: 94,
    status: 'healthy',
    components: {
      'Engine 1': { health: 96, trend: '→ stable' },
      'Engine 2': { health: 93, trend: '→ stable' },
      'Landing Gear': { health: 91, trend: '↑ improving' },
      Hydraulics: { health: 97, trend: '→ stable' },
      Avionics: { health: 99, trend: '→ stable' },
      APU: { health: 88, trend: '↓ declining' },
    },
    workOrders: [
      { title: 'APU performance inspection', priority: 'low', days: 28, type: 'Scheduled' },
      { title: 'B-Check maintenance', priority: 'low', days: 45, type: 'Scheduled' },
    ],
    alerts: [
      { message: 'APU efficiency declining 2.1%/week, monitoring', severity: 'info', time: '3h ago' },
    ],
    aiConfidence: '96%',
    savings: '$62K',
    savingsEvents: '−1',
    riskFactors: [
      { name: 'APU degradation', pct: 42 },
      { name: 'Engine wear patterns', pct: 18 },
      { name: 'Hydraulic seals', pct: 12 },
    ],
    predictions: {
      labels: ['0d', '10d', '20d', '30d', '40d', '50d', '60d', '70d', '80d', '90d'],
      datasets: [
        { label: 'APU', data: [28, 31, 35, 40, 44, 48, 52, 55, 58, 61], color: '#f5a623' },
        { label: 'Engine wear', data: [12, 13, 14, 15, 17, 18, 20, 21, 23, 24], color: '#4a9eff' },
      ],
    },
  },
  N738EB: {
    name: 'Boeing 737 MAX 9',
    route: 'DEN → SEA → ANC',
    health: 89,
    status: 'healthy',
    components: {
      'Engine 1': { health: 94, trend: '→ stable' },
      'Engine 2': { health: 92, trend: '→ stable' },
      'Landing Gear': { health: 88, trend: '→ stable' },
      Hydraulics: { health: 91, trend: '→ stable' },
      Avionics: { health: 97, trend: '↑ improving' },
      APU: { health: 84, trend: '→ stable' },
    },
    workOrders: [
      { title: 'Scheduled B-check maintenance', priority: 'low', days: 32, type: 'Scheduled' },
    ],
    alerts: [
      { message: 'All systems nominal — no anomalies detected', severity: 'info', time: '1h ago' },
    ],
    aiConfidence: '97%',
    savings: '$41K',
    savingsEvents: '0',
    riskFactors: [
      { name: 'APU efficiency trend', pct: 31 },
      { name: 'Brake pad wear', pct: 22 },
      { name: 'Fuel nozzle coking', pct: 11 },
    ],
    predictions: {
      labels: ['0d', '10d', '20d', '30d', '40d', '50d', '60d', '70d', '80d', '90d'],
      datasets: [
        { label: 'APU', data: [24, 26, 28, 30, 32, 34, 37, 39, 41, 44], color: '#f5a623' },
        { label: 'Brake wear', data: [18, 20, 22, 24, 26, 28, 30, 31, 33, 35], color: '#4a9eff' },
      ],
    },
  },
  N789FG: {
    name: 'Boeing 787-10',
    route: 'MIA → GRU',
    health: 71,
    status: 'warning',
    components: {
      'Engine 1': { health: 76, trend: '↓ declining' },
      'Engine 2': { health: 80, trend: '→ stable' },
      'Landing Gear': { health: 83, trend: '→ stable' },
      Hydraulics: { health: 72, trend: '↓ declining' },
      Avionics: { health: 93, trend: '→ stable' },
      APU: { health: 68, trend: '↓ declining' },
    },
    workOrders: [
      { title: 'Engine 1 compressor wash', priority: 'medium', days: 9, type: 'Predictive AI' },
      { title: 'Hydraulic seals replacement', priority: 'high', days: 7, type: 'Predictive AI' },
      { title: 'APU thermal inspection', priority: 'medium', days: 15, type: 'Predictive AI' },
    ],
    alerts: [
      { message: 'Engine 1 compressor efficiency at 76%, degrading', severity: 'warning', time: '1h ago' },
      { message: 'APU exhaust temp variance detected', severity: 'warning', time: '3h ago' },
    ],
    aiConfidence: '87%',
    savings: '$198K',
    savingsEvents: '−3',
    riskFactors: [
      { name: 'Engine 1 compressor', pct: 64 },
      { name: 'APU thermal profile', pct: 58 },
      { name: 'Hydraulic seals', pct: 47 },
    ],
    predictions: {
      labels: ['0d', '10d', '20d', '30d', '40d', '50d', '60d', '70d', '80d', '90d'],
      datasets: [
        { label: 'Engine 1', data: [44, 49, 54, 59, 64, 68, 72, 76, 80, 84], color: '#e84040' },
        { label: 'Hydraulics', data: [38, 42, 46, 49, 52, 55, 58, 61, 64, 67], color: '#f5a623' },
      ],
    },
  },
  N747HJ: {
    name: 'Boeing 747-8F',
    route: 'ANC → NRT → ICN',
    health: 85,
    status: 'healthy',
    components: {
      'Engine 1': { health: 88, trend: '→ stable' },
      'Engine 2': { health: 91, trend: '→ stable' },
      'Engine 3': { health: 84, trend: '↓ declining' },
      'Engine 4': { health: 87, trend: '→ stable' },
      Hydraulics: { health: 89, trend: '→ stable' },
      APU: { health: 81, trend: '→ stable' },
    },
    workOrders: [
      { title: 'Engine 3 performance check', priority: 'medium', days: 14, type: 'Predictive AI' },
      { title: 'Cargo door seal inspection', priority: 'low', days: 22, type: 'Scheduled' },
    ],
    alerts: [
      { message: 'Engine 3 fuel flow slightly above nominal band', severity: 'info', time: '5h ago' },
    ],
    aiConfidence: '92%',
    savings: '$87K',
    savingsEvents: '−1',
    riskFactors: [
      { name: 'Engine 3 fuel flow', pct: 38 },
      { name: 'Main tire wear', pct: 29 },
      { name: 'Cargo door seals', pct: 18 },
    ],
    predictions: {
      labels: ['0d', '10d', '20d', '30d', '40d', '50d', '60d', '70d', '80d', '90d'],
      datasets: [
        { label: 'Engine 3', data: [28, 31, 33, 36, 39, 42, 45, 47, 50, 52], color: '#f5a623' },
        { label: 'Tire wear', data: [20, 23, 26, 29, 32, 35, 38, 40, 43, 45], color: '#4a9eff' },
      ],
    },
  },
};

// ── Routes ──

// Get fleet summary (all aircraft with basic info)
app.get('/api/fleet', (req, res) => {
  const summary = Object.entries(fleet).map(([tailNumber, data]) => ({
    tailNumber,
    name: data.name,
    health: data.health,
    status: data.status,
    route: data.route,
    alertCount: data.alerts.length,
  }));
  res.json(summary);
});

// Get fleet-wide metrics
app.get('/api/fleet/metrics', (req, res) => {
  const tails = Object.values(fleet);
  const avgHealth = Math.round(tails.reduce((s, a) => s + a.health, 0) / tails.length);
  const totalAlerts = tails.reduce((s, a) => s + a.alerts.length, 0);
  res.json({
    aircraftCount: tails.length,
    averageHealth: avgHealth,
    totalAlerts,
    savingsYTD: '$4.2M',
  });
});

// Get single aircraft details
app.get('/api/aircraft/:tail', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, ...ac });
});

// Acknowledge an alert (simulated)
app.post('/api/aircraft/:tail/alerts/:index/acknowledge', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= ac.alerts.length) return res.status(404).json({ error: 'Alert not found' });
  ac.alerts.splice(idx, 1);
  res.json({ success: true, remainingAlerts: ac.alerts });
});

// Update work order status (simulated)
app.patch('/api/aircraft/:tail/workorders/:index', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= ac.workOrders.length) return res.status(404).json({ error: 'Work order not found' });
  const { status } = req.body;
  if (status === 'completed') {
    ac.workOrders.splice(idx, 1);
  }
  res.json({ success: true, workOrders: ac.workOrders });
});

app.listen(PORT, () => {
  console.log(`AeroMind API running on port ${PORT}`);
});
