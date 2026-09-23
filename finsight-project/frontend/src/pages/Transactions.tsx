import React, { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Plus,
  Search,
  Upload,
} from 'lucide-react';
import { Account, Transaction } from '../types';
import { accountsApi, transactionsApi } from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { NewTransactionModal } from '../components/Modals/NewTransactionModal';
import { ImportCSVModal } from '../components/Modals/ImportCSVModal';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [minRiskScore, setMinRiskScore] = useState<string>('0');

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs, txRes] = await Promise.all([
        accountsApi.getAccounts(),
        transactionsApi.getTransactions({
          account_id: selectedAccount !== 'ALL' ? Number(selectedAccount) : undefined,
          transaction_type: selectedType !== 'ALL' ? selectedType : undefined,
          category: categoryFilter.trim() || undefined,
          min_risk_score: Number(minRiskScore) > 0 ? Number(minRiskScore) : undefined,
          limit: 100,
        }),
      ]);
      setAccounts(accs);
      setTransactions(txRes.items);
      setTotalCount(txRes.total);
    } catch (err) {
      console.error('Failed to load transaction ledger', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAccount, selectedType, categoryFilter, minRiskScore]);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="eyebrow">AUDIT & DOUBLE-ENTRY LEDGER</div>
          <h1>Transaction History</h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setIsImportModalOpen(true)} className="btn btn-secondary">
            <Upload size={16} />
            <span>Import CSV</span>
          </button>
          <button onClick={() => setIsTxModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="card-panel"
        style={{
          marginBottom: '20px',
          padding: '18px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'center',
        }}
      >
        <div>
          <label className="form-label">Category / Merchant Filter</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Filter by Account</label>
          <select
            className="form-select"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_type} ({acc.account_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Transaction Type</label>
          <select
            className="form-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ALL">All Types (CREDIT & DEBIT)</option>
            <option value="DEBIT">DEBIT Only</option>
            <option value="CREDIT">CREDIT Only</option>
          </select>
        </div>

        <div>
          <label className="form-label">Min Risk Score</label>
          <select
            className="form-select"
            value={minRiskScore}
            onChange={(e) => setMinRiskScore(e.target.value)}
          >
            <option value="0">All Scores (0+)</option>
            <option value="30">Medium+ Flagged (30+)</option>
            <option value="60">High Risk Only (60+)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Showing <strong>{transactions.length}</strong> of <strong>{totalCount}</strong> recorded transactions
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount ($ USD)</th>
                <th>Risk Score & Severity</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace', color: '#64748b' }}>#{tx.id}</td>
                    <td style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(tx.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <strong style={{ color: 'white' }}>{tx.merchant}</strong>
                      {tx.description && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{tx.description}</div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#cbd5e1',
                        }}
                      >
                        {tx.category}
                      </span>
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

      {/* Modals */}
      {accounts.length > 0 && (
        <NewTransactionModal
          accounts={accounts}
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          onSuccess={loadData}
        />
      )}

      {accounts.length > 0 && (
        <ImportCSVModal
          accounts={accounts}
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
