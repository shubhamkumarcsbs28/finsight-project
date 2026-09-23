import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Account } from '../../types';
import { transactionsApi } from '../../services/api';

interface ImportCSVModalProps {
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  accounts,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<number>(accounts[0]?.id || 0);
  const [csvContent, setCsvContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setError(null);
    if (!selectedAccountId) {
      setError('Please select a target account');
      return;
    }

    if (!csvContent.trim()) {
      setError('CSV content is empty');
      return;
    }

    setLoading(true);
    try {
      const lines = csvContent.trim().split('\n');
      const items = [];

      // Parse CSV line by line (expected format: type, amount, merchant, category, description)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.toLowerCase().startsWith('type')) continue; // Skip header

        const parts = line.split(',');
        if (parts.length >= 3) {
          const type = parts[0].trim().toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT';
          const amount = parseFloat(parts[1].trim());
          const merchant = parts[2].trim();
          const category = parts[3]?.trim() || 'General';
          const description = parts[4]?.trim() || 'Batch CSV import';

          if (!isNaN(amount) && merchant) {
            items.push({
              account_id: selectedAccountId,
              transaction_type: type,
              amount,
              merchant,
              category,
              description,
            });
          }
        }
      }

      if (items.length === 0) {
        throw new Error('No valid CSV records parsed. Ensure format is: type,amount,merchant,category,description');
      }

      await transactionsApi.importCsv(items);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'CSV Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Import Transactions from CSV</h2>
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

        <div className="form-group">
          <label className="form-label">Target Account</label>
          <select
            className="form-select"
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_type} ({acc.account_number})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Upload CSV File</label>
          <div
            style={{
              border: '2px dashed rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#0f172a',
            }}
          >
            <Upload size={32} style={{ color: '#34d399', margin: '0 auto 10px' }} />
            <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>
              Click to browse or drop CSV file
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Format: type,amount,merchant,category,description
            </div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="csvInput"
            />
            <label
              htmlFor="csvInput"
              className="btn btn-secondary"
              style={{ marginTop: '14px', display: 'inline-flex' }}
            >
              Select CSV File
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Or Paste CSV Text</label>
          <textarea
            className="form-textarea"
            rows={4}
            placeholder={`DEBIT,89.50,Amazon,Shopping,Office desk accessories\nDEBIT,450.00,Gucci Boutique,Luxury,Designer shoes\nCREDIT,1200.00,Client Invoice,Income,Consulting payment`}
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleImport} disabled={loading} className="btn btn-primary">
            {loading ? 'Importing & Evaluating Risk...' : 'Run CSV Import'}
          </button>
        </div>
      </div>
    </div>
  );
};
