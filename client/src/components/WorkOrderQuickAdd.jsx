import { useEffect, useState } from 'react';
import { createWorkOrder } from '../api';
import { formatIssueTypeLabel } from './ZonePhotoCaption';

function buildDefaultTitle(zoneName, inspection) {
  const z = (zoneName && String(zoneName).trim()) || 'Zone';
  if (inspection) {
    const it = formatIssueTypeLabel(inspection.issueType ?? inspection.issue_type);
    if (it && it !== '—') return `Exterior — ${z}: ${it}`;
  }
  return `Exterior follow-up — ${z}`;
}

export default function WorkOrderQuickAdd({
  tail,
  zoneName,
  inspection,
  onCreated,
  className = '',
  variant = 'inline',
  /** When true, show the form immediately (e.g. when opened from the image lightbox). */
  startOpen = false,
}) {
  const [open, setOpen] = useState(startOpen);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Corrective');
  const [priority, setPriority] = useState('medium');
  const [days, setDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setTitle(buildDefaultTitle(zoneName, inspection));
      setErr(null);
    }
  }, [open, zoneName, inspection]);

  if (!tail) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErr('Enter a title');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      await createWorkOrder(tail, {
        title: title.trim(),
        type,
        priority,
        days: Number(days) || 7,
      });
      onCreated?.();
      setOpen(false);
    } catch (er) {
      setErr(er?.message || String(er));
    } finally {
      setSubmitting(false);
    }
  };

  const openBtnClass =
    variant === 'lightbox'
      ? 'zone-photo-wo-link zone-photo-wo-link--lightbox'
      : 'zone-photo-wo-link';

  if (!open) {
    return (
      <button
        type="button"
        className={`${openBtnClass} ${className}`.trim()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Add work order
      </button>
    );
  }

  return (
    <form
      className={`zone-photo-wo-form zone-photo-wo-form--${variant} ${className}`.trim()}
      onSubmit={onSubmit}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        className="zone-photo-wo-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Work order title"
        maxLength={220}
        autoComplete="off"
        aria-label="Work order title"
      />
      <div className="zone-photo-wo-row">
        <select className="zone-photo-wo-select" value={type} onChange={(e) => setType(e.target.value)} aria-label="Work order type">
          <option value="Inspection">Inspection</option>
          <option value="Corrective">Corrective</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Deferred">Deferred</option>
        </select>
        <select className="zone-photo-wo-select" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <label className="zone-photo-wo-days">
          <span>Due</span>
          <input
            className="zone-photo-wo-days-input"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
          <span>d</span>
        </label>
        <button type="submit" className="zone-photo-wo-submit" disabled={submitting}>
          {submitting ? '…' : 'Add'}
        </button>
        <button
          type="button"
          className="zone-photo-wo-cancel"
          disabled={submitting}
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
      {err && <div className="zone-photo-wo-err">{err}</div>}
    </form>
  );
}
