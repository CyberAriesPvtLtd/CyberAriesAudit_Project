import React, { useEffect, useState } from 'react';
import { useClient } from '../context/ClientContext';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, RefreshCw, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { controls, activities, currentAudit, switchAudit, assignedAudits } = useClient();
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState({ total: 0, completed: 0, inprogress: 0, action: 0 });
  const [domainProgress, setDomainProgress] = useState([]);

  useEffect(() => {
    // 1. Calculate stats
    const total = controls.length;
    const completed = controls.filter(c => c.status === 'Completed').length;
    const inprogress = controls.filter(c => c.status === 'In Progress').length;
    const action = controls.filter(c => c.status === 'Action Required').length;
    const scoreVal = total ? Math.round((completed / total) * 100) : 0;

    setScore(scoreVal);
    setStats({ total, completed, inprogress, action });

    // 2. Calculate progress by domain
    const domains = [...new Set(controls.map(c => c.domain))];
    const progressData = domains.map(dom => {
      const domControls = controls.filter(c => c.domain === dom);
      const domTotal = domControls.length;
      const domCompleted = domControls.filter(c => c.status === 'Completed').length;
      const pct = domTotal ? Math.round((domCompleted / domTotal) * 100) : 0;
      return { name: dom, total: domTotal, completed: domCompleted, percentage: pct };
    });
    setDomainProgress(progressData);
  }, [controls]);

  // Action items (Controls marked In Progress or Action Required)
  const actionRequiredItems = controls.filter(c => c.status !== 'Completed').slice(0, 3);

  // SVG Gauge Offset
  const circumference = 2 * Math.PI * 70; // r=70
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let dueDate = '2026-08-15';
  if (currentAudit === 'ISO 27001') dueDate = '2026-09-15';
  else if (currentAudit === 'SEBI CSCRF') dueDate = '2026-06-10';
  else if (currentAudit === 'RBI Cyber Security') dueDate = '2026-10-30';

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">{currentAudit} Dashboard</h1>
          <p className="page-subtitle">Welcome back, client portal overview, audit telemetry, and tasks details.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/audit-status" className="btn btn-secondary">
            <RefreshCw size={16} /> Track Audit Phase
          </Link>
          <Link to="/my-audits" className="btn btn-primary">
            View Requirements
          </Link>
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

      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', padding: '28px 32px', borderRadius: 'var(--radius-lg)', color: '#FFFFFF', marginBottom: '28px' }}>
        <h2 className="welcome-title" style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Aether Technologies Compliance Portal</h2>
        <p className="welcome-subtitle" style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Your company is currently <span id="welcome-score-text" style={{ fontWeight: '700', color: '#FFFFFF', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '4px' }}>{score}% compliant</span> with the {currentAudit} framework. There are {stats.action} pending actions requesting evidence submission to the Auditor.
        </p>
      </div>

      {/* Grid: Compliance circular chart & metric cards */}
      <div className="client-dashboard-top-grid">
        
        {/* Circle Gauge Card */}
        <div className="dashboard-section-card" style={{ marginBottom: 0 }}>
          <div className="section-header">
            <span className="section-title">Compliance Progress</span>
          </div>
          <div className="compliance-gauge-card">
            <div className="compliance-gauge-container">
              <svg className="compliance-gauge-svg" viewBox="0 0 160 160">
                <circle className="compliance-gauge-bg" cx="80" cy="80" r="70" />
                <circle 
                  className="compliance-gauge-value" 
                  cx="80" 
                  cy="80" 
                  r="70" 
                  style={{
                    strokeDasharray: circumference,
                    strokeDashoffset: strokeDashoffset
                  }}
                />
              </svg>
              <div className="compliance-gauge-text">
                <span className="compliance-gauge-percentage">{score}%</span>
                <span className="compliance-gauge-label">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid & Domain Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          
          {/* Card Widgets */}
          <div className="metrics-grid" style={{ marginBottom: 0, width: '100%' }}>
            <div className="metric-card" style={{ borderLeft: '4px solid #1E293B' }}>
              <div className="metric-content">
                <span className="metric-label">Total Controls</span>
                <span className="metric-value">{stats.total}</span>
              </div>
              <div className="metric-icon-wrapper">
                <ClipboardList size={24} />
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #10B981' }}>
              <div className="metric-content">
                <span className="metric-label">Completed</span>
                <span className="metric-value">{stats.completed}</span>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: '#E6F4EA', color: '#137333' }}>
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid #1A73E8' }}>
              <div className="metric-content">
                <span className="metric-label">In Progress</span>
                <span className="metric-value">{stats.inprogress}</span>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: '#E8F0FE', color: '#1A73E8' }}>
                <RefreshCw size={24} />
              </div>
            </div>

            <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="metric-content">
                <span className="metric-label">Action Required</span>
                <span className="metric-value">{stats.action}</span>
              </div>
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* Domain Progress bars */}
          <div className="dashboard-section-card" style={{ marginBottom: 0, marginTop: '20px', padding: '20px' }}>
            <h3 className="section-title" style={{ marginBottom: '16px' }}>Audit Progress by Security Domain</h3>
            <div className="progress-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {domainProgress.map(dom => (
                <div key={dom.name} style={{ border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <span>{dom.name}</span>
                    <span>{dom.percentage}%</span>
                  </div>
                  <div className="progress-bar-track" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${dom.percentage}%`, height: '100%' }}></div>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {dom.completed} of {dom.total} controls certified
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Timeline activities feed & Action Required checklists */}
      <div className="dashboard-grid">
        
        {/* Left Column: Timeline feed */}
        <div>
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">Audit Timeline & Telemetry Feed</span>
              <Link to="/findings" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
                Auditor Findings &rarr;
              </Link>
            </div>
            <div style={{ padding: '24px' }}>
              <div className="timeline-list">
                {activities.map(act => (
                  <div key={act.id} className="timeline-item">
                    <span className={`timeline-marker ${act.type.toLowerCase()}`}></span>
                    <div className="timeline-content">
                      <span className="timeline-message">{act.message}</span>
                      <span className="timeline-meta">
                        {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.user}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Action items list & warnings */}
        <div>
          {/* Action Required list */}
          <div className="dashboard-section-card">
            <div className="section-header">
              <span className="section-title">Action Required Checklist</span>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>Immediate Attention</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {actionRequiredItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', display: 'block' }}>{item.id}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'block', marginTop: '2px' }}>{item.name}</span>
                    </div>
                    <Link to={`/control-details?id=${item.id}`} style={{ color: 'var(--text-secondary)' }}>
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ))}
                {actionRequiredItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    All controls are currently certified! No action required.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Readiness Notice Warning */}
          <div className="dashboard-section-card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--primary-light)', marginBottom: 0 }}>
            <div style={{ padding: '16px 20px' }}>
              <h4 style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} /> Audit Readiness Notice
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                Your {currentAudit} audit window is scheduled to close on <span style={{ fontWeight: '700' }}>{dueDate}</span>. Evidence submission is required for all controls before compliance certification can be generated.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
