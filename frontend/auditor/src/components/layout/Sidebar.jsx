import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  CheckCircle, 
  Cpu, 
  FileText, 
  TrendingUp, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/cyberaries-logo.png';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Audits', path: '/assigned-audits', icon: ClipboardList },
    { name: 'Evidence Review', path: '/evidence-review', icon: CheckCircle },
    { name: 'AI Findings', path: '/ai-findings', icon: Cpu },
    { name: 'Draft Reports', path: '/draft-reports', icon: FileText },
    { name: 'Audit Progress', path: '/audit-progress', icon: TrendingUp },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Profile', path: '/profile', icon: User },
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
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                isActive ? "sidebar-item active" : "sidebar-item"
              }
              onClick={onClose}
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
};

export default Sidebar;
