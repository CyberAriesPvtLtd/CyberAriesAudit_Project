import React from 'react';
import { Upload, Cpu, UserCheck, FileText, AlertTriangle } from 'lucide-react';

const Notifications = () => {
  const notifications = [
    { id: 1, type: 'upload', title: 'Client uploaded new evidence', desc: 'ABC Securities uploaded 3 documents for PR.AA.56', time: '5 min ago', icon: <Upload size={18} />, color: 'var(--primary-blue)' },
    { id: 2, type: 'ai', title: 'AI analysis completed', desc: 'XYZ Finance - Data Backup control analysis finished', time: '15 min ago', icon: <Cpu size={18} />, color: 'var(--status-green-text)' },
    { id: 3, type: 'deadline', title: 'Deadline approaching', desc: 'CSCRF Audit for PQR Capital is due in 2 days', time: '1 hr ago', icon: <AlertTriangle size={18} />, color: 'var(--accent-red)' },
    { id: 4, type: 'report', title: 'Draft report generated', desc: 'Draft report ready for LMN Investments', time: '2 hrs ago', icon: <FileText size={18} />, color: 'var(--text-main)' },
    { id: 5, type: 'manual', title: 'Manual review requested', desc: 'Your review is requested for ABC Securities - 3 controls', time: '3 hrs ago', icon: <UserCheck size={18} />, color: 'var(--status-yellow-text)' },
  ];

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Notifications</h1>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', gap: '16px' }}>
          <button className="btn btn-primary" style={{ padding: '6px 16px', borderRadius: '20px' }}>All</button>
          <button className="btn btn-outline" style={{ padding: '6px 16px', borderRadius: '20px', border: 'none' }}>Unread</button>
          <button className="btn btn-outline" style={{ padding: '6px 16px', borderRadius: '20px', border: 'none' }}>Important</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map(notif => (
            <div key={notif.id} style={{ display: 'flex', padding: '20px 24px', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start', gap: '16px', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-main)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${notif.color}15`, color: notif.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {notif.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{notif.title}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{notif.time}</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{notif.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
