import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { AlertStatus, FraudAlert } from '../../types';
import { alertsApi } from '../../services/api';
import { RiskBadge } from '../RiskBadge';

interface AlertDetailModalProps {
  alert: FraudAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  isOpen,
  onClose,
  onUpdateSuccess,
}) => {
  if (!isOpen || !alert) return null;

  const [status, setStatus] = useState<AlertStatus>(alert.status);
  const [resolutionNotes, setResolutionNotes] = useState<string>(alert.resolution_notes || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: AlertStatus) => {
    setError(null);
    setLoading(true);
    try {
      await alertsApi.updateAlert(alert.id, {
        status: newStatus,
        resolution_notes: resolutionNotes,
      });
      setStatus(newStatus);
      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={24} style={{ color: '#ef4444' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Fraud Alert Breakdown #{alert.id}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>ALERT TYPE</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{alert.alert_type.replace(/_/g, ' ')}</span>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>RISK EVALUATION</span>
            <RiskBadge score={alert.risk_score} severity={alert.severity} />
          </div>
        </div>

        {/* Transaction Summary Card */}
        {alert.transaction && (
          <div style={{ background: '#0f172a', borderRadius: '12px', padding: '18px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '10px' }}>FLAGGED TRANSACTION DETAILS</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <div>Merchant: <strong style={{ color: 'white' }}>{alert.transaction.merchant}</strong></div>
              <div>Amount: <strong style={{ color: '#34d399' }}>${Number(alert.transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
              <div>Category: <span style={{ color: '#94a3b8' }}>{alert.transaction.category}</span></div>
              <div>Type: <span style={{ color: '#94a3b8' }}>{alert.transaction.transaction_type}</span></div>
            </div>
          </div>
        )}

        {/* Explanation Reason */}
        <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
            <AlertTriangle size={16} />
            <span>EXPLAINABLE RULE REASON</span>
          </div>
          <p style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.5 }}>{alert.reason}</p>
        </div>

        {/* Resolution Status & Notes Form */}
        <div className="form-group">
          <label className="form-label">Resolution Notes</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Add analyst review observations or customer phone confirmation details..."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Status: <strong style={{ color: status === 'RESOLVED' ? '#34d399' : '#fbbf24' }}>{status}</strong>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {status !== 'REVIEWED' && status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('REVIEWED')}
                disabled={loading}
                className="btn btn-secondary"
              >
                Mark Under Review
              </button>
            )}

            {status !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={loading}
                className="btn btn-primary"
              >
                <CheckCircle size={16} />
                <span>Mark Resolved</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
