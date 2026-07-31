import React from 'react';
import { NavLink } from 'react-router-dom';
import { useClient } from '../context/ClientContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  HelpCircle, 
  Activity, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { logout } = useClient();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Audits / Controls', path: '/my-audits', icon: ClipboardList },
    { name: 'Questions & Findings', path: '/findings', icon: HelpCircle },
    { name: 'Audit Status', path: '/audit-status', icon: Activity },
    { name: 'Final Report', path: '/final-report', icon: FileText },
    { name: 'Client Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="sidebar-overlay open" onClick={toggleSidebar}></div>
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '92px', padding: '16px 24px', boxSizing: 'border-box' }}>
          <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <img 
              src="/assets/logos/cyberaries-logo.png" 
              alt="CyberAries Logo" 
              className="sidebar-logo" 
            />
          </div>
          <button 
            className="sidebar-close-mobile-btn" 
            onClick={toggleSidebar} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'none' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  isActive ? "sidebar-item active" : "sidebar-item"
                }
                onClick={() => {
                  if (isOpen) toggleSidebar();
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div class="sidebar-footer">
          <button 
            className="sidebar-item" 
            onClick={logout} 
            style={{ color: 'var(--primary)', fontWeight: '600' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
