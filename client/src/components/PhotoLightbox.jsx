import { formatIssueTypeLabel } from './ZonePhotoCaption';
import WorkOrderQuickAdd from './WorkOrderQuickAdd';

export default function PhotoLightbox({
  url,
  onClose,
  inspection: inspectionProp = null,
  tail = null,
  zoneName = null,
  onWorkOrderCreated = null,
}) {
  if (!url) return null;

  const ins = inspectionProp
    ? {
        issueType: inspectionProp.issueType ?? inspectionProp.issue_type,
        confidence: inspectionProp.confidence ?? 0,
        flagged: Boolean(inspectionProp.flagged),
        notes: inspectionProp.notes ?? null,
      }
    : null;
  const pct = ins != null ? Math.round((Number(ins.confidence) || 0) * 100) : null;

  return (
    <div className="photo-lightbox" onClick={onClose} role="presentation">
      <button
        type="button"
        className="photo-lightbox-close"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
      <div
        className="photo-lightbox-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Exterior image preview"
      >
        <img className="photo-lightbox-image" src={url} alt="Exterior capture" />
        {tail && (
          <div className="photo-lightbox-wo">
            <div className="photo-lightbox-wo-heading">New work order</div>
            <WorkOrderQuickAdd
              key={url}
              tail={tail}
              zoneName={zoneName}
              inspection={inspectionProp}
              onCreated={onWorkOrderCreated}
              variant="lightbox"
              startOpen
            />
          </div>
        )}
        {ins && (
          <div className="photo-lightbox-meta">
            <div className={`photo-lightbox-meta-line${!ins.notes ? ' is-only' : ''}`}>
              <span className="photo-lightbox-meta-type">{formatIssueTypeLabel(ins.issueType)}</span>
              <span className="photo-lightbox-meta-sep">·</span>
              <span className="photo-lightbox-meta-conf">{pct}%</span>
              {ins.flagged && <span className="photo-lightbox-meta-flag">Flagged for review</span>}
            </div>
            {ins.notes && (
              <p className="photo-lightbox-meta-notes">
                {ins.notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
