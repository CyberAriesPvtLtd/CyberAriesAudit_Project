import React, { useState } from 'react';
import { useClient } from '../context/ClientContext';
import { Settings as SettingsIcon, ShieldCheck, Mail, Save } from 'lucide-react';

export default function Settings() {
  const { settings, updatePreferences } = useClient();
  const [activeTab, setActiveTab] = useState('preferences');

  // Preference Form states
  const [timezone, setTimezone] = useState(settings.timezone || 'UTC/GMT +5:30');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'YYYY-MM-DD');
  const [sessionTimeout, setSessionTimeout] = useState(settings.sessionTimeout || '60 minutes');
  const [alertsEnabled, setAlertsEnabled] = useState(settings.alertsEnabled !== false);
  const [weeklyDigest, setWeeklyDigest] = useState(settings.weeklyDigest === true);

  // Alert Success
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');

    updatePreferences({
      timezone,
      dateFormat,
      sessionTimeout,
      alertsEnabled,
      weeklyDigest
    });

    setSuccessMsg('Portal preferences saved successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Portal Preferences & Policies</h1>
          <p className="page-subtitle">Configure timezone details, alerts settings, and review assigned auditors info.</p>
        </div>
      </div>

      {/* Success alert Banner */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#047857', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14.5px', marginBottom: '24px', fontWeight: '500' }}>
          <ShieldCheck size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Layout Split Grid */}
      <div className="settings-layout">
        
        {/* Left Side: Tabs Nav */}
        <div className="settings-nav">
          <button 
            className={`settings-nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <SettingsIcon size={16} style={{ marginRight: '8px' }} /> Preferences
          </button>
          
          <button 
            className={`settings-nav-item ${activeTab === 'auditor' ? 'active' : ''}`}
            onClick={() => setActiveTab('auditor')}
          >
            <ShieldCheck size={16} style={{ marginRight: '8px' }} /> Assigned Auditor
          </button>
        </div>

        {/* Right Side: Tab Panes */}
        <div className="settings-pane">
          
          {activeTab === 'preferences' ? (
            /* Tab 1: Preferences Form */
            <div id="pane-preferences">
              <h3 className="settings-pane-title">Client Portal Preferences</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Default Timezone</label>
                  <select 
                    id="settings-timezone" 
                    className="form-input"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="UTC/GMT +5:30">UTC/GMT +5:30 (India Standard Time)</option>
                    <option value="UTC/GMT Z">UTC/GMT Z (Greenwich Mean Time)</option>
                    <option value="EST (New York)">EST (New York Time)</option>
                    <option value="PST (Los Angeles)">PST (Los Angeles Time)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">System Date Format</label>
                    <select 
                      id="settings-dateformat" 
                      className="form-input"
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Session Timeout</label>
                    <select 
                      id="settings-timeout" 
                      className="form-input"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    >
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes</option>
                      <option value="60 minutes">60 minutes</option>
                      <option value="240 minutes">240 minutes</option>
                    </select>
                  </div>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '20px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', letterSpacing: '0.5px' }}>
                  Alert Toggles
                </h4>
                
                <div className="form-group">
                  <label className="checkbox-container" style={{ marginBottom: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                    />
                    <span>Enable instant email reminders on auditor comments/replies</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox" 
                      checked={weeklyDigest}
                      onChange={(e) => setWeeklyDigest(e.target.checked)}
                    />
                    <span>Enable weekly digest summaries of audit milestones progress</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                  <Save size={16} /> Save Preferences
                </button>
              </form>
            </div>
          ) : (
            /* Tab 2: Assigned Auditor Contact */
            <div id="pane-auditor">
              <h3 className="settings-pane-title">Assigned Security Auditor Details</h3>
              
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                Your SOC 2 Type II audit is monitored by a certified compliance inspector. Review their credentials details below or contact them directly.
              </p>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: 'var(--bg-hover)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#E8F0FE', color: '#1A73E8', fontWeight: 700, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(26, 115, 232, 0.2)' }}>
                  EF
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '16px', display: 'block', color: 'var(--text-primary)' }}>Dr. Evelyn Foster</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>Assigned Framework Auditor</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Expertise: ISO 27001, SOC 2, HIPAA compliance testing</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Direct Work Email</span>
                  <strong style={{ color: 'var(--text-primary)' }}>evelyn.f@cyberaries.com</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Verification Office ID</span>
                  <strong style={{ color: 'var(--text-primary)' }}>AUD-001</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', fontSize: '13.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Compliance Agency</span>
                  <strong style={{ color: 'var(--text-primary)' }}>CyberAries Quality Assurance Dept.</strong>
                </div>
              </div>

              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '28px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => window.location.href='mailto:evelyn.f@cyberaries.com?subject=SOC2%20Audit%20Aether%20Technologies'}
              >
                <Mail size={16} /> Send Auditor Message
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
