import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Shield, Calendar, ArrowRight, ClipboardList, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AssignedAudits = () => {
  const { assignedClients, clientAuditsMapping, auditsData, switchClient, switchAudit } = useAuth();
  const navigate = useNavigate();
  const [expandedClient, setExpandedClient] = useState('');

  const handleReviewAudit = (company, auditName) => {
    switchClient(company);
    switchAudit(auditName);
    navigate('/evidence-review');
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'badge badge-completed';
      case 'In Progress': return 'badge badge-in_progress';
      case 'Pending Review': return 'badge badge-pending';
      default: return 'badge';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Assigned Clients & Audits</h1>
          <p className="page-subtitle">Manage and review compliance frameworks across your assigned client portfolios.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {assignedClients.map(company => {
          const auditsList = clientAuditsMapping[company] || [];
          const isExpanded = expandedClient === company;
          
          return (
            <div 
              key={company} 
              className="dashboard-section-card" 
              style={{ 
                margin: 0, 
                padding: '24px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer' 
                }}
                onClick={() => setExpandedClient(isExpanded ? '' : company)}
              >
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{company}</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Industry Segment • Enterprise GRC Workspace
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-active" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    {auditsList.length} {auditsList.length === 1 ? 'Audit Framework' : 'Audit Frameworks'}
                  </span>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                    {isExpanded ? 'Hide Details' : 'View Audits'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div 
                  style={{ 
                    marginTop: '20px', 
                    borderTop: '1px solid var(--border-color)', 
                    paddingTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    Assigned Compliance Projects
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {auditsList.map(auditName => {
                      const auditDetails = auditsData[company]?.[auditName] || {
                        stats: { assigned: 0, pending: 0, completed: 0, aiReview: 0 },
                        progress: { score: 0, completed: 0, total: 0 }
                      };
                      const status = auditDetails.progress.score === 100 ? 'Completed' : auditDetails.progress.score > 0 ? 'In Progress' : 'Pending Review';
                      
                      return (
                        <div 
                          key={auditName}
                          style={{ 
                            border: '1px solid var(--border-color)', 
                            borderRadius: 'var(--radius-md)', 
                            padding: '16px',
                            backgroundColor: 'var(--bg-hover)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '160px'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)' }}>{auditName}</h4>
                              <span className={getStatusBadgeClass(status)} style={{ fontSize: '11px' }}>
                                {status}
                              </span>
                            </div>
                            
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                <span>Progress</span>
                                <span>{auditDetails.progress.score}%</span>
                              </div>
                              <div className="progress-bar-track" style={{ height: '6px' }}>
                                <div 
                                  className="progress-bar-fill" 
                                  style={{ 
                                    width: `${auditDetails.progress.score}%`, 
                                    height: '100%',
                                    backgroundColor: auditDetails.progress.score === 100 ? '#10B981' : 'var(--primary)'
                                  }}
                                ></div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ClipboardList size={12} />
                                <span>{auditDetails.progress.total} Controls</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} style={{ color: '#10B981' }} />
                                <span>{auditDetails.progress.completed} Certified</span>
                              </div>
                            </div>
                          </div>

                          <button 
                            className="btn btn-primary" 
                            style={{ 
                              width: '100%', 
                              marginTop: '16px', 
                              fontSize: '12px', 
                              padding: '6px 12px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handleReviewAudit(company, auditName)}
                          >
                            <span>Review Workspace</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignedAudits;
