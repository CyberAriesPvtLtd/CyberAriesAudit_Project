import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prevent background scrolling when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div 
          className="sidebar-mobile-backdrop" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      <div className="app-main">
        <TopNavbar onToggleSidebar={() => setSidebarOpen(true)} />
        <main style={{ flexGrow: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
