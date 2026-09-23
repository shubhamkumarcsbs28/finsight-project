import axios from 'axios';
import {
  Account,
  AuthToken,
  CategorySpending,
  DailyTrendPoint,
  FraudAlert,
  FraudAnalyticsData,
  SummaryAnalytics,
  Transaction,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('finsight_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;

// Auth API Callers
export const authApi = {
  register: async (payload: { email: string; full_name: string; password: string }) => {
    const res = await api.post<User>('/auth/register', payload);
    return res.data;
  },
  login: async (payload: { email: string; password: string }) => {
    const res = await api.post<AuthToken>('/auth/login', payload);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

// Accounts API Callers
export const accountsApi = {
  getAccounts: async () => {
    const res = await api.get<Account[]>('/accounts');
    return res.data;
  },
  createAccount: async (payload: {
    account_type: string;
    currency: string;
    initial_balance: number;
  }) => {
    const res = await api.post<Account>('/accounts', payload);
    return res.data;
  },
  getAccountDetails: async (id: number) => {
    const res = await api.get<Account>(`/accounts/${id}`);
    return res.data;
  },
  getBalance: async (id: number) => {
    const res = await api.get<{
      account_id: number;
      account_number: string;
      balance: number;
      currency: string;
    }>(`/accounts/${id}/balance`);
    return res.data;
  },
};

// Transactions API Callers
export const transactionsApi = {
  getTransactions: async (params?: {
    account_id?: number;
    category?: string;
    transaction_type?: string;
    min_amount?: number;
    max_amount?: number;
    min_risk_score?: number;
    limit?: number;
    offset?: number;
  }) => {
    const res = await api.get<{ items: Transaction[]; total: number }>('/transactions', {
      params,
    });
    return res.data;
  },
  createTransaction: async (payload: {
    account_id: number;
    transaction_type: string;
    amount: number;
    merchant: string;
    category?: string;
    description?: string;
    location?: string;
  }) => {
    const res = await api.post<Transaction>('/transactions', payload);
    return res.data;
  },
  importCsv: async (items: Array<any>) => {
    const res = await api.post<{
      imported_count: number;
      flagged_fraud_count: number;
      total_amount: number;
    }>('/transactions/import', items);
    return res.data;
  },
  getTransactionDetails: async (id: number) => {
    const res = await api.get<Transaction>(`/transactions/${id}`);
    return res.data;
  },
};

// Fraud Alerts API Callers
export const alertsApi = {
  getAlerts: async (params?: { status?: string; severity?: string; limit?: number }) => {
    const res = await api.get<{ items: FraudAlert[]; total: number }>('/alerts', { params });
    return res.data;
  },
  getAlertDetails: async (id: number) => {
    const res = await api.get<FraudAlert>(`/alerts/${id}`);
    return res.data;
  },
  updateAlert: async (id: number, payload: { status: string; resolution_notes?: string }) => {
    const res = await api.patch<FraudAlert>(`/alerts/${id}`, payload);
    return res.data;
  },
};

// Analytics API Callers
export const analyticsApi = {
  getSummary: async () => {
    const res = await api.get<SummaryAnalytics>('/analytics/summary');
    return res.data;
  },
  getTrends: async () => {
    const res = await api.get<DailyTrendPoint[]>('/analytics/transactions');
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get<CategorySpending[]>('/analytics/categories');
    return res.data;
  },
  getFraudStats: async () => {
    const res = await api.get<FraudAnalyticsData>('/analytics/fraud');
    return res.data;
  },
};
