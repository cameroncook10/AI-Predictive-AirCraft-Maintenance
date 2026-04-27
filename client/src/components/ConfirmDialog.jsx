import { useEffect } from 'react';

/**
 * Simple modal for destructive/irreversible actions. Click backdrop or press Escape to cancel.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="confirm-dialog-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="confirm-dialog-title" className="confirm-dialog-title">
          {title}
        </div>
        {message ? <p className="confirm-dialog-message">{message}</p> : null}
        <div className="confirm-dialog-actions">
          <button type="button" className="cam-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`cam-btn confirm-dialog-confirm${danger ? ' confirm-dialog-confirm--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
