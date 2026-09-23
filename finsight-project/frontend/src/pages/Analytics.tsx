import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CategorySpending, DailyTrendPoint, FraudAnalyticsData } from '../types';
import { analyticsApi } from '../services/api';

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export const Analytics: React.FC = () => {
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [fraudStats, setFraudStats] = useState<FraudAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendData, catData, fraudData] = await Promise.all([
        analyticsApi.getTrends(),
        analyticsApi.getCategories(),
        analyticsApi.getFraudStats(),
      ]);
      setTrends(trendData);
      setCategories(catData);
      setFraudStats(fraudData);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="eyebrow">RISK TELEMETRY & PATTERN GRAPHICS</div>
          <h1>Analytics & Risk Intelligence</h1>
        </div>
      </div>

      {/* Grid 1: Daily Transaction Volume Trend */}
      <div className="card-panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
          Daily Transaction Volume Trend ($ USD)
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          Historical movement timeline across user accounts
        </p>

        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{ background: '#1c2541', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Volume']}
              />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid 2: Spending Breakdown & Fraud Severity */}
      <div className="content-grid">
        {/* Category Spending Pie Chart */}
        <div className="card-panel">
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            Category Spending Distribution
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            Volume breakdown by merchant category
          </p>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="total_amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ category }) => category}
                >
                  {categories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1c2541', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Severity & Rule Trigger Frequency */}
        <div className="card-panel">
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            Fraud Rule Trigger Frequencies
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            Anomaly signals flagged by rules engine
          </p>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudStats?.rule_triggers || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="rule" type="category" stroke="#64748b" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{ background: '#1c2541', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
