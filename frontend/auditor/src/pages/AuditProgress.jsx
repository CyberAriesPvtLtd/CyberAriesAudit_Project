import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';

const AuditProgress = () => {
  const { selectedClient, selectedAudit, activeAuditData } = useAuth();

  const score = activeAuditData.progress.score;
  const total = activeAuditData.progress.total;
  const completed = activeAuditData.progress.completed;
  const pending = activeAuditData.stats.pending;
  const aiReview = activeAuditData.stats.aiReview;
  const manual = Math.max(0, total - completed - pending - aiReview);

  const overallData = [
    { name: 'Completed', value: score, color: '#137333' },
    { name: 'Pending', value: 100 - score, color: 'var(--border-color)' },
  ];

  let domainData = [
    { name: 'Access Control', completed: score, pending: 100 - score },
    { name: 'Cryptography', completed: Math.min(100, score + 10), pending: Math.max(0, 90 - score) },
    { name: 'Operations', completed: Math.min(100, Math.round(score * 1.2)), pending: Math.max(0, 100 - Math.round(score * 1.2)) }
  ];

  if (selectedAudit === 'ISO 27001') {
    domainData = [
      { name: 'Policies (A.5)', completed: 100, pending: 0 },
      { name: 'Organization (A.6)', completed: 0, pending: 100 },
      { name: 'Asset Mgmt (A.8)', completed: 0, pending: 100 },
      { name: 'Access Control (A.9)', completed: 100, pending: 0 },
      { name: 'Operations (A.12)', completed: 100, pending: 0 }
    ];
  } else if (selectedAudit === 'SEBI CSCRF') {
    domainData = [
      { name: 'Governance', completed: 100, pending: 0 },
      { name: 'Identification', completed: 100, pending: 0 },
      { name: 'Protection', completed: 100, pending: 0 },
      { name: 'Detection', completed: 100, pending: 0 }
    ];
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Audit Progress : {selectedClient}</h1>
        <p className="page-subtitle">Track completion metrics for {selectedAudit}.</p>
      </div>

      <div className="responsive-two-col">
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Overall Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallData}
                    innerRadius={70}
                    outerRadius={90}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {overallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-main)' }}>{score}%</span>
              </div>
            </div>
            
            <div style={{ width: '100%', marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Total Controls</span>
                <span style={{ fontWeight: 600 }}>{total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Completed</span>
                <span style={{ fontWeight: 600, color: '#137333' }}>{completed}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Pending AI</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{aiReview}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manual Review</span>
                <span style={{ fontWeight: 600, color: '#B06000' }}>{manual}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Progress by Security Domain</h3>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} width={120} />
                <Tooltip cursor={{ fill: 'var(--bg-main)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="completed" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} barSize={24} />
                <Bar dataKey="pending" stackId="a" fill="var(--border-color)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditProgress;
