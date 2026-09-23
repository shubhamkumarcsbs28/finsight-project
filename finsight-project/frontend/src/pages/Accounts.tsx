import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { Account } from '../types';
import { accountsApi } from '../services/api';
import { NewAccountModal } from '../components/Modals/NewAccountModal';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountsApi.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="eyebrow">PORTFOLIO & CASH MANAGEMENT</div>
          <h1>Financial Accounts</h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchAccounts} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Refresh Balances</span>
          </button>
          <button onClick={() => setIsAccountModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Open New Account</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="card-panel"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1c2541 0%, #0f172a 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#34d399',
                    textTransform: 'uppercase',
                  }}
                >
                  {acc.account_type} ACCOUNT
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginTop: '2px', fontFamily: 'monospace' }}>
                  {acc.account_number}
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(52, 211, 153, 0.15)',
                  color: '#34d399',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {acc.status}
              </div>
            </div>

            <div style={{ margin: '24px 0 16px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>CURRENT BALANCE</span>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', letterSpacing: '-0.04em' }}>
                ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span style={{ fontSize: '14px', color: '#64748b' }}>{acc.currency}</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <span>Created {new Date(acc.created_at).toLocaleDateString()}</span>
              <ShieldCheck size={18} style={{ color: '#34d399', opacity: 0.8 }} />
            </div>
          </div>
        ))}
      </div>

      <NewAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={fetchAccounts}
      />
    </div>
  );
};
