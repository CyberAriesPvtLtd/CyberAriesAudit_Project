import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ClientProvider, useClient } from './context/ClientContext';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyAudits from './pages/MyAudits';
import ControlDetails from './pages/ControlDetails';
import Findings from './pages/Findings';
import AuditStatus from './pages/AuditStatus';
import FinalReport from './pages/FinalReport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Layout wrapper for protected pages
function ProtectedLayout({ children }) {
  const { currentUser } = useClient();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Panel Content Area */}
      <div className="app-main">
        {/* Top Header Navigation */}
        <TopNav toggleSidebar={toggleSidebar} />

        {/* Dynamic Route Content */}
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Redirects logged in users to Dashboard
function PublicRoute({ children }) {
  const { currentUser } = useClient();
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/my-audits" 
        element={
          <ProtectedLayout>
            <MyAudits />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/control-details" 
        element={
          <ProtectedLayout>
            <ControlDetails />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/findings" 
        element={
          <ProtectedLayout>
            <Findings />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/audit-status" 
        element={
          <ProtectedLayout>
            <AuditStatus />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/final-report" 
        element={
          <ProtectedLayout>
            <FinalReport />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        } 
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ClientProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ClientProvider>
  );
}
