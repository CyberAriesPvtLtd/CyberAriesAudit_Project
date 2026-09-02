import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { Save, Key, UserCheck, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { currentUser, controls, updateProfile } = useClient();

  // Contact Info states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Company Info states
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [employees, setEmployees] = useState('120');
  const [website, setWebsite] = useState('https://aether.io');

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [passSuccessMsg, setPassSuccessMsg] = useState('');
  const [passErrorMsg, setPassErrorMsg] = useState('');

  // Sync state values on load
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCompanyName(currentUser.companyName || '');
      setIndustry(currentUser.industry || '');
    }
  }, [currentUser]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');

    updateProfile({
      fullName,
      email,
      phone,
      companyName,
      industry
    });

    setSuccessMsg('Profile details updated successfully.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassSuccessMsg('');
    setPassErrorMsg('');

    if (newPassword !== confirmPassword) {
      setPassErrorMsg('New passwords do not match!');
      return;
    }

    // Success simulation
    setPassSuccessMsg('Account password updated successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPassSuccessMsg(''), 4000);
  };

  // Calculate score
  const completedCount = controls.filter(c => c.status === 'Completed').length;
  const score = controls.length ? Math.round((completedCount / controls.length) * 100) : 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">Client Account & Company Details</h1>
          <p className="page-subtitle">Configure contact details, manage password credentials, and edit company attributes.</p>
        </div>
      </div>

      {/* Success alert Banner */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#047857', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '14.5px', marginBottom: '24px', fontWeight: '500' }}>
          <ShieldCheck size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile grid layout split */}
      <div className="profile-layout-grid">
        
        {/* Left Column: Stats & Avatar */}
        <div>
          <div className="profile-card-left" style={{ marginBottom: '24px' }}>
            <div className="profile-avatar-large">
              {currentUser?.avatarInitials || 'SC'}
            </div>
            <h2 className="profile-name-header">{currentUser?.fullName || 'Sarah Connor'}</h2>
            <span className="profile-role-sub">Compliance Lead @ {currentUser?.companyName || 'Aether Tech'}</span>
            
            <div className="profile-meta-items">
              <div className="profile-meta-row">
                <span className="profile-meta-label">System Role</span>
                <span className="profile-meta-val" style={{ color: 'var(--primary)' }}>Client Officer</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Last Login</span>
                <span className="profile-meta-val">Today, 2:35 PM</span>
              </div>
            </div>
          </div>

          <div className="profile-card-left">
            <h3 className="section-title" style={{ marginBottom: '16px', fontSize: '15px', width: '100%', textAlign: 'left' }}>Compliance Org Profile</h3>
            
            <div className="profile-meta-items" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Company Name</span>
                <span className="profile-meta-val">{currentUser?.companyName || 'Aether Technologies'}</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Sector</span>
                <span className="profile-meta-val">{currentUser?.industry || 'SaaS / Cloud'}</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Active Audit</span>
                <span className="profile-meta-val">SOC 2 Type II</span>
              </div>
              <div className="profile-meta-row">
                <span className="profile-meta-label">Certified Score</span>
                <span className="profile-meta-val" style={{ color: 'var(--primary)', fontWeight: '700' }}>{score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms inputs */}
        <div>
          {/* Form 1: Edit Contact Info */}
          <div className="dashboard-section-card" style={{ padding: '32px', marginBottom: '28px' }}>
            <h3 className="settings-pane-title" style={{ marginBottom: '24px' }}>Manage Account Settings</h3>
            
            <form onSubmit={handleProfileSubmit}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', letterSpacing: '0.5px' }}>
                Contact Info
              </h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Title / Role</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    disabled 
                    value="Compliance Officer"
                    style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', letterSpacing: '0.5px' }}>
                Company Info
              </h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry Sector</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Employees</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={employees}
                    onChange={(e) => setEmployees(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    required 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
                <Save size={16} /> Save Profile Details
              </button>
            </form>
          </div>

          {/* Form 2: Change Password */}
          <div className="dashboard-section-card" style={{ padding: '32px', marginBottom: 0 }}>
            <h3 className="settings-pane-title" style={{ marginBottom: '24px' }}>Change Account Password</h3>
            
            {passSuccessMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#047857', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', marginBottom: '16px' }}>
                <UserCheck size={16} />
                <span>{passSuccessMsg}</span>
              </div>
            )}

            {passErrorMsg && (
              <div className="error-message" style={{ padding: '10px 14px', fontSize: '13.5px', marginBottom: '16px' }}>
                {passErrorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    required 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ marginTop: '12px', color: 'var(--primary)', borderColor: 'rgba(229,57,53,0.2)' }}>
                <Key size={16} /> Update Passwords
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
