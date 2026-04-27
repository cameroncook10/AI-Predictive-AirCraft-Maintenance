const http = require('http');
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
// Synthetic demo content aligned with common ATA chapter numbering (not OEM manual text).
function makeManuals() {
  return [
    { chapter: '-', title: '-', system: '-', description: '-', procedures: [] },
  ];
}

const manualsB787 = [
  {
    chapter: 'ATA 05',
    title: 'Time Limits / Maintenance Checks',
    system: 'General',
    description: 'Interval planning for letter checks, systems operational tests, and zonal inspections for composite airframe programs.',
    procedures: [
      'Confirm MPD / operator AMP revision in effect before scheduling work.',
      'Record hours, cycles, and calendar limits; flag approaching limits in MRO system.',
      'Coordinate ETOPS-related tasks only after verifying configuration and relief items.',
    ],
  },
  {
    chapter: 'ATA 21',
    title: 'Air Conditioning — Pack Cooling Performance',
    system: 'ECS',
    description: 'Ground verification of pack operation, flow control, and trim air when external air or APU bleed is available.',
    procedures: [
      'Apply electrical power; verify cockpit ECS synoptic matches selected sources.',
      'With packs ON, monitor duct pressure and temperature trends for both packs.',
      'If pack trips or overheat annunciates, remove bleed load and consult fault isolation index.',
    ],
  },
  {
    chapter: 'ATA 24',
    title: 'Electrical Power — External GPU Handover',
    system: 'Electrical',
    description: 'Safe transition between ground power and aircraft generators without bus transients.',
    procedures: [
      'Confirm GPU voltage and frequency within limits before connect.',
      'Energize AC buses via external power; verify source annunciators.',
      'Before pushback, transfer sources per operator SOP; confirm galley/in-flight loads shed if required.',
    ],
  },
  {
    chapter: 'ATA 27',
    title: 'Flight Controls — Flight Control Electronics Self-Test',
    system: 'Flight Controls',
    description: 'FCE / actuator health checks with hydraulics configured per maintenance mode matrix.',
    procedures: [
      'Set control surfaces depowered or inhibited per AMM task prerequisites.',
      'Run maintenance BITE from maintenance laptop or onboard maintenance access.',
      'Capture fault codes, reset only if task permits, and re-run test to verify clear.',
    ],
  },
  {
    chapter: 'ATA 29',
    title: 'Hydraulic Power — System Pressurization and Leak Check',
    system: 'Hydraulics',
    description: 'Pressurize systems for ground servicing checks and inspect for external leakage at manifolds and actuators.',
    procedures: [
      'Verify reservoir quantity and brake wear pins within limits where applicable.',
      'Pressurize selected system; use cardboard / clean rag method at suspect joints—no open spray.',
      'Depressurize, install safety caps, and placard if dispatch with partial hydraulic capability.',
    ],
  },
  {
    chapter: 'ATA 32',
    title: 'Landing Gear — Extension and Retraction Operational Test',
    system: 'Landing Gear',
    description: 'Ground swing of gear using approved hydraulic/electrical configuration and safety zones.',
    procedures: [
      'Clear personnel and equipment from gear wheel wells; install gear safety pins as required.',
      'Perform swing per task card sequence; listen for normal actuator timing.',
      'Leave gear pinned or down-locked if maintenance incomplete; tag controls.',
    ],
  },
  {
    chapter: 'ATA 49',
    title: 'Airborne Auxiliary Power — Start and Load Sharing',
    system: 'APU',
    description: 'APU start envelope, bleed and electrical load management on ground.',
    procedures: [
      'Verify fire detection loop healthy and fire bottle armed per configuration.',
      'Start APU; monitor EGT trend and stabilize before applying bleed or AC load.',
      'Shutdown with cool-down interval; log hours and any exceedance data.',
    ],
  },
  {
    chapter: 'ATA 71',
    title: 'Power Plant — Engine Ground Run Precautions',
    system: 'Engines',
    description: 'Hazard controls for high-power runs including blast fence, FOD, and fire watch.',
    procedures: [
      'Position aircraft per station diagram; confirm intake and exhaust hazard zones clear.',
      'Complete fire watch briefing; have extinguishers staged and communications tested.',
      'Adhere to max run time and vibration limits; abort on abnormal EGT or oil pressure.',
    ],
  },
];

const manualsB777 = [
  {
    chapter: 'ATA 12',
    title: 'Servicing — Potable Water and Lavatory',
    system: 'Water / Waste',
    description: 'Ground servicing panels, tank quantity verification, and spill containment.',
    procedures: [
      'Connect approved potable water hose; fill to indicated quantity without overfill.',
      'Service waste tank per GSE procedure; wear PPE and verify cap security and leak check.',
      'Update logbook entries for water quality checks if operator policy requires.',
    ],
  },
  {
    chapter: 'ATA 21',
    title: 'Pressurization — Outflow Valve Functional Check',
    system: 'Pressurization',
    description: 'Verify automatic and manual modes of cabin pressure control on ground.',
    procedures: [
      'Configure packs and bleed as task requires; confirm doors closed and slides armed state noted.',
      'Command modes on pressurization controller; monitor outflow valve travel vs. command.',
      'Return system to ground mode; confirm no residual cabin differential.',
    ],
  },
  {
    chapter: 'ATA 24',
    title: 'Batteries — Main Battery Capacity Check',
    system: 'Electrical',
    description: 'Capacity / integrity checks for main ship battery installations.',
    procedures: [
      'Isolate battery bus per task; measure open-circuit voltage and temperature.',
      'Apply controlled load bank if procedure specifies; record voltage decay curve.',
      'Reconnect with torque on terminals per hardware standard; install anti-corrosion compound if approved.',
    ],
  },
  {
    chapter: 'ATA 27',
    title: 'High-Lift Devices — Trailing Edge Flap Skew Monitoring',
    system: 'Flight Controls',
    description: 'Interpret skew and asymmetry sensors during slow drive tests.',
    procedures: [
      'Hydraulic power ON with flight controls depowered per interlock matrix.',
      'Drive flaps in increments; compare L/R position indications and sensor health flags.',
      'If skew detected, stop drive, install locks, and open structural inspection if required.',
    ],
  },
  {
    chapter: 'ATA 28',
    title: 'Fuel — Crossfeed Valve Operational Check',
    system: 'Fuel',
    description: 'Verify motor-operated valves transition and position indication.',
    procedures: [
      'Confirm tanks quantities allow safe crossfeed without unbalance limits.',
      'Toggle crossfeed; verify cockpit indication matches valve position sensors.',
      'Return to normal configuration; confirm leak-free at access panel after thermal soak if task requires.',
    ],
  },
  {
    chapter: 'ATA 32',
    title: 'Brakes — Carbon Brake Wear Pin Inspection',
    system: 'Landing Gear',
    description: 'Measure wear indicators and compare to remaining life charts.',
    procedures: [
      'Cool brakes if recently operated; use wheel fan caution per SOP.',
      'Measure each pin with approved gauge; photograph if near limit.',
      'If at or below limit, plan wheel change and update component tracking.',
    ],
  },
  {
    chapter: 'ATA 36',
    title: 'Pneumatic — Bleed Air Leak Isolation',
    system: 'Bleed Air',
    description: 'Segment isolation to locate high-temperature duct leaks on ground.',
    procedures: [
      'Stage bleed sources one at a time; monitor wing leak detection loops.',
      'Use ultrasonic or soapy water method only where procedure allows and fire risk controlled.',
      'Document isolated segment and apply temporary operational limitations if MEL applies.',
    ],
  },
  {
    chapter: 'ATA 79',
    title: 'Oil — Engine Oil Servicing',
    system: 'Engines',
    description: 'Servicing quantities, cap security, and magnetic chip detector quick check.',
    procedures: [
      'Stabilize oil level after short ground run if task specifies.',
      'Servicing to correct band on sight glass or qty sensor validation.',
      'Inspect chip detector for ferrous debris; if metal present, hold dispatch and notify engineering.',
    ],
  },
];

const manualsB737 = [
  {
    chapter: 'ATA 21',
    title: 'Air Conditioning — Pack and Zone Temperature Control',
    system: 'ECS',
    description: 'Ground checks of pack valves, zone temp controllers, and trim air.',
    procedures: [
      'Configure bleed air source per station limitations (APU vs. external).',
      'Verify zone temps track selected temps within tolerance during steady-state.',
      'If pack trips, remove load and check fault history before reset.',
    ],
  },
  {
    chapter: 'ATA 24',
    title: 'Generators — IDG Disconnect and Reset',
    system: 'Electrical',
    description: 'Verify disconnect mechanism and proper reset sequence on ground.',
    procedures: [
      'Confirm IDG disconnect lever/circuit healthy; never disconnect in flight via maintenance simulation.',
      'Perform disconnect test only with engine windmilling or speed per task.',
      'Reset and verify drive oil quantity and generator load share test if required.',
    ],
  },
  {
    chapter: 'ATA 27',
    title: 'Flight Controls — Aileron and Rudder Power Control Units',
    system: 'Flight Controls',
    description: 'Hydraulic PCU rigging checks and jammed flight control isolation awareness.',
    procedures: [
      'Depower flight controls as required; tag cockpit switches.',
      'Command surfaces via maintenance interlocks; verify travel stops and symmetry.',
      'Restore to flight configuration; remove maintenance locks and verify flight control check.',
    ],
  },
  {
    chapter: 'ATA 29',
    title: 'Hydraulics — System A / B Quantity and Case Drain Flow',
    system: 'Hydraulics',
    description: 'Reservoir servicing and case drain monitoring as leak indicators.',
    procedures: [
      'Verify quantities at cold soak vs. hot stabilized per chart.',
      'Run pumps briefly; observe case drain flowmeter within limits if installed.',
      'Servicing with correct fluid spec; cap and torque per standard.',
    ],
  },
  {
    chapter: 'ATA 30',
    title: 'Ice and Rain Protection — Wing Anti-Ice Valve Test',
    system: 'Anti-Ice',
    description: 'Ground proof of wing thermal anti-ice valve modulation and leak indications.',
    procedures: [
      'Bleed and electrical configuration per cold weather maintenance supplement.',
      'Command wing anti-ice; monitor duct pressure and valve position.',
      'Shutdown and inspect for hot bleed leak at wing leading edge panels if indications present.',
    ],
  },
  {
    chapter: 'ATA 32',
    title: 'Landing Gear — Torque Link and Side Stay Lubrication',
    system: 'Landing Gear',
    description: 'Zonal greasing and inspection for nose and main gear pivot points.',
    procedures: [
      'Clean old lubricant and debris from fittings; inspect for cracks in torque links.',
      'Apply approved grease type to fittings list; purge until fresh grease visible.',
      'Cycle gear or bounce strut if task requires redistribution of grease.',
    ],
  },
  {
    chapter: 'ATA 34',
    title: 'Navigation — ADIRU Ground Alignment',
    system: 'Avionics',
    description: 'Align IRUs on ground; verify position entry and residual drift limits.',
    procedures: [
      'Ensure aircraft stationary; enter present position per SOP.',
      'Allow full alignment countdown; verify no motion detected faults.',
      'Cross-check FMC position with known gate coordinates before release.',
    ],
  },
  {
    chapter: 'ATA 52',
    title: 'Doors — Passenger Door Mode Select and Girt Bar',
    system: 'Doors',
    description: 'Verify armed/disarmed logic and slide readiness indications on ground.',
    procedures: [
      'With door closed, exercise girt bar to armed and disarmed; confirm annunciators.',
      'Operate slow-opening procedure if maintenance door check requires.',
      'Document door seal condition and emergency handle seal integrity.',
    ],
  },
];

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
  maintenanceManuals: makeManuals(),
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
  N787CC: { name: 'Boeing 787-9', route: 'DEN–LHR', ...genericFleetData, maintenanceManuals: manualsB787 },
  N777AD: { name: 'Boeing 777-300ER', route: 'SFO–NRT', ...genericFleetData, maintenanceManuals: manualsB777 },
  N737BA: { name: 'Boeing 737-800', route: 'ORD–ATL', ...genericFleetData, maintenanceManuals: manualsB737 },
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

// Use http.Server directly so listen failures (e.g. EADDRINUSE) do not reuse the
// success callback — Express app.listen wires server 'error' to the same once()
// wrapper as the listening callback, which can print "running" then exit with no server.
const server = http.createServer(app);
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use (another AeroMind / Node process?). Stop it or set PORT to a free port.`
    );
  } else {
    console.error('Server failed to start:', err.message);
  }
  process.exit(1);
});
server.listen(PORT, () => {
  console.log(`AeroMind Ground Ops API running on port ${PORT}`);
});
