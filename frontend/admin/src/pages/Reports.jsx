import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, Download, FileText, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Reports() {
  const { companies, audits } = useApp();

  const handleExportPDF = () => {
    // Elegant way to print: trigger print stylesheet or show print dialog
    window.print();
  };

  const handleExportExcel = () => {
    // Generate a simple CSV formatted string for compliance reports
    let content = "CyberAries Compliance Analytics Report\n";
    content += `Date: ${new Date().toLocaleDateString()}\n\n`;
    content += "Company,Compliance Score,Audits Count,Status\n";
    companies.forEach(c => {
      content += `${c.name},${c.complianceScore}%,${c.auditsCount},${c.status}\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Compliance_Analytics_Report_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Average Compliance Score calculation
  const avgCompliance = Math.round(companies.reduce((sum, c) => sum + c.complianceScore, 0) / companies.length) || 0;

  return (
    <div className="page-container printable-report">
      <div className="page-header hide-on-print">
        <div className="page-title-section">
          <h1 className="page-title">Reports & Compliance Analytics</h1>
          <p className="page-subtitle">Inspect telemetry telemetry, score breakdowns, and auditor performance gauges.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportPDF}>
            <FileText size={16} /> Export PDF Report
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel}>
            <Download size={16} /> Export Analytics XLS
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="show-only-on-print" style={{ display: 'none', marginBottom: '40px', borderBottom: '2px solid var(--primary)', paddingBottom: '20px' }}>
        <h1 style={{ color: '#0F172A', fontSize: '32px', margin: 0 }}>CyberAries Compliance Report</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Executive telemetry details and alignment scoring.</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Report Generated: {new Date().toLocaleString()}</p>
      </div>

      {/* Score Grid Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <span className="metric-label" style={{ fontSize: '12px' }}>Overall Compliance Index</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary)' }}>{avgCompliance}%</span>
            <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
              <TrendingUp size={14} style={{ marginRight: '2px' }} /> +2.4%
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Weighted average compliance score across all scopes.</p>
        </div>

        <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <span className="metric-label" style={{ fontSize: '12px' }}>Total Active Controls</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: '#1E293B' }}>48</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>mapped controls</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across CSCRF security domains and framework functions.</p>
        </div>

        <div className="metric-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <span className="metric-label" style={{ fontSize: '12px' }}>Auditor Verification Rate</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '48px', fontWeight: '800', color: '#10B981' }}>98.6%</span>
            <span style={{ color: '#10B981', fontSize: '13px', fontWeight: '600' }}>Excellent</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Evidence compliance accuracy verified by lead assessors.</p>
        </div>
      </div>

      {/* Charts Display Grid */}
      <div className="reports-layout">
        {/* Company Compliance Comparison Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Compliance Index by Registered Company</h3>
          <div className="chart-container">
            {companies.map(c => (
              <div key={c.id} className="chart-bar-group">
                <div 
                  className="chart-bar" 
                  style={{ 
                    height: `${c.complianceScore}%`,
                    backgroundColor: c.complianceScore > 85 ? '#10B981' : c.complianceScore > 70 ? '#F59E0B' : 'var(--primary)'
                  }}
                >
                  <span className="chart-bar-value">{c.complianceScore}%</span>
                </div>
                <span className="chart-bar-label" style={{ fontSize: '10px' }}>{c.name}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px' }}>
            Bar length represents standard compliance alignment score.
          </p>
        </div>

        {/* Global Verification Progress gauge */}
        <div className="chart-card">
          <h3 className="chart-title">Compliance Framework Standard Coverage</h3>
          <div className="chart-radial">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="75" fill="none" stroke="#F1F5F9" strokeWidth="16" />
              <circle 
                cx="90" 
                cy="90" 
                r="75" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="16" 
                strokeDasharray={`${2 * Math.PI * 75}`}
                strokeDashoffset={`${2 * Math.PI * 75 * (1 - avgCompliance / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
              />
            </svg>
            <div className="radial-percentage">{avgCompliance}%</div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '12px' }}>
            Global coverage score compared against perfect compliance.
          </p>
        </div>
      </div>

      {/* Reports Table: Framework Scores details */}
      <div className="dashboard-section-card">
        <div className="section-header">
          <span className="section-title">Security Alignment Index Summary</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Audit telemetries</span>
        </div>
        <table className="excel-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company Entity</th>
              <th>Sector</th>
              <th>Target Frameworks</th>
              <th>Score</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => {
              const matchingAudits = audits.filter(a => a.company === c.name);
              const frameworks = matchingAudits.map(a => a.rulebook).join(', ') || 'No framework scheduled';
              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: '600' }}>{c.id}</td>
                  <td style={{ fontWeight: '500' }}>{c.name}</td>
                  <td>{c.industry}</td>
                  <td>{frameworks}</td>
                  <td style={{ fontWeight: '600', color: c.complianceScore > 85 ? '#137333' : 'var(--primary)' }}>
                    {c.complianceScore}%
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'Active' ? 'badge-active' : c.status === 'Pending Review' ? 'badge-pending' : 'badge-non-compliant'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CSS injection for print styling */}
      <style>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
          }
          .app-sidebar, .top-navigation, .hide-on-print, .btn, .table-toolbar {
            display: none !important;
          }
          .app-layout {
            display: block !important;
          }
          .page-container {
            padding: 0 !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
          .show-only-on-print {
            display: block !important;
          }
          .dashboard-section-card {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
          .excel-table td, .excel-table th {
            border-bottom: 1px solid #000000 !important;
            color: #000000 !important;
            background-color: #FFFFFF !important;
          }
          .chart-card {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
