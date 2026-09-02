import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import logo from '../assets/cyberaries-logo.png';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ShieldCheck, 
  ClipboardList, 
  BookOpen, 
  BarChart3, 
  Activity, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { logout, settings } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Auditors', path: '/auditors', icon: ShieldCheck },
    { name: 'Audit Management', path: '/audit-management', icon: ClipboardList },
    { name: 'Rulebook / Controls', path: '/rulebook', icon: BookOpen },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { name: 'System Activity', path: '/system-activity', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img src={logo} alt="CyberAries Logo" className="sidebar-logo" />
        <button 
          className="sidebar-close-mobile-btn" 
          onClick={onClose} 
          aria-label="Close sidebar"
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
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--primary)', fontWeight: '600' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
