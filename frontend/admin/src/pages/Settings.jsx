import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, User, ShieldCheck, Mail, Save } from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [successMsg, setSuccessMsg] = useState('');

  // General Settings State
  const [generalForm, setGeneralForm] = useState(settings.general);
  // Profile Settings State
  const [profileForm, setProfileForm] = useState(settings.profile);
  // SMTP Settings State
  const [smtpForm, setSmtpForm] = useState(settings.smtp);

  const showNotification = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleGeneralSubmit = (e) => {
    e.preventDefault();
    updateSettings('general', generalForm);
    showNotification('General configurations updated successfully.');
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateSettings('profile', profileForm);
    showNotification('Profile details updated successfully.');
  };

  const handleSmtpSubmit = (e) => {
    e.preventDefault();
    updateSettings('smtp', smtpForm);
    showNotification('SMTP mail server configurations saved.');
  };

  const rolePermissionsList = [
    { role: 'Administrator', access: 'Full platform access (Read/Write/Delete)', key: 'admin' },
    { role: 'Auditor', access: 'Evidence review, uploading, controls testing, report signing', key: 'auditor' },
    { role: 'Compliance Officer / Client', access: 'Scope configuration, evidence uploads, index viewing', key: 'client' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure compliance rules, verify profile details, set up mail dispatch, and review active roles.</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#047857', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14.5px', marginBottom: '24px', fontWeight: '500' }}>
          {successMsg}
        </div>
      )}

      <div className="settings-layout">
        {/* Settings Navigation */}
        <div className="settings-nav">
          <button 
            className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <SettingsIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            General
          </button>
          
          <button 
            className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Profile
          </button>

          <button 
            className={`settings-nav-item ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            <ShieldCheck size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Role Permissions
          </button>

          <button 
            className={`settings-nav-item ${activeTab === 'smtp' ? 'active' : ''}`}
            onClick={() => setActiveTab('smtp')}
          >
            <Mail size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            SMTP Server
          </button>
        </div>

        {/* Settings Panes */}
        <div className="settings-pane">
          {activeTab === 'general' && (
            <form onSubmit={handleGeneralSubmit}>
              <h3 className="settings-pane-title">Platform Configurations</h3>
              
              <div className="form-group">
                <label className="form-label">Platform Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={generalForm.platformName}
                  onChange={(e) => setGeneralForm({ ...generalForm, platformName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">System Tagline</label>
                <input
                  type="text"
                  className="form-input"
                  value={generalForm.tagline}
                  onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Default Timezone</label>
                  <select
                    className="form-input"
                    value={generalForm.timezone}
                    onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                  >
                    <option value="UTC/GMT +5:30">UTC/GMT +5:30</option>
                    <option value="UTC/GMT Z">UTC/GMT Z</option>
                    <option value="EST (New York)">EST (New York)</option>
                    <option value="PST (Los Angeles)">PST (Los Angeles)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date Format</label>
                  <select
                    className="form-input"
                    value={generalForm.dateFormat}
                    onChange={(e) => setGeneralForm({ ...generalForm, dateFormat: e.target.value })}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Admin Session Timeout</label>
                <select
                  className="form-input"
                  value={generalForm.sessionTimeout}
                  onChange={(e) => setGeneralForm({ ...generalForm, sessionTimeout: e.target.value })}
                >
                  <option value="15 minutes">15 minutes</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="240 minutes">240 minutes</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                <Save size={16} /> Save Configurations
              </button>
            </form>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <h3 className="settings-pane-title">Administrator Profile Details</h3>
              
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Platform Role Assignment</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.role}
                  disabled
                  style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                <Save size={16} /> Update Profile
              </button>
            </form>
          )}

          {activeTab === 'permissions' && (
            <div>
              <h3 className="settings-pane-title">Role Permissions Configuration</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                View and review active security policies and CRUD capacities for system roles. To modify, contact platform supervisors.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {rolePermissionsList.map((item) => (
                  <div 
                    key={item.key} 
                    style={{ 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: item.key === 'admin' ? 'var(--bg-hover)' : '#FFFFFF'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '15px', display: 'block', color: 'var(--text-primary)' }}>{item.role}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.access}</span>
                    </div>
                    <span 
                      className={`badge ${item.key === 'admin' ? 'badge-active' : item.key === 'auditor' ? 'badge-in_progress' : 'badge-suspended'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {item.key === 'admin' ? 'Full Access' : item.key === 'auditor' ? 'Audit Access' : 'Client Access'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <form onSubmit={handleSmtpSubmit}>
              <h3 className="settings-pane-title">SMTP Mail Server Configs</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Email configurations are required to dispatch automated compliance reminders and auditor invitations.
              </p>

              <div className="form-group">
                <label className="form-label">SMTP Server Host</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="smtp.domain.com"
                  value={smtpForm.server}
                  onChange={(e) => setSmtpForm({ ...smtpForm, server: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SMTP Port</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="587"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', marginTop: '36px' }}>
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={smtpForm.ssl}
                      onChange={(e) => setSmtpForm({ ...smtpForm, ssl: e.target.checked })}
                    />
                    <span>Force TLS/SSL Encryption</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Authentication Username</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="alerts@domain.com"
                  value={smtpForm.username}
                  onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sender Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                <Save size={16} /> Save Mail Settings
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
