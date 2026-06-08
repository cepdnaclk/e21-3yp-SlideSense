import React from 'react';

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  isDestructive = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          {isDestructive && (
            <p className="modal-warning">Warning: This action cannot be undone.</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="button button--outline" onClick={onClose}>{cancelText}</button>
          <button 
            className={`button ${isDestructive ? 'button--danger' : 'button--primary'}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
