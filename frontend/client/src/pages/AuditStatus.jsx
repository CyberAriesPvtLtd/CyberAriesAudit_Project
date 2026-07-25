import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { Check, Download, FileLock, Activity, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuditStatus() {
  const { controls, currentAudit, switchAudit, assignedAudits } = useClient();
  const [activeStep, setActiveStep] = useState(2); // default 2: Evidence Gathering
  const [score, setScore] = useState(0);

  useEffect(() => {
    const total = controls.length;
    const completed = controls.filter(c => c.status === 'Completed').length;
    const inProgress = controls.filter(c => c.status === 'In Progress').length;
    const action = controls.filter(c => c.status === 'Action Required').length;

    // Recalculate compliance score
    const scoreVal = total ? Math.round((completed / total) * 100) : 0;
    setScore(scoreVal);

    // Compute active step based on controls
    if (action === 0 && inProgress > 0) {
      setActiveStep(3); // Auditor Review
    } else if (completed === total && total > 0) {
      setActiveStep(5); // Certification
    } else {
      setActiveStep(2); // Evidence Gathering
    }
  }, [controls]);

  // Stepper width fill helper
  const getStepperLineWidth = () => {
    switch (activeStep) {
      case 1: return '10%';
      case 2: return '35%';
      case 3: return '55%';
      case 4: return '80%';
      case 5: return '100%';
      default: return '35%';
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">{currentAudit} Status Tracking</h1>
          <p className="page-subtitle">Track compliance phases, milestone timelines, and download final sign-off summaries.</p>
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

      {/* Stepper Timeline RoadMap Card */}
      <div className="dashboard-section-card" style={{ padding: '40px 32px 32px 32px', marginBottom: '32px' }}>
        <h3 className="section-title" style={{ marginBottom: '24px', textAlign: 'center' }}>Active Audit Phase Roadmap</h3>
        
        <div className="stepper-container">
          <div className="stepper-line-bg"></div>
          <div className="stepper-line-fill" style={{ width: getStepperLineWidth() }}></div>

          {/* Step 1: Scope & Setup (Completed) */}
          <div className={`stepper-step completed`}>
            <div className="step-node">
              <Check size={16} />
            </div>
            <span className="step-label">Scope & Setup</span>
          </div>

          {/* Step 2: Evidence Gathering */}
          <div className={`stepper-step ${activeStep >= 2 ? (activeStep > 2 ? 'completed' : 'active') : ''}`}>
            <div className="step-node">
              {activeStep > 2 ? <Check size={16} /> : '2'}
            </div>
            <span className="step-label">Evidence Gathering</span>
          </div>

          {/* Step 3: Auditor Review */}
          <div className={`stepper-step ${activeStep >= 3 ? (activeStep > 3 ? 'completed' : 'active') : ''}`}>
            <div className="step-node">
              {activeStep > 3 ? <Check size={16} /> : '3'}
            </div>
            <span className="step-label">Auditor Review</span>
          </div>

          {/* Step 4: Draft Report */}
          <div className={`stepper-step ${activeStep >= 4 ? (activeStep > 4 ? 'completed' : 'active') : ''}`}>
            <div className="step-node">
              {activeStep > 4 ? <Check size={16} /> : '4'}
            </div>
            <span className="step-label">Draft Report</span>
          </div>

          {/* Step 5: Certification */}
          <div className={`stepper-step ${activeStep === 5 ? 'active' : ''}`}>
            <div className="step-node">5</div>
            <span className="step-label">Certification</span>
          </div>
        </div>
      </div>

      {/* Phase Details split grid */}
      <div className="audit-status-main-grid">
        
        {/* Left Column: Stage Guidelines & logs */}
        <div className="dashboard-section-card" style={{ padding: '28px' }}>
          {activeStep === 2 && (
            <>
              <h3 className="section-title" style={{ marginBottom: '12px', fontSize: '16px' }}>Current Phase: Evidence Gathering</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '20px' }}>
                You are currently in the <strong>Evidence Gathering</strong> phase. In this step, you must upload files corresponding to all {currentAudit} compliance requirements. Once all files have been provided, the auditor (Dr. Evelyn Foster) will be notified to begin the complete compliance verification testing.
              </p>
              
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Active Stage Guidelines:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <li>Ensure all screenshots display configuration parameters clearly with readable system dates.</li>
                <li>Write clear descriptions when responding to auditor questions in the <Link to="/findings" style={{ color: 'var(--primary)', fontWeight: '600' }}>Findings</Link> tab.</li>
                <li>Submit policies in PDF formats and log records in Excel sheet spreadsheets.</li>
              </ul>
            </>
          )}

          {activeStep === 3 && (
            <>
              <h3 className="section-title" style={{ marginBottom: '12px', fontSize: '16px' }}>Current Phase: Auditor Review</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '20px' }}>
                Your evidence submissions are currently undergoing <strong>Auditor Review</strong>. Dr. Evelyn Foster is inspecting each control and will post queries or findings if additional documents are needed.
              </p>
              
              <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Active Stage Guidelines:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <li>Monitor the <Link to="/findings" style={{ color: 'var(--primary)', fontWeight: '600' }}>Findings</Link> tab for any feedback from the auditor.</li>
                <li>Ensure key managers are ready for scheduled interview calls if requested.</li>
              </ul>
            </>
          )}

          {activeStep === 5 && (
            <>
              <h3 className="section-title" style={{ marginBottom: '12px', fontSize: '16px' }}>Current Phase: Certification Signed Off</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '20px' }}>
                Congratulations! Your {currentAudit} compliance verification has been signed off. You can retrieve your certificate in the final report section.
              </p>
            </>
          )}

          <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>Audit Phase History:</h4>
          <div className="timeline-list" style={{ paddingLeft: '16px' }}>
            {activeStep >= 3 && (
              <div className="timeline-item system">
                <span className="timeline-marker"></span>
                <div className="timeline-content">
                  <span className="timeline-message">Phase 3: Auditor Review initialized (All evidence files received)</span>
                  <span className="timeline-meta">Today • System</span>
                </div>
              </div>
            )}
            <div className="timeline-item system">
              <span className="timeline-marker"></span>
              <div className="timeline-content">
                <span className="timeline-message">Phase 2: Evidence Gathering initialized</span>
                <span className="timeline-meta">2026-07-01 • System</span>
              </div>
            </div>
            <div className="timeline-item system">
              <span className="timeline-marker"></span>
              <div className="timeline-content">
                <span className="timeline-message">Phase 1: Compliance scope definition finalized</span>
                <span className="timeline-meta">2026-06-28 • Dr. Evelyn Foster</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Download certification trigger */}
        <div>
          <div className="dashboard-section-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 className="section-title" style={{ marginBottom: '16px' }}>Audit Statistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Framework</span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>{currentAudit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall Score</span>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--primary)' }}>{score}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Compliance Officer</span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Sarah Connor</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Assigned Auditor</span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>Dr. Evelyn Foster</span>
              </div>
            </div>
          </div>

          {/* Final Certificate Banner */}
          <div className="dashboard-section-card" style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              <FileLock size={40} style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>Final Compliance Certification</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              {activeStep === 5 ? 'All audits signed off! You can now download the final certificate.' : 'The executive summary and certificates will be unlocked for download once all controls are certified by the auditor.'}
            </p>
            {activeStep === 5 ? (
              <button 
                className="btn btn-primary btn-block"
                onClick={() => alert(`Downloading ${currentAudit} Compliance Certificate...`)}
              >
                <Download size={14} /> Download Certificate
              </button>
            ) : (
              <button 
                disabled 
                className="btn btn-secondary btn-block" 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                onClick={() => alert('Download will unlock once audit reaches Phase 5.')}
              >
                <Download size={14} /> Download Certificate (Locked)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
