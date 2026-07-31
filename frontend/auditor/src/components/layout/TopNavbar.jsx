import React, { useState } from 'react';
import { Bell, Search, User, LogOut, CheckCircle, ShieldAlert, Menu, Upload, Cpu, AlertTriangle, FileText, UserCheck, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TopNavbar = ({ onToggleSidebar }) => {
  const { 
    user, 
    logout, 
    assignedClients, 
    clientAuditsMapping, 
    selectedClient, 
    selectedAudit, 
    switchClient, 
    switchAudit 
  } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nameInitial = user?.name ? user.name.charAt(0) : 'R';

  // Auditor specific recent notifications
  const recentNotifications = [
    { id: 1, type: 'upload', title: 'Client uploaded new evidence', desc: 'ABC Securities uploaded 3 documents for PR.AA.56', time: '5m ago', icon: <Upload size={14} />, color: 'var(--primary)' },
    { id: 2, type: 'ai', title: 'AI analysis completed', desc: 'XYZ Finance - Data Backup control analysis finished', time: '15m ago', icon: <Cpu size={14} />, color: 'var(--status-green-text)' },
    { id: 3, type: 'deadline', title: 'Deadline approaching', desc: 'CSCRF Audit for PQR Capital is due in 2 days', time: '1h ago', icon: <AlertTriangle size={14} />, color: 'var(--primary)' },
    { id: 4, type: 'report', title: 'Draft report generated', desc: 'Draft report ready for LMN Investments', time: '2h ago', icon: <FileText size={14} />, color: 'var(--text-primary)' },
  ];

  return (
    <header className="top-navigation">
      {/* Left Section: Mobile Drawer Toggle */}
      <div className="top-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="hamburger-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Center Section: Centered Search Bar */}
      <div className="top-nav-center">
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Global search requirements, uploaded evidence..." 
            className="search-input"
          />
        </div>
      </div>

      {/* Right Section: Notifications & User Profile */}
      <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Workspace Switchers */}
        <div className="workspace-switchers-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
          {/* Client Selector */}
          <select
            className="table-filter-select"
            style={{ 
              padding: '6px 24px 6px 12px', 
              fontSize: '12.5px', 
              fontWeight: '600', 
              minWidth: '150px', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            value={selectedClient}
            onChange={(e) => switchClient(e.target.value)}
          >
            {assignedClients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Audit Selector */}
          <select
            className="table-filter-select"
            style={{ 
              padding: '6px 24px 6px 12px', 
              fontSize: '12.5px', 
              fontWeight: '600', 
              minWidth: '140px', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            value={selectedAudit}
            onChange={(e) => switchAudit(e.target.value)}
          >
            {(clientAuditsMapping[selectedClient] || []).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        {/* Notifications Icon with Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            className="nav-icon-button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          >
            <Bell size={20} />
            <span className="notification-badge"></span>
          </button>

          {showNotifications && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                width: '320px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/notifications')}>View all</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentNotifications.map(notif => (
                  <div key={notif.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ color: notif.color, marginTop: '2px' }}>
                      {notif.icon}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{notif.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{notif.desc}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{notif.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            className="profile-trigger"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <div className="profile-avatar">
              {nameInitial}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'Rahul Sharma'}</span>
              <span className="profile-role">Senior Auditor</span>
            </div>
          </button>

          {showProfileMenu && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                width: '200px',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email || 'rahul.sharma@cyberaries.com'}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Senior Compliance Auditor</div>
              </div>
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/profile');
                }}
                className="actions-dropdown-item"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
              >
                <User size={14} /> View Profile
              </button>
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="actions-dropdown-item"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}
              >
                <Settings size={14} /> Profile Settings
              </button>
              <button 
                onClick={handleLogout}
                className="actions-dropdown-item"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', borderTop: '1px solid var(--border-color)', width: '100%' }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
