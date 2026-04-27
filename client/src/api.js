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

export async function fetchCamera(tail) {
  const res = await fetch(`${BASE}/aircraft/${tail}/camera`, { cache: 'no-store' });
  return res.json();
}

export async function fetchManuals(tail) {
  const res = await fetch(`${BASE}/aircraft/${tail}/manuals`);
  return res.json();
}

export async function fetchInspections(tail) {
  const res = await fetch(`${BASE}/aircraft/${tail}/inspections`, { cache: 'no-store' });
  return res.json();
}

export async function toggleInspectionItem(tail, itemId, notes) {
  const res = await fetch(`${BASE}/aircraft/${tail}/inspections/${itemId}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
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

export async function createWorkOrder(tail, { title, type, priority, days }) {
  const res = await fetch(`${BASE}/aircraft/${tail}/workorders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, type, priority, days }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Send a captured exterior photo to the FastAPI backend; Gemini analyzes fuselage / paint / visible damage.
 * @param {Blob|File} imageBlob - JPEG/PNG from canvas or file input
 * @param {{ runId?: string, aircraftContext?: string, aircraftTail?: string, zoneId?: string }} [opts]
 */
export async function analyzeExteriorImage(imageBlob, opts = {}) {
  const form = new FormData();
  form.append('file', imageBlob, imageBlob instanceof File ? imageBlob.name : 'exterior.jpg');
  if (opts.runId) form.append('run_id', opts.runId);
  if (opts.aircraftContext) form.append('aircraft_context', opts.aircraftContext);
  if (opts.aircraftTail) form.append('aircraft_tail', opts.aircraftTail);
  if (opts.zoneId) form.append('zone_id', opts.zoneId);
  const res = await fetch(`${BASE}/analysis/exterior`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Analyze all unreviewed zone captures for this tail (stills in zone_captures with no result row for that file yet).
 * @param {string} aircraftTail
 * @param {{ aircraftContext?: string, maxFrames?: number }} [opts]
 */
export async function analyzeAllPendingExterior(aircraftTail, opts = {}) {
  const res = await fetch(`${BASE}/analysis/exterior/pending`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aircraft_tail: aircraftTail,
      aircraft_context: opts.aircraftContext || null,
      max_frames: opts.maxFrames ?? 50,
    }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * @param {string} tail
 * @param {string} captureId - zone capture id from the API
 */
export async function deleteExteriorZonePhoto(tail, captureId) {
  const res = await fetch(
    `${BASE}/aircraft/${encodeURIComponent(tail)}/exterior-zone-photos/${encodeURIComponent(captureId)}`,
    { method: 'DELETE' },
  );
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function postExteriorZonePhoto(tail, zoneId, imageBlob) {
  const form = new FormData();
  form.append('file', imageBlob, imageBlob instanceof File ? imageBlob.name : 'zone.jpg');
  const res = await fetch(
    `${BASE}/aircraft/${encodeURIComponent(tail)}/exterior-zones/${encodeURIComponent(zoneId)}/photo`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function sendChatMessage(messages, aircraftContext = null) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      aircraft_context: aircraftContext ? JSON.stringify(aircraftContext) : null,
    }),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Chat API error: ${res.status}`);
  }
  return res.json();
}
