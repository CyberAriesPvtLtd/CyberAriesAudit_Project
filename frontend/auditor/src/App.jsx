import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssignedAudits from './pages/AssignedAudits';
import EvidenceReview from './pages/EvidenceReview';
import AuditReview from './pages/AuditReview';
import AIFindings from './pages/AIFindings';
import DraftReports from './pages/DraftReports';
import AuditProgress from './pages/AuditProgress';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Wrapper */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/assigned-audits" element={<AssignedAudits />} />
                    <Route path="/evidence-review" element={<EvidenceReview />} />
                    <Route path="/audit-review/:auditId" element={<AuditReview />} />
                    <Route path="/ai-findings" element={<AIFindings />} />
                    <Route path="/draft-reports" element={<DraftReports />} />
                    <Route path="/audit-progress" element={<AuditProgress />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* Fallback inside authenticated app */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>

                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

