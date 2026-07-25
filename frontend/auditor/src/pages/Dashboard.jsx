import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ClipboardList, Clock, CheckCircle, Cpu, Activity, ArrowRight, Calendar, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { assignedClients, clientAuditsMapping, selectedClient, selectedAudit, activeAuditData } = useAuth();

  const totalClients = assignedClients.length;
  const totalAudits = Object.values(clientAuditsMapping).reduce((acc, curr) => acc + curr.length, 0);
  const pendingReviews = activeAuditData.stats.pending;
  const completedReviews = activeAuditData.stats.completed;

  const statCards = [
    { title: 'Assigned Clients', value: String(totalClients), icon: <Users size={24} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { title: 'Assigned Audits', value: String(totalAudits), icon: <ClipboardList size={24} />, color: '#1A73E8', bg: '#E8F0FE' },
    { title: 'Pending Reviews', value: String(pendingReviews), icon: <Clock size={24} />, color: '#B06000', bg: '#FEF7E0' },
    { title: 'Completed Reviews', value: String(completedReviews), icon: <CheckCircle size={24} />, color: '#137333', bg: '#E6F4EA' },
  ];

  const recentActivity = [
    { id: 1, action: `${selectedClient} uploaded new evidence for ${selectedAudit}`, time: '10 min ago' },
    { id: 2, action: `AI analysis completed for ${selectedClient}`, time: '25 min ago' },
    { id: 3, action: `Draft report generated for ${selectedClient} - ${selectedAudit}`, time: '1 hr ago' },
  ];

  const upcomingDeadlines = [
    { id: 1, audit: `${selectedClient} ${selectedAudit} Audit`, due: 'Due in 5 days', urgent: true },
    { id: 2, audit: 'XYZ Finance SEBI CSCRF Audit', due: 'Due in 15 days', urgent: false },
    { id: 3, audit: 'Nova Logistics ISO 27001 Audit', due: 'Due in 25 days', urgent: false },
  ];

  const pieData = [
    { name: 'Compliant', value: activeAuditData.stats.completed, color: '#137333' },
    { name: 'Pending Review', value: activeAuditData.stats.pending, color: '#B06000' },
    { name: 'Under AI Review', value: activeAuditData.stats.aiReview, color: '#C5221F' },
    { name: 'Not Uploaded', value: Math.max(0, activeAuditData.stats.assigned - activeAuditData.stats.completed - activeAuditData.stats.pending - activeAuditData.stats.aiReview), color: 'var(--text-muted)' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Welcome, Rahul Sharma</h1>
          <p className="page-subtitle">Here's what's happening with your audits today.</p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        {statCards.map((stat, index) => (
          <div className="metric-card" key={index} style={{ borderLeft: `4px solid ${stat.color}` }}>
            <div className="metric-content">
              <span className="metric-label">{stat.title}</span>
              <span className="metric-value">{stat.value}</span>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Section Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-section-card">
          <div className="section-header">
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} className="text-secondary" /> Recent Activity
            </span>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>View All</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="timeline-list">
              {recentActivity.map(activity => (
                <div className="timeline-item system" key={activity.id}>
                  <span className="timeline-marker" style={{ backgroundColor: 'var(--primary)' }}></span>
                  <div className="timeline-content">
                    <span className="timeline-message">{activity.action}</span>
                    <div className="timeline-meta">
                      <span className="timeline-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-section-card">
          <div className="section-header">
            <span className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-secondary" /> Upcoming Deadlines
            </span>
            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>View All</button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {upcomingDeadlines.map((deadline, idx) => (
                <div key={deadline.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: idx < upcomingDeadlines.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: '10px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {deadline.audit}
                    </div>
                    <div style={{ fontSize: '11px', color: deadline.urgent ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: deadline.urgent ? '600' : '400' }}>
                      {deadline.due}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-section-card">
          <div className="section-header">
            <span className="section-title">Audit Status Overview</span>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="chart-container" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="chart-wrapper" style={{ position: 'relative', width: '160px', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center-text">
                  <span className="chart-total">{activeAuditData.stats.assigned}</span>
                  <span className="chart-label">Total Controls</span>
                </div>
              </div>
              <div className="chart-legend" style={{ flex: 1, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pieData.map((entry, index) => (
                  <div className="legend-item" key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                    <span className="legend-color" style={{ backgroundColor: entry.color, width: '10px', height: '10px', borderRadius: '50%', marginRight: '8px', display: 'inline-block' }}></span>
                    <span className="legend-name" style={{ flex: 1, color: 'var(--text-secondary)' }}>{entry.name}</span>
                    <span className="legend-value" style={{ fontWeight: 600 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section-card">
          <div className="section-header">
            <span className="section-title">My Performance</span>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Audits Completed</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{completedReviews}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Reports Approved</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{(activeAuditData.reports || []).filter(r => r.status === 'Approved').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Avg. Review Time</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>2.4 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
