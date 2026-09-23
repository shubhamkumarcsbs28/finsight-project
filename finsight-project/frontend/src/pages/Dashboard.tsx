import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Plus,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { Account, FraudAlert, SummaryAnalytics, Transaction } from '../types';
import { accountsApi, alertsApi, analyticsApi, transactionsApi } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { NewTransactionModal } from '../components/Modals/NewTransactionModal';
import { NewAccountModal } from '../components/Modals/NewAccountModal';
import { ImportCSVModal } from '../components/Modals/ImportCSVModal';
import { AlertDetailModal } from '../components/Modals/AlertDetailModal';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryAnalytics | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [openAlerts, setOpenAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal controls
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, accData, txData, alertData] = await Promise.all([
        analyticsApi.getSummary(),
        accountsApi.getAccounts(),
        transactionsApi.getTransactions({ limit: 6 }),
        alertsApi.getAlerts({ status: 'OPEN', limit: 4 }),
      ]);
      setSummary(sumData);
      setAccounts(accData);
      setRecentTxs(txData.items);
      setOpenAlerts(alertData.items);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = accounts.reduce(
    (acc, a) => acc + Number(a.balance || 0),
    0
  );

  return (
    <div>
      {/* Top Header & Actions */}
      <div className="topbar">
        <div>
          <div className="eyebrow">EXECUTIVE FRAUD & LEDGER OVERVIEW</div>
          <h1>FinSight Dashboard</h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
            <Upload size={16} />
            <span>Import CSV</span>
          </button>
          <button onClick={() => setIsAccountModalOpen(true)} className="btn btn-secondary">
            <Plus size={16} />
            <span>New Account</span>
          </button>
          <button onClick={() => setIsTxModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">TOTAL ACCOUNT BALANCE</span>
          <div className="metric-value" style={{ color: '#34d399' }}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <DollarSign size={20} className="metric-icon" style={{ color: '#34d399' }} />
        </div>

        <div className="metric-card">
          <span className="metric-label">ACTIVE ACCOUNTS</span>
          <div className="metric-value">{summary?.active_accounts || accounts.length}</div>
          <CreditCard size={20} className="metric-icon" style={{ color: '#60a5fa' }} />
        </div>

        <div className="metric-card">
          <span className="metric-label">TRANSACTION VOLUME</span>
          <div className="metric-value">
            ${Number(summary?.total_volume || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {summary?.transaction_count || 0} Total Records
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: summary?.open_alerts ? 'rgba(239, 68, 68, 0.4)' : '' }}>
          <span className="metric-label">OPEN FRAUD ALERTS</span>
          <div className="metric-value" style={{ color: summary?.open_alerts ? '#f87171' : '#34d399' }}>
            {summary?.open_alerts || 0}
          </div>
          <ShieldAlert size={20} className="metric-icon" style={{ color: summary?.open_alerts ? '#f87171' : '#34d399' }} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Left Column: Recent Transactions Table */}
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>Recent Ledger Transactions</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Real-time double-entry transaction evaluation
              </p>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Merchant / Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>
                      No transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentTxs.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {new Date(tx.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <strong style={{ color: 'white', display: 'block' }}>{tx.merchant}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{tx.category}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: tx.transaction_type === 'CREDIT' ? '#34d399' : '#f87171',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {tx.transaction_type === 'CREDIT' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: tx.transaction_type === 'CREDIT' ? '#34d399' : 'white' }}>
                        {tx.transaction_type === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <RiskBadge score={tx.risk_score} severity={tx.risk_severity} reason={tx.risk_reason} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Fraud Alerts Preview */}
        <div className="card-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>Attention Queue</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Open risk triggers
              </p>
            </div>
            <ShieldAlert size={20} style={{ color: '#f87171' }} />
          </div>

          {openAlerts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                borderRadius: '12px',
                color: '#34d399',
              }}
            >
              <AlertTriangle size={28} style={{ margin: '0 auto 8px', opacity: 0.8 }} />
              <div style={{ fontWeight: 600, fontSize: '14px' }}>All Clear!</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                No open fraud alerts require review.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  className="hover:scale-[1.01]"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                      {alert.alert_type.replace(/_/g, ' ')}
                    </span>
                    <RiskBadge score={alert.risk_score} severity={alert.severity} showScore={false} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, margin: '6px 0' }}>
                    {alert.reason}
                  </p>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                    Click to review & update resolution notes →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {accounts.length > 0 && (
        <NewTransactionModal
          accounts={accounts}
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      <NewAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={loadData}
      />

      {accounts.length > 0 && (
        <ImportCSVModal
          accounts={accounts}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      <AlertDetailModal
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onUpdateSuccess={loadData}
      />
    </div>
  );
};
