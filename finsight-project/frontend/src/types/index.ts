export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDIT';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
export type TransactionType = 'CREDIT' | 'DEBIT';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'DECLINED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AlertType =
  | 'DUPLICATE_TRANSACTION'
  | 'LARGE_TRANSACTION'
  | 'HIGH_FREQUENCY'
  | 'UNUSUAL_TIMING'
  | 'MULTIPLE_SIGNALS';
export type AlertStatus = 'OPEN' | 'REVIEWED' | 'RESOLVED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  account_type: AccountType;
  status: AccountStatus;
  balance: number | string;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  transaction_type: TransactionType;
  amount: number | string;
  merchant: string;
  category: string;
  description?: string;
  location?: string;
  status: TransactionStatus;
  risk_score: number;
  risk_severity: Severity;
  triggered_rules?: string[];
  risk_reason?: string;
  created_at: string;
}

export interface FraudAlert {
  id: number;
  transaction_id: number;
  alert_type: AlertType;
  severity: Severity;
  status: AlertStatus;
  risk_score: number;
  reason: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  transaction?: Transaction;
}

export interface SummaryAnalytics {
  total_volume: number;
  transaction_count: number;
  active_accounts: number;
  total_alerts: number;
  open_alerts: number;
  high_risk_alerts: number;
}

export interface DailyTrendPoint {
  date: string;
  amount: number;
  count: number;
}

export interface CategorySpending {
  category: string;
  total_amount: number;
  count: number;
}

export interface FraudDistribution {
  severity: string;
  count: number;
}

export interface RuleTriggerCount {
  rule: string;
  count: number;
}

export interface FraudAnalyticsData {
  severity_distribution: FraudDistribution[];
  rule_triggers: RuleTriggerCount[];
}
