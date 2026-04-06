const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Internal Components Template ──
function makeInternalComponents(overrides = {}) {
  const defaults = {
    'Environmental Control (ECS)': { health: 88, trend: '→ stable', zone: 'fuselage-center' },
    'Electrical Power System': { health: 91, trend: '→ stable', zone: 'wing-root' },
    'Fuel System': { health: 85, trend: '→ stable', zone: 'wing-tanks' },
    'Pressurization System': { health: 90, trend: '→ stable', zone: 'fuselage-center' },
    'Pneumatics / Bleed Air': { health: 82, trend: '→ stable', zone: 'engine-pylons' },
    'Fire Protection System': { health: 96, trend: '→ stable', zone: 'distributed' },
    'Oxygen System': { health: 93, trend: '→ stable', zone: 'fuselage-overhead' },
    'Flight Control Actuators': { health: 87, trend: '→ stable', zone: 'wing-trailing-edge' },
  };
  return { ...defaults, ...overrides };
}

// ── Camera Zones Template ──
function makeCameraZones(overrides = []) {
  const defaults = [
    { id: 'nose', name: 'Nose Section', description: 'Radome, pitot tubes, AOA vanes, windshield', status: 'ready', lastInspected: '2d ago', findings: 0 },
    { id: 'left-wing', name: 'Left Wing Leading Edge', description: 'Slats, de-ice boots, static wicks, nav lights', status: 'ready', lastInspected: '2d ago', findings: 0 },
    { id: 'right-wing', name: 'Right Wing Leading Edge', description: 'Slats, de-ice boots, static wicks, nav lights', status: 'ready', lastInspected: '2d ago', findings: 0 },
    { id: 'engine-1', name: 'Engine 1 Cowling', description: 'Fan blades, inlet, cowl latches, thrust reverser', status: 'ready', lastInspected: '1d ago', findings: 0 },
    { id: 'engine-2', name: 'Engine 2 Cowling', description: 'Fan blades, inlet, cowl latches, thrust reverser', status: 'ready', lastInspected: '1d ago', findings: 0 },
    { id: 'landing-gear-nose', name: 'Nose Landing Gear', description: 'Strut, tires, steering actuator, door seals', status: 'ready', lastInspected: '3d ago', findings: 0 },
    { id: 'landing-gear-main-l', name: 'Left Main Landing Gear', description: 'Strut, tires, brake assemblies, hydraulic lines', status: 'ready', lastInspected: '3d ago', findings: 0 },
    { id: 'landing-gear-main-r', name: 'Right Main Landing Gear', description: 'Strut, tires, brake assemblies, hydraulic lines', status: 'ready', lastInspected: '3d ago', findings: 0 },
    { id: 'belly', name: 'Fuselage Belly Panels', description: 'Skin panels, antenna fairings, drain masts, cargo doors', status: 'ready', lastInspected: '5d ago', findings: 0 },
    { id: 'empennage', name: 'Empennage', description: 'Horizontal stabilizer, elevator, vertical fin, rudder', status: 'ready', lastInspected: '4d ago', findings: 0 },
    { id: 'apu-bay', name: 'APU Bay', description: 'APU exhaust, inlet door, fire bottle, oil level sight glass', status: 'ready', lastInspected: '2d ago', findings: 0 },
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
    { chapter: 'AMM 05-10', title: 'Time Limits / Maintenance Checks', system: 'General', description: 'Scheduled maintenance intervals, life-limited parts, certification requirements. Covers A/B/C/D check intervals.', procedures: ['A-Check walk-around', 'B-Check structural', 'C-Check heavy maintenance', 'Component life tracking'] },
    { chapter: 'AMM 12-11', title: 'Jack Points & Servicing', system: 'General', description: 'Aircraft jacking procedures, leveling, weighing, and ground servicing points.', procedures: ['Jacking procedure', 'Leveling check', 'Tire inflation', 'Fluid servicing'] },
    { chapter: 'AMM 21-00', title: 'Air Conditioning / ECS', system: 'Environmental Control (ECS)', description: 'Pack valves, temperature regulators, duct systems, recirculation fans. Ground test procedures for ECS packs.', procedures: ['Pack flow test', 'Temperature sensor calibration', 'Duct leak check', 'Recirculation fan inspection'] },
    { chapter: 'AMM 24-00', title: 'Electrical Power', system: 'Electrical Power System', description: 'Generator systems, transformer rectifier units, battery maintenance, bus tie operations.', procedures: ['Generator output test', 'Battery capacity check', 'Bus transfer test', 'Ground power connection'] },
    { chapter: 'AMM 28-00', title: 'Fuel System', system: 'Fuel System', description: 'Tank sealing, fuel pumps, crossfeed valves, fuel quantity indicating system, defueling procedures.', procedures: ['Fuel leak inspection', 'Pump pressure test', 'Tank sealant inspection', 'Fuel quantity calibration'] },
    { chapter: 'AMM 29-00', title: 'Hydraulic Power', system: 'Hydraulics', description: 'Hydraulic pump overhaul, reservoir servicing, filter replacement, system pressure test procedures.', procedures: ['System pressure check', 'Fluid contamination test', 'Filter replacement', 'Pump flow test'] },
    { chapter: 'AMM 32-00', title: 'Landing Gear', system: 'Landing Gear', description: 'Strut servicing, brake assembly replacement, tire changes, gear retraction test, weight-on-wheels sensors.', procedures: ['Strut pressure servicing', 'Brake wear measurement', 'Tire replacement', 'Gear swing test'] },
    { chapter: 'AMM 36-00', title: 'Pneumatics / Bleed Air', system: 'Pneumatics / Bleed Air', description: 'Bleed air regulation, precooler maintenance, check valve inspection, high-stage bleed system.', procedures: ['Bleed air leak test', 'Precooler inspection', 'Check valve test', 'Duct integrity check'] },
    { chapter: 'AMM 26-00', title: 'Fire Protection', system: 'Fire Protection System', description: 'Fire detection loops, extinguisher bottle maintenance, smoke detector testing, APU fire protection.', procedures: ['Fire loop resistance test', 'Bottle pressure/weight check', 'Smoke detector test', 'Squib continuity check'] },
    { chapter: 'AMM 35-00', title: 'Oxygen System', system: 'Oxygen System', description: 'Crew oxygen bottle servicing, passenger oxygen generators, masks and regulators, distribution system.', procedures: ['Bottle pressure check', 'Mask seal test', 'Regulator flow test', 'Distribution line leak check'] },
    { chapter: 'AMM 27-00', title: 'Flight Controls', system: 'Flight Control Actuators', description: 'Actuator rigging procedures, control surface travel checks, autopilot servo tests, cable tension measurement.', procedures: ['Control surface travel check', 'Actuator leak test', 'Cable tension measurement', 'Autopilot servo test'] },
    { chapter: 'AMM 71-00', title: 'Engine — Power Plant', system: 'Engine', description: 'Fan blade inspection, borescope procedures, oil system servicing, engine mount hardware inspection.', procedures: ['Fan blade visual inspection', 'Borescope (HPT/LPT)', 'Oil filter check & sample', 'Engine mount bolt torque'] },
    { chapter: 'AMM 49-00', title: 'APU', system: 'APU', description: 'APU overhaul intervals, oil servicing, inlet door rigging, exhaust temperature monitoring, fire bottle check.', procedures: ['Oil level/sample', 'Inlet door rigging', 'Exhaust temp trend review', 'Fire bottle check'] },
    { chapter: 'CMM 34-00', title: 'Avionics & Navigation', system: 'Avionics', description: 'IRS alignment procedures, radio altimeter calibration, transponder tests, TCAS operational checks.', procedures: ['IRS alignment test', 'Radio altimeter calibration', 'Transponder operational test', 'FMC database update'] },
  ];
}

// ── Inspection Checklist Template ──
function makeInspectionChecklist() {
  return [
    { zone: 'Nose Section', items: [
      { id: 'n1', task: 'Radome — check for dents, cracks, lightning strike marks', status: 'pending', notes: '' },
      { id: 'n2', task: 'Pitot tubes — verify covers removed, check for blockage', status: 'pending', notes: '' },
      { id: 'n3', task: 'AOA vanes — freedom of movement check', status: 'pending', notes: '' },
      { id: 'n4', task: 'Windshield — inspect for cracks, delamination', status: 'pending', notes: '' },
      { id: 'n5', task: 'Nose gear doors — check seals and hinge condition', status: 'pending', notes: '' },
    ]},
    { zone: 'Left Wing', items: [
      { id: 'lw1', task: 'Leading edge slats — track condition, actuator leaks', status: 'pending', notes: '' },
      { id: 'lw2', task: 'Static wicks — all present and undamaged', status: 'pending', notes: '' },
      { id: 'lw3', task: 'Navigation light — operational check', status: 'pending', notes: '' },
      { id: 'lw4', task: 'Flaps — track rollers, seals, actuator rods', status: 'pending', notes: '' },
      { id: 'lw5', task: 'Fuel tank vents — check for blockage', status: 'pending', notes: '' },
    ]},
    { zone: 'Right Wing', items: [
      { id: 'rw1', task: 'Leading edge slats — track condition, actuator leaks', status: 'pending', notes: '' },
      { id: 'rw2', task: 'Static wicks — all present and undamaged', status: 'pending', notes: '' },
      { id: 'rw3', task: 'Navigation light — operational check', status: 'pending', notes: '' },
      { id: 'rw4', task: 'Flaps — track rollers, seals, actuator rods', status: 'pending', notes: '' },
      { id: 'rw5', task: 'Fuel tank vents — check for blockage', status: 'pending', notes: '' },
    ]},
    { zone: 'Engines', items: [
      { id: 'e1', task: 'Fan blade visual — FOD damage, erosion, cracks', status: 'pending', notes: '' },
      { id: 'e2', task: 'Inlet cowl — dents, fastener condition', status: 'pending', notes: '' },
      { id: 'e3', task: 'Thrust reverser — blocker door condition, actuators', status: 'pending', notes: '' },
      { id: 'e4', task: 'Engine pylon — leak check (oil, fuel, hydraulic)', status: 'pending', notes: '' },
      { id: 'e5', task: 'Exhaust area — EGT probe condition, tail cone', status: 'pending', notes: '' },
    ]},
    { zone: 'Fuselage', items: [
      { id: 'f1', task: 'Skin panels — dents, corrosion, fastener condition', status: 'pending', notes: '' },
      { id: 'f2', task: 'Cargo door seals — condition and alignment', status: 'pending', notes: '' },
      { id: 'f3', task: 'Antenna fairings — secure, no cracks', status: 'pending', notes: '' },
      { id: 'f4', task: 'Drain masts — clear and unobstructed', status: 'pending', notes: '' },
      { id: 'f5', task: 'Service panel doors — latches secure', status: 'pending', notes: '' },
    ]},
    { zone: 'Undercarriage', items: [
      { id: 'u1', task: 'Nose gear — strut extension, tire wear/pressure', status: 'pending', notes: '' },
      { id: 'u2', task: 'Main gear L — strut extension, tire wear/pressure', status: 'pending', notes: '' },
      { id: 'u3', task: 'Main gear R — strut extension, tire wear/pressure', status: 'pending', notes: '' },
      { id: 'u4', task: 'Brake assemblies — pad wear, disc condition', status: 'pending', notes: '' },
      { id: 'u5', task: 'Hydraulic lines — leaks, chafing, clamp condition', status: 'pending', notes: '' },
    ]},
    { zone: 'Empennage', items: [
      { id: 'em1', task: 'Horizontal stabilizer — surface condition, hinge bolts', status: 'pending', notes: '' },
      { id: 'em2', task: 'Elevator — free play, actuator condition', status: 'pending', notes: '' },
      { id: 'em3', task: 'Vertical fin — skin condition, lightning diverters', status: 'pending', notes: '' },
      { id: 'em4', task: 'Rudder — hinge condition, actuator leaks', status: 'pending', notes: '' },
      { id: 'em5', task: 'APU exhaust — heat discoloration, cracks', status: 'pending', notes: '' },
    ]},
  ];
}

// ── Fleet Data ──
const fleet = {
  N787CC: {
    name: 'Boeing 787-9',
    route: 'LAX → JFK → LHR',
    health: 78,
    status: 'warning',
    bayLocation: 'Hangar 3 — Bay A2',
    assignedMechanic: 'J. Rodriguez',
    components: {
      'Engine 1': { health: 91, trend: '→ stable' },
      'Engine 2': { health: 67, trend: '↓ declining' },
      'Landing Gear': { health: 88, trend: '→ stable' },
      Hydraulics: { health: 82, trend: '→ stable' },
      Avionics: { health: 95, trend: '→ stable' },
      APU: { health: 74, trend: '↓ declining' },
    },
    internalComponents: makeInternalComponents({
      'Environmental Control (ECS)': { health: 79, trend: '↓ declining', zone: 'fuselage-center' },
      'Pneumatics / Bleed Air': { health: 71, trend: '↓ declining', zone: 'engine-pylons' },
    }),
    cameraZones: makeCameraZones([
      { id: 'engine-2', status: 'attention', findings: 2, lastInspected: '6h ago' },
      { id: 'apu-bay', status: 'attention', findings: 1, lastInspected: '12h ago' },
    ]),
    maintenanceManuals: makeManuals('787'),
    inspectionChecklist: makeInspectionChecklist(),
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
    toolsRequired: ['Borescope kit', 'Vibration analyzer', 'Torque wrench set (20-250 ft-lb)', 'Oil sampling kit'],
    safetyNotes: ['Engine 2 hot section — allow 4hr cooldown', 'APU fire bottle armed — verify before entry', 'Hydraulic system pressurized — bleed before work'],
  },
  N777AD: {
    name: 'Boeing 777-300',
    route: 'JFK → CDG',
    health: 62,
    status: 'critical',
    bayLocation: 'Hangar 1 — Bay B1',
    assignedMechanic: 'M. Chen',
    components: {
      'Engine 1': { health: 78, trend: '↓ declining' },
      'Engine 2': { health: 83, trend: '→ stable' },
      'Landing Gear': { health: 44, trend: '↓↓ critical' },
      Hydraulics: { health: 59, trend: '↓ declining' },
      Avionics: { health: 91, trend: '→ stable' },
      APU: { health: 70, trend: '→ stable' },
    },
    internalComponents: makeInternalComponents({
      'Electrical Power System': { health: 76, trend: '↓ declining', zone: 'wing-root' },
      'Flight Control Actuators': { health: 68, trend: '↓ declining', zone: 'wing-trailing-edge' },
      'Fuel System': { health: 73, trend: '↓ declining', zone: 'wing-tanks' },
    }),
    cameraZones: makeCameraZones([
      { id: 'landing-gear-main-l', status: 'critical', findings: 4, lastInspected: '2h ago' },
      { id: 'landing-gear-main-r', status: 'attention', findings: 2, lastInspected: '2h ago' },
      { id: 'belly', status: 'attention', findings: 1, lastInspected: '1d ago' },
    ]),
    maintenanceManuals: makeManuals('777'),
    inspectionChecklist: makeInspectionChecklist(),
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
    toolsRequired: ['Hydraulic test stand', 'Gear retraction test equipment', 'Brake pressure gauge', 'Strut servicing nitrogen'],
    safetyNotes: ['CRITICAL: Landing gear jacks in place before work', 'Hydraulic fluid SKYDROL — PPE mandatory', 'Weight-on-wheels bypass pin required'],
  },
  N737BA: {
    name: 'Boeing 737-800',
    route: 'ORD → LAX',
    health: 94,
    status: 'healthy',
    bayLocation: 'Hangar 2 — Bay C3',
    assignedMechanic: 'A. Williams',
    components: {
      'Engine 1': { health: 96, trend: '→ stable' },
      'Engine 2': { health: 93, trend: '→ stable' },
      'Landing Gear': { health: 91, trend: '↑ improving' },
      Hydraulics: { health: 97, trend: '→ stable' },
      Avionics: { health: 99, trend: '→ stable' },
      APU: { health: 88, trend: '↓ declining' },
    },
    internalComponents: makeInternalComponents(),
    cameraZones: makeCameraZones(),
    maintenanceManuals: makeManuals('737'),
    inspectionChecklist: makeInspectionChecklist(),
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
    toolsRequired: ['Standard A-check kit', 'APU oil sampling kit', 'Torque wrench set'],
    safetyNotes: ['APU bay — verify fire bottle status before entry', 'Standard FOD prevention required'],
  },
  N738EB: {
    name: 'Boeing 737 MAX 9',
    route: 'DEN → SEA → ANC',
    health: 89,
    status: 'healthy',
    bayLocation: 'Hangar 2 — Bay D1',
    assignedMechanic: 'K. Patel',
    components: {
      'Engine 1': { health: 94, trend: '→ stable' },
      'Engine 2': { health: 92, trend: '→ stable' },
      'Landing Gear': { health: 88, trend: '→ stable' },
      Hydraulics: { health: 91, trend: '→ stable' },
      Avionics: { health: 97, trend: '↑ improving' },
      APU: { health: 84, trend: '→ stable' },
    },
    internalComponents: makeInternalComponents({
      'Fuel System': { health: 82, trend: '→ stable', zone: 'wing-tanks' },
    }),
    cameraZones: makeCameraZones(),
    maintenanceManuals: makeManuals('737MAX'),
    inspectionChecklist: makeInspectionChecklist(),
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
    toolsRequired: ['Standard B-check kit', 'Brake measurement gauge'],
    safetyNotes: ['Standard FOD prevention required', 'Follow MAX-specific AD bulletins'],
  },
  N789FG: {
    name: 'Boeing 787-10',
    route: 'MIA → GRU',
    health: 71,
    status: 'warning',
    bayLocation: 'Hangar 3 — Bay A4',
    assignedMechanic: 'T. Nakamura',
    components: {
      'Engine 1': { health: 76, trend: '↓ declining' },
      'Engine 2': { health: 80, trend: '→ stable' },
      'Landing Gear': { health: 83, trend: '→ stable' },
      Hydraulics: { health: 72, trend: '↓ declining' },
      Avionics: { health: 93, trend: '→ stable' },
      APU: { health: 68, trend: '↓ declining' },
    },
    internalComponents: makeInternalComponents({
      'Environmental Control (ECS)': { health: 74, trend: '↓ declining', zone: 'fuselage-center' },
      'Pressurization System': { health: 77, trend: '↓ declining', zone: 'fuselage-center' },
      'Pneumatics / Bleed Air': { health: 69, trend: '↓ declining', zone: 'engine-pylons' },
    }),
    cameraZones: makeCameraZones([
      { id: 'engine-1', status: 'attention', findings: 3, lastInspected: '4h ago' },
      { id: 'belly', status: 'attention', findings: 2, lastInspected: '8h ago' },
    ]),
    maintenanceManuals: makeManuals('787'),
    inspectionChecklist: makeInspectionChecklist(),
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
    toolsRequired: ['Compressor wash rig', 'Hydraulic seal kit (787-10)', 'Thermal imaging camera', 'APU exhaust probe'],
    safetyNotes: ['Engine 1 compressor wash — fire watch required', 'APU exhaust hot — 2hr cooldown', 'Hydraulic SKYDROL — full PPE'],
  },
  N747HJ: {
    name: 'Boeing 747-8F',
    route: 'ANC → NRT → ICN',
    health: 85,
    status: 'healthy',
    bayLocation: 'Hangar 4 — Bay E1 (Wide)',
    assignedMechanic: 'R. Okonkwo',
    components: {
      'Engine 1': { health: 88, trend: '→ stable' },
      'Engine 2': { health: 91, trend: '→ stable' },
      'Engine 3': { health: 84, trend: '↓ declining' },
      'Engine 4': { health: 87, trend: '→ stable' },
      Hydraulics: { health: 89, trend: '→ stable' },
      APU: { health: 81, trend: '→ stable' },
    },
    internalComponents: makeInternalComponents({
      'Fuel System': { health: 80, trend: '↓ declining', zone: 'wing-tanks' },
      'Oxygen System': { health: 88, trend: '→ stable', zone: 'fuselage-overhead' },
    }),
    cameraZones: makeCameraZones([
      { id: 'engine-1', name: 'Engine 1 Cowling', status: 'ready', findings: 0 },
      { id: 'engine-2', name: 'Engine 2 Cowling', status: 'ready', findings: 0 },
    ]),
    maintenanceManuals: makeManuals('747'),
    inspectionChecklist: makeInspectionChecklist(),
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
    toolsRequired: ['Engine fuel flow test equipment', 'Cargo door seal inspection kit', 'Tire pressure gauge (747)'],
    safetyNotes: ['4-engine aircraft — verify all engines secured', 'Cargo door — use maintenance platform', 'FOD prevention — freighter cargo area'],
  },
};

// ── Routes ──

// Get fleet summary
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

// Get fleet-wide metrics
app.get('/api/fleet/metrics', (req, res) => {
  const tails = Object.values(fleet);
  const avgHealth = Math.round(tails.reduce((s, a) => s + a.health, 0) / tails.length);
  const totalAlerts = tails.reduce((s, a) => s + a.alerts.length, 0);
  const criticalCount = tails.filter((a) => a.status === 'critical').length;
  const pendingWOs = tails.reduce((s, a) => s + a.workOrders.length, 0);
  res.json({
    aircraftCount: tails.length,
    averageHealth: avgHealth,
    totalAlerts,
    criticalCount,
    pendingWorkOrders: pendingWOs,
    savingsYTD: '$4.2M',
  });
});

// Get single aircraft details
app.get('/api/aircraft/:tail', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, ...ac });
});

// Get camera zones for an aircraft
app.get('/api/aircraft/:tail/camera', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({
    tailNumber: req.params.tail,
    cameraStatus: { battery: '87%', signal: 'Strong', gyroAlignment: 'Calibrated', mode: 'Manual' },
    zones: ac.cameraZones,
  });
});

// Get maintenance manuals for an aircraft
app.get('/api/aircraft/:tail/manuals', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, manuals: ac.maintenanceManuals });
});

// Get inspection checklist for an aircraft
app.get('/api/aircraft/:tail/inspections', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  res.json({ tailNumber: req.params.tail, checklist: ac.inspectionChecklist });
});

// Toggle inspection item status
app.post('/api/aircraft/:tail/inspections/:itemId/toggle', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  for (const zone of ac.inspectionChecklist) {
    const item = zone.items.find((it) => it.id === req.params.itemId);
    if (item) {
      const cycle = { pending: 'pass', pass: 'fail', fail: 'skip', skip: 'pending' };
      item.status = cycle[item.status] || 'pending';
      if (req.body.notes !== undefined) item.notes = req.body.notes;
      return res.json({ success: true, item });
    }
  }
  res.status(404).json({ error: 'Inspection item not found' });
});

// Acknowledge an alert
app.post('/api/aircraft/:tail/alerts/:index/acknowledge', (req, res) => {
  const ac = fleet[req.params.tail];
  if (!ac) return res.status(404).json({ error: 'Aircraft not found' });
  const idx = parseInt(req.params.index, 10);
  if (idx < 0 || idx >= ac.alerts.length) return res.status(404).json({ error: 'Alert not found' });
  ac.alerts.splice(idx, 1);
  res.json({ success: true, remainingAlerts: ac.alerts });
});

// Update work order status
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
  console.log(`AeroMind Ground Ops API running on port ${PORT}`);
});
