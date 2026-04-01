const BASE = '/api';

export async function fetchFleet() {
  const res = await fetch(`${BASE}/fleet`);
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${BASE}/fleet/metrics`);
  return res.json();
}

export async function fetchAircraft(tail) {
  const res = await fetch(`${BASE}/aircraft/${tail}`);
  return res.json();
}

export async function acknowledgeAlert(tail, index) {
  const res = await fetch(`${BASE}/aircraft/${tail}/alerts/${index}/acknowledge`, {
    method: 'POST',
  });
  return res.json();
}

export async function completeWorkOrder(tail, index) {
  const res = await fetch(`${BASE}/aircraft/${tail}/workorders/${index}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' }),
  });
  return res.json();
}
