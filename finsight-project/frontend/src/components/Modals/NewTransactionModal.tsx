import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Account } from '../../types';
import { transactionsApi } from '../../services/api';

interface NewTransactionModalProps {
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  accounts,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState<number>(accounts[0]?.id || 0);
  const [type, setType] = useState<string>('DEBIT');
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<string>('Shopping');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!merchant.trim()) {
      setError('Merchant name is required');
      return;
    }

    setLoading(true);
    try {
      await transactionsApi.createTransaction({
        account_id: accountId,
        transaction_type: type,
        amount: numAmount,
        merchant,
        category,
        description,
        location: 'US',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transaction processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Record New Transaction</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
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
            <label className="form-label">Select Account</label>
            <select
              className="form-select"
              value={accountId}
              onChange={(e) => setAccountId(Number(e.target.value))}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_type} ({acc.account_number}) — ${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="DEBIT">DEBIT (Withdrawal / Payment)</option>
                <option value="CREDIT">CREDIT (Deposit / Income)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Merchant Name</label>
              <input
                type="text"
                placeholder="e.g. Amazon, Wire Escrow, Coffee Shop"
                className="form-input"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Shopping">Shopping</option>
                <option value="Dining">Dining</option>
                <option value="Groceries">Groceries</option>
                <option value="Transport">Transport</option>
                <option value="Transfer">Transfer / Wire</option>
                <option value="Investment">Investment / Crypto</option>
                <option value="Luxury Goods">Luxury Goods</option>
                <option value="Income">Income / Salary</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              placeholder="Internal reference notes..."
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Processing & Risk Scoring...' : 'Submit Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
