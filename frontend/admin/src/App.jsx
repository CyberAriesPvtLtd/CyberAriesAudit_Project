import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

// Import Pages
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Clients from './pages/Clients';
import Auditors from './pages/Auditors';
import AuditManagement from './pages/AuditManagement';
import Rulebook from './pages/Rulebook';
import Reports from './pages/Reports';
import SystemActivity from './pages/SystemActivity';
import Settings from './pages/Settings';

// Protected Layout Component
function AppLayout({ children }) {
  const { currentUser } = useApp();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-mobile-backdrop" 
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}

      {/* Main Panel */}
      <div className="app-main">
        {/* Top Header Navigation */}
        <TopNav onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)} />

        {/* Dynamic Route Content */}
        <main style={{ flexGrow: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Public Route Component (Redirects to dashboard if logged in)
function PublicRoute({ children }) {
  const { currentUser } = useApp();
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } 
      />

      {/* Protected Admin Console Pages */}
      <Route 
        path="/dashboard" 
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        } 
      />
      <Route 
        path="/companies" 
        element={
          <AppLayout>
            <Companies />
          </AppLayout>
        } 
      />
      <Route 
        path="/clients" 
        element={
          <AppLayout>
            <Clients />
          </AppLayout>
        } 
      />
      <Route 
        path="/auditors" 
        element={
          <AppLayout>
            <Auditors />
          </AppLayout>
        } 
      />
      <Route 
        path="/audit-management" 
        element={
          <AppLayout>
            <AuditManagement />
          </AppLayout>
        } 
      />
      <Route 
        path="/rulebook" 
        element={
          <AppLayout>
            <Rulebook />
          </AppLayout>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <AppLayout>
            <Reports />
          </AppLayout>
        } 
      />
      <Route 
        path="/system-activity" 
        element={
          <AppLayout>
            <SystemActivity />
          </AppLayout>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <AppLayout>
            <Settings />
          </AppLayout>
        } 
      />

      {/* Default Fallback Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}
