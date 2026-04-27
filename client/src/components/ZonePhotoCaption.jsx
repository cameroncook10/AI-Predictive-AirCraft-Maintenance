export function formatIssueTypeLabel(issueType) {
  if (issueType == null || issueType === '') return '—';
  return String(issueType)
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function normalizeInspection(ins) {
  if (!ins) return null;
  return {
    issueType: ins.issueType ?? ins.issue_type,
    confidence: ins.confidence ?? 0,
    flagged: Boolean(ins.flagged),
    notes: ins.notes ?? null,
  };
}

export default function ZonePhotoCaption({ inspection, compact = true }) {
  const c = normalizeInspection(inspection);
  if (!c) return null;
  const pct = Math.round((Number(c.confidence) || 0) * 100);
  return (
    <div className={compact ? 'zone-photo-caption zone-photo-caption--compact' : 'zone-photo-caption'}>
      <div className="zone-photo-caption-head">
        <span className="zone-photo-caption-type">{formatIssueTypeLabel(c.issueType)}</span>
        <span className="zone-photo-caption-sep">·</span>
        <span className="zone-photo-caption-conf">{pct}%</span>
        {c.flagged && <span className="zone-photo-caption-flag">Flagged</span>}
      </div>
      {c.notes && (
        <div className="zone-photo-caption-notes" title={c.notes}>
          {c.notes}
        </div>
      )}
    </div>
  );
}
