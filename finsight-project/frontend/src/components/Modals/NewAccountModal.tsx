import React, { useState } from 'react';
import { X } from 'lucide-react';
import { accountsApi } from '../../services/api';

interface NewAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accountType, setAccountType] = useState<string>('CHECKING');
  const [initialBalance, setInitialBalance] = useState<string>('1000.00');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const balanceNum = parseFloat(initialBalance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      setError('Initial balance must be a non-negative number');
      return;
    }

    setLoading(true);
    try {
      await accountsApi.createAccount({
        account_type: accountType,
        currency: 'USD',
        initial_balance: balanceNum,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Open New Financial Account</h2>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select
              className="form-select"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="CHECKING">CHECKING Account</option>
              <option value="SAVINGS">SAVINGS Account</option>
              <option value="CREDIT">CREDIT Account</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Opening Balance ($ USD)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating Account...' : 'Open Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
