import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Eye, ShieldAlert } from 'lucide-react';
import { FraudAlert } from '../types';
import { alertsApi } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { AlertDetailModal } from '../components/Modals/AlertDetailModal';

export const FraudAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await alertsApi.getAlerts({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        limit: 100,
      });
      setAlerts(res.items);
    } catch (err) {
      console.error('Failed to load fraud alerts queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="eyebrow">EXPLAINABLE RISK MONITORING QUEUE</div>
          <h1>Fraud Alerts & Incident Review</h1>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card-panel"
        style={{
          marginBottom: '20px',
          padding: '18px 24px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Lifecycle Status:</span>
          {['ALL', 'OPEN', 'REVIEWED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Severity Filter:</span>
          <select
            className="form-select"
            style={{ width: '140px', padding: '6px 10px', fontSize: '12px' }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">HIGH Only</option>
            <option value="MEDIUM">MEDIUM Only</option>
            <option value="LOW">LOW Only</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="card-panel">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Triggered Timestamp</th>
                <th>Rule Category</th>
                <th>Severity & Score</th>
                <th>Explainable Anomaly Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No fraud alerts match the selected status & severity filters.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td style={{ fontFamily: 'monospace', color: '#64748b' }}>#{alert.id}</td>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(alert.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <strong style={{ color: 'white' }}>{alert.alert_type.replace(/_/g, ' ')}</strong>
                    </td>
                    <td>
                      <RiskBadge score={alert.risk_score} severity={alert.severity} />
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#cbd5e1',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={alert.reason}
                      >
                        {alert.reason}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background:
                            alert.status === 'RESOLVED'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : alert.status === 'REVIEWED'
                              ? 'rgba(59, 130, 246, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                          color:
                            alert.status === 'RESOLVED'
                              ? '#34d399'
                              : alert.status === 'REVIEWED'
                              ? '#60a5fa'
                              : '#f87171',
                        }}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedAlert(alert)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        <Eye size={14} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDetailModal
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onUpdateSuccess={loadAlerts}
      />
    </div>
  );
};
