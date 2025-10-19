import React from 'react';
import '../Styles/Modal.css';

function ErrorModal({ title = 'Error', message, onClose }) {
  if (!message) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="error-title">
      <div className="modal-box" role="document">
        <h2 id="error-title">{title}</h2>
        <div style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 6, marginBottom: 14 }}>
          {message}
        </div>
        <div className="modal-buttons">
          <button className="modal-btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;


