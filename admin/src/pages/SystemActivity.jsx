import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Activity, ShieldAlert, CheckCircle, FileText, Settings, User } from 'lucide-react';

export default function SystemActivity() {
  const { activities } = useApp();
  const [filterType, setFilterType] = useState('All');

  const logTypes = ['All', 'System', 'Audit', 'Document', 'Company', 'Security', 'Settings'];

  const filteredActivities = activities.filter(act => {
    if (filterType === 'All') return true;
    return act.type === filterType;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'System':
        return <Settings size={16} />;
      case 'Security':
        return <ShieldAlert size={16} />;
      case 'Audit':
        return <CheckCircle size={16} />;
      case 'Document':
        return <FileText size={16} />;
      case 'Company':
        return <Activity size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'System':
        return { bg: '#F1F5F9', color: '#475569' };
      case 'Security':
        return { bg: '#FEF2F2', color: '#DC2626' };
      case 'Audit':
        return { bg: '#E6F4EA', color: '#137333' };
      case 'Document':
        return { bg: '#FEF7E0', color: '#B06000' };
      case 'Company':
        return { bg: '#E8F0FE', color: '#1A73E8' };
      default:
        return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">System Activity Logs</h1>
          <p className="page-subtitle">Real-time audit trails, compliance tracking records, and administrative telemetries.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => alert('Exporting full system log bundle as JSON...')}>
            Export Audit Logs
          </button>
        </div>
      </div>

      <div className="dashboard-section-card" style={{ padding: '24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {logTypes.map(type => (
            <button
              key={type}
              className={`btn ${filterType === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setFilterType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Timeline Container */}
        <div className="timeline-list" style={{ paddingLeft: '32px' }}>
          {filteredActivities.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
              No system activity found matching this filter.
            </div>
          ) : (
            filteredActivities.map((act) => {
              const colors = getLogColor(act.type);
              return (
                <div key={act.id} className={`timeline-item ${act.type.toLowerCase()}`} style={{ paddingBottom: '32px' }}>
                  {/* Custom Colored Circle for Timeline Node */}
                  <div 
                    style={{
                      position: 'absolute',
                      left: '-32px',
                      top: '2px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: colors.bg,
                      color: colors.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifycontent: 'center',
                      border: '2px solid #FFFFFF',
                      zIndex: 2,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getLogIcon(act.type)}
                  </div>
                  
                  <div className="timeline-content" style={{ paddingLeft: '12px' }}>
                    <div style={{ fontSize: '14.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {act.message}
                    </div>
                    
                    <div className="timeline-meta" style={{ marginTop: '4px', fontSize: '12px' }}>
                      <span 
                        style={{ 
                          backgroundColor: colors.bg, 
                          color: colors.color, 
                          padding: '1px 6px', 
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}
                      >
                        {act.type}
                      </span>
                      <span>•</span>
                      <span className="timeline-time">{new Date(act.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span className="timeline-user" style={{ color: 'var(--text-primary)' }}>Actor: {act.user}</span>
                      <span>•</span>
                      <span className="text-muted" style={{ fontFamily: 'monospace' }}>{act.id}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
