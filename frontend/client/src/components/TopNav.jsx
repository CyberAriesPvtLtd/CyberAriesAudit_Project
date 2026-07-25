import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { Search, Bell, ShieldAlert, CheckCircle, User, Settings, LogOut, Menu } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function TopNav({ toggleSidebar }) {
  const { currentUser, logout, activities } = useClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowNotifications(false);
      setShowProfileMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleNotificationsClick = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Recent 4 activities for notifications
  const recentNotifications = activities.slice(0, 4);

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="top-navigation">
        {/* Left Section: Hamburger Menu (Visible only on mobile) */}
        <div className="top-nav-left" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
          <button 
            className="hamburger-menu-btn"
            onClick={toggleSidebar}
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
              id="global-search"
            />
          </div>
        </div>

        {/* Right Section: Action Widgets */}
        <div className="top-nav-right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div className="top-nav-actions" style={{ display: 'flex', alignItems: 'center' }}>
            
            {/* Notifications Panel */}
            <div style={{ position: 'relative' }}>
              <button className="nav-icon-button" onClick={handleNotificationsClick}>
                <Bell size={20} />
                {recentNotifications.length > 0 && (
                  <span className="notification-badge" id="notif-badge"></span>
                )}
              </button>

              {showNotifications && (
                <div 
                  id="notif-dropdown" 
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Notifications</span>
                    <span 
                      style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }} 
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/findings');
                      }}
                    >
                      View all
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recentNotifications.map(notif => (
                      <div key={notif.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ color: notif.type === 'System' ? 'var(--text-secondary)' : 'var(--primary)', marginTop: '2px' }}>
                          {notif.type === 'System' ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{notif.message}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div style={{ position: 'relative' }}>
              <button className="profile-trigger" onClick={handleProfileClick}>
                <div className="profile-avatar">
                  {currentUser?.avatarInitials || 'SC'}
                </div>
                <div className="profile-info">
                  <span className="profile-name">{currentUser?.fullName || 'Sarah Connor'}</span>
                  <span className="profile-role">{currentUser?.companyName || 'Aether Technologies'}</span>
                </div>
              </button>

              {showProfileMenu && (
                <div 
                  id="profile-dropdown" 
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {currentUser?.email || 's.connor@aether.io'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                      {currentUser?.phone || '+1 (555) 234-5678'}
                    </div>
                  </div>
                  <Link 
                    to="/profile" 
                    className="actions-dropdown-item" 
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User size={14} /> Client Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    className="actions-dropdown-item" 
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings size={14} /> System Settings
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="actions-dropdown-item" 
                    style={{ color: 'var(--primary)', borderTop: '1px solid var(--border-color)', width: '100%', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
}
