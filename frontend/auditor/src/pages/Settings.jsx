import React from 'react';

const Settings = () => {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Settings</h1>
      </div>
      <div className="card" style={{ maxWidth: '800px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Notification Preferences</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Email me when a client uploads new evidence</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Email me when AI analysis is completed</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" />
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Daily summary digest</span>
          </label>
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>AI Preferences</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Auto-assign Confidence Score</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked />
            <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Highlight missing evidence in Review Panel</span>
          </label>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">Save Preferences</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
