import { useCallback, useRef, useState } from 'react';
import { deleteExteriorZonePhoto } from '../api';
import PhotoLightbox from './PhotoLightbox';
import ConfirmDialog from './ConfirmDialog';
import ZonePhotoCaption from './ZonePhotoCaption';

export default function InspectionChecklist({
  inspections,
  exteriorZonePhotos = [],
  onToggle,
  aircraftTail,
  onRefreshExterior,
}) {
  const [lightbox, setLightbox] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const removeInFlight = useRef(false);
  const [removeError, setRemoveError] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  const removeZonePhoto = useCallback(
    async (p) => {
      if (!p?.id || !aircraftTail) return;
      if (removeInFlight.current) return;
      removeInFlight.current = true;
      setRemoveError(null);
      setLightbox((prev) => (prev && prev.url === p.imageUrl ? null : prev));
      setRemovingId(p.id);
      try {
        await deleteExteriorZonePhoto(aircraftTail, p.id);
        onRefreshExterior?.();
      } catch (e) {
        setRemoveError(e?.message || String(e));
      } finally {
        removeInFlight.current = false;
        setRemovingId(null);
      }
    },
    [aircraftTail, onRefreshExterior],
  );

  if (!inspections || inspections.length === 0) {
    return <div className="empty-state">No inspection data available</div>;
  }

  // Calculate progress
  let total = 0, completed = 0, passed = 0, failed = 0, skipped = 0;
  inspections.forEach((zone) => {
    zone.items.forEach((item) => {
      total++;
      if (item.status !== 'pending') completed++;
      if (item.status === 'pass') passed++;
      if (item.status === 'fail') failed++;
      if (item.status === 'skip') skipped++;
    });
  });
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const checkLabel = { pending: '', pass: '✓', fail: '✕', skip: '—' };
  const statusLabel = { pending: 'PENDING', pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };
  const statusColor = { pending: 'var(--muted)', pass: 'var(--green)', fail: 'var(--red)', skip: 'var(--amber)' };

  const hasZonePhotos = Array.isArray(exteriorZonePhotos) && exteriorZonePhotos.some((g) => (g.photos || []).length > 0);

  return (
    <div className="fade-in">
      <PhotoLightbox
        url={lightbox?.url}
        inspection={lightbox?.inspection}
        zoneName={lightbox?.zoneName}
        tail={aircraftTail}
        onWorkOrderCreated={onRefreshExterior}
        onClose={() => setLightbox(null)}
      />
      <ConfirmDialog
        open={!!deleteConfirmTarget}
        title="Remove this image?"
        message="It will be removed from this zone. The file will be deleted if it is not used by another zone capture."
        confirmText="Remove"
        onCancel={() => setDeleteConfirmTarget(null)}
        onConfirm={() => {
          const p = deleteConfirmTarget;
          setDeleteConfirmTarget(null);
          if (p) void removeZonePhoto(p);
        }}
      />

      {hasZonePhotos && (
        <>
          <div className="section-title">Exterior zone photos</div>
          <p className="insp-zone-photos-intro">
            Images captured from Exterior capture for each inspection zone (same tail). Use × to remove a photo
            (file is deleted if not referenced elsewhere).
          </p>
          {removeError && (
            <div className="insp-zone-remove-err" style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>
              {removeError}
            </div>
          )}
          <div className="insp-zone-photos-grid">
            {exteriorZonePhotos
              .filter((group) => (group.photos || []).length > 0)
              .map((group) => (
                <div className="insp-zone-photo-card" key={group.zoneId}>
                  <div className="insp-zone-photo-title">{group.zoneName}</div>
                  <div className="insp-zone-photo-strip">
                    {(group.photos || []).map((p) => (
                      <div className="insp-zone-photo-item" key={p.id || p.imageUrl}>
                        <div className="insp-zone-thumb-wrap">
                          <button
                            type="button"
                            className="insp-zone-thumb"
                            onClick={() =>
                              setLightbox({
                                url: p.imageUrl,
                                inspection: p.inspection ?? null,
                                zoneName: group.zoneName,
                              })
                            }
                          >
                            <img src={p.imageUrl} alt="" loading="lazy" />
                          </button>
                          {p.id && aircraftTail ? (
                            <button
                              type="button"
                              className="zone-photo-remove"
                              title="Remove image"
                              disabled={removingId === p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmTarget(p);
                              }}
                              aria-label="Remove image"
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                        <ZonePhotoCaption inspection={p.inspection} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Progress */}
      <div className="inspection-progress">
        <div className="inspection-progress-label">Walk-Around Inspection Progress</div>
        <div className="inspection-progress-bar">
          <div className="inspection-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="inspection-stats">
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--blue)' }} />
            {completed}/{total} Complete ({pct}%)
          </div>
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--green)' }} />
            {passed} Pass
          </div>
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--red)' }} />
            {failed} Fail
          </div>
          <div className="inspection-stat">
            <span className="inspection-stat-dot" style={{ background: 'var(--amber)' }} />
            {skipped} Skip
          </div>
        </div>
      </div>

      {/* Zones */}
      {inspections.map((zone, zi) => {
        const zoneCompleted = zone.items.filter((it) => it.status !== 'pending').length;
        return (
          <div className="inspection-zone" key={`${zi}-${zone.zone}`}>
            <div className="inspection-zone-header">
              <span>{zone.zone}</span>
              <span className="inspection-zone-count">{zoneCompleted}/{zone.items.length}</span>
            </div>
            <div className="inspection-items">
              {zone.items.map((item) => {
                const readOnly = Boolean(item.readOnly);
                return (
                  <div
                    className={`insp-item${readOnly ? ' insp-item-readonly' : ''}`}
                    key={item.id}
                    onClick={() => {
                      if (!readOnly) onToggle(item.id);
                    }}
                    role={readOnly ? undefined : 'button'}
                  >
                    <button type="button" className={`insp-check ${item.status}`} disabled={readOnly}>
                      {checkLabel[item.status]}
                    </button>
                    <span className="insp-task">
                      {readOnly && <span className="insp-ai-badge">AI</span>}
                      {item.task}
                    </span>
                    <span className="insp-status-label" style={{ color: statusColor[item.status] }}>
                      {statusLabel[item.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
