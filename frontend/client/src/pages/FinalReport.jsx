import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { Download, Lock, Unlock, FileText, Award } from 'lucide-react';

export default function FinalReport() {
  const { controls, currentAudit, switchAudit, assignedAudits } = useClient();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const total = controls.length;
    const completed = controls.filter(c => c.status === 'Completed').length;
    if (completed === total && total > 0) {
      setUnlocked(true);
    } else {
      setUnlocked(false);
    }
  }, [controls]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">{currentAudit} Compliance Reports</h1>
          <p className="page-subtitle">Access your company's certified reports, certificates, and compliance declarations.</p>
        </div>
      </div>

      {/* Audit Switcher Row */}
      <div className="dashboard-section-card" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Current Audit
        </span>
        <div style={{ position: 'relative', width: '320px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '14px' }}>
            {currentAudit.includes('SOC 2') ? '🔑' : currentAudit.includes('SEBI') ? '🛡️' : currentAudit.includes('ISO 27001') ? '📁' : '⚡'}
          </span>
          <select
            className="table-filter-select"
            style={{ 
              padding: '10px 24px 10px 34px', 
              fontSize: '13px', 
              fontWeight: '600', 
              width: '100%', 
              cursor: 'pointer', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-color)',
              backgroundColor: '#FFFFFF',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
            value={currentAudit}
            onChange={(e) => switchAudit(e.target.value)}
          >
            {assignedAudits.map(audit => (
              <option key={audit} value={audit}>{audit}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Report Status Banner */}
      <div 
        className="dashboard-section-card" 
        style={{ 
          padding: '24px', 
          borderLeft: `4px solid ${unlocked ? '#10B981' : 'var(--primary)'}`, 
          backgroundColor: unlocked ? '#E6F4EA' : 'var(--primary-light)', 
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h4 
            style={{ 
              color: unlocked ? '#137333' : 'var(--primary)', 
              fontSize: '16px', 
              fontWeight: '700', 
              marginBottom: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            {unlocked ? <Unlock size={18} style={{ color: '#137333' }} /> : <Lock size={18} />}
            <span>{currentAudit} - Q3 2026 Audit Report</span>
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
            {unlocked ? (
              <span>This audit report is now <strong>fully unlocked</strong>! All {controls.length} compliance controls have been certified. Click the button to retrieve your {currentAudit} final report.</span>
            ) : (
              <span>This audit report is currently <strong>locked</strong>. It will be generated automatically once all {controls.length} controls reach completed status and are signed off by your auditor (Dr. Evelyn Foster).</span>
            )}
          </p>
        </div>
        
        <div>
          {unlocked ? (
            <button 
              className="btn btn-primary"
              onClick={() => alert(`Downloading Q3 2026 ${currentAudit} Final Audit Report...`)}
            >
              <Download size={14} /> Download PDF Report
            </button>
          ) : (
            <button 
              disabled 
              className="btn btn-secondary" 
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              onClick={() => alert('Download is locked.')}
            >
              <Download size={14} /> Download Report (Locked)
            </button>
          )}
        </div>
      </div>

      {/* Historical reports list */}
      <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '18px' }}>Historical Compliance Reports</h3>

      <div className="excel-table-container">
        <div className="table-scrollable">
          <table className="excel-table">
            <thead>
              <tr>
                <th>Audit Period</th>
                <th>Compliance Standards</th>
                <th>Audited Company</th>
                <th>Assigned Auditor</th>
                <th>Completion Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>2025-01-01 to 2025-12-31</td>
                <td>SOC 2 Type II</td>
                <td>Aether Technologies</td>
                <td>Dr. Evelyn Foster</td>
                <td>2026-01-10</td>
                <td><span className="badge badge-completed">Certified</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => alert('Downloading: Aether_Technologies_SOC2_TypeII_2025.pdf')} 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileText size={12} /> Report
                    </button>
                    <button 
                      onClick={() => alert('Downloading: Aether_Technologies_SOC2_Certificate_2025.pdf')} 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Award size={12} /> Certificate
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>2024-06-01 to 2024-11-30</td>
                <td>ISO 27001 Readiness</td>
                <td>Aether Technologies</td>
                <td>Lisbeth Salander</td>
                <td>2024-12-15</td>
                <td><span className="badge badge-completed">Certified</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => alert('Downloading: Aether_Technologies_ISO27001_Readiness_2024.pdf')} 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FileText size={12} /> Report
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
