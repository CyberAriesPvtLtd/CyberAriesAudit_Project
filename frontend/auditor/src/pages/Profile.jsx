import React from 'react';

const Profile = () => {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Profile</h1>
      </div>
      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ffe4e6', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 600 }}>
            RA
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Rahul Sharma</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Senior Compliance Auditor</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Email</label>
            <input type="text" value="rahul.sharma@cyberaries.com" readOnly style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Assigned Audits Count</label>
            <input type="text" value="12 Active" readOnly style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }} />
          </div>

          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-outline" style={{ marginRight: '12px' }}>Change Password</button>
            <button className="btn btn-danger">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
