import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Search, User, LogOut, CheckCircle, ShieldAlert, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopNav({ onToggleSidebar }) {
  const { currentUser, logout, activities } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nameInitial = currentUser?.fullName ? currentUser.fullName.charAt(0) : 'A';

  // Get recent 4 notifications
  const recentNotifications = activities.slice(0, 4);

  return (
    <header className="top-navigation">
      {/* Left Section: Toggle */}
      <div className="top-nav-left">
        {/* Hamburger Menu Toggle Button (Visible only on mobile) */}
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
            placeholder="Search audits, controls, entities, or activities..." 
            className="search-input"
          />
        </div>
      </div>

      {/* Right Section: Notifications & User Profile */}
      <div className="top-nav-right">
        {/* Notifications Icon with Badge */}
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
                <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/system-activity')}>View all</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentNotifications.map(notif => (
                  <div key={notif.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ color: notif.type === 'Security' ? 'var(--primary)' : 'var(--text-secondary)', marginTop: '2px' }}>
                      {notif.type === 'Security' ? <ShieldAlert size={14} /> : <CheckCircle size={14} />}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{notif.message}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(notif.timestamp).toLocaleTimeString()}</div>
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
              <span className="profile-name">{currentUser?.fullName || 'Admin User'}</span>
              <span className="profile-role">{currentUser?.role || 'Admin'}</span>
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
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser?.email || 'admin@cyberaries.com'}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{currentUser?.phone || ''}</div>
              </div>
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate('/settings');
                }}
                className="actions-dropdown-item"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <User size={14} /> Profile Settings
              </button>
              <button 
                onClick={handleLogout}
                className="actions-dropdown-item"
                style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', borderTop: '1px solid var(--border-color)' }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
