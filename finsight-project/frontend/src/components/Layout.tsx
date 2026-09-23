import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={22} />
          </div>
          <div>
            <strong>FinSight</strong>
            <span>Enterprise Risk Engine</span>
          </div>
        </div>

        <nav>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Executive Dashboard</span>
          </NavLink>

          <NavLink
            to="/accounts"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <CreditCard size={18} />
            <span>Account Portfolio</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <DollarSign size={18} />
            <span>Ledger Transactions</span>
          </NavLink>

          <NavLink
            to="/alerts"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <AlertTriangle size={18} />
            <span>Fraud Incidents</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={18} />
            <span>Risk Telemetry</span>
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(52, 211, 153, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserIcon size={18} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.full_name || 'System Administrator'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start', fontSize: '12px', padding: '8px 12px' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
