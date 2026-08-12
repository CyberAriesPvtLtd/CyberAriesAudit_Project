import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import logo from '../assets/cyberaries-logo.png';
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { registerAdmin } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Admin'
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      setError('All fields are required.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Save admin
    registerAdmin({
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      role: 'Admin'
    });

    // Redirect to login page
    navigate('/login', { state: { registered: true } });
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-redesign" style={{ maxWidth: '540px' }}>
        {/* Logo centered inside card */}
        <div className="auth-logo-container">
          <img src={logo} alt="CyberAries Logo" className="auth-logo-img" />
        </div>

        <div className="auth-card-header">
          <h2 className="auth-card-title">Create Admin Account</h2>
          <p className="auth-card-subtitle">Set up your credentials to manage the CyberAries platform.</p>
        </div>

        {error && (
          <div className="error-message" style={{ padding: '12px', fontSize: '13px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-row">
            <div className="auth-input-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Full Name</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  name="fullName"
                  className="auth-input-field"
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                <User size={16} className="auth-input-icon" />
              </div>
            </div>
            
            <div className="auth-input-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Username</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  name="username"
                  className="auth-input-field"
                  placeholder="admin123"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <User size={16} className="auth-input-icon" />
              </div>
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-input-group" style={{ flex: '1.6' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Email Address</label>
              <div className="auth-input-wrapper">
                <input
                  type="email"
                  name="email"
                  className="auth-input-field"
                  placeholder="admin@cyberaries.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Mail size={16} className="auth-input-icon" />
              </div>
            </div>

            <div className="auth-input-group" style={{ flex: '1' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Role</label>
              <input
                type="text"
                name="role"
                className="auth-input-field"
                value="Admin"
                disabled
                style={{ backgroundColor: '#F1F5F9', cursor: 'not-allowed', paddingLeft: '14px' }}
              />
            </div>
          </div>

          <div className="auth-form-row">
            <div className="auth-input-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="auth-input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Lock size={16} className="auth-input-icon" />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-input-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Confirm Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="auth-input-field"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Lock size={16} className="auth-input-icon" />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" style={{ marginTop: '12px' }}>
            <ShieldCheck size={18} /> Create Account
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#64748B' }}>
          Already have an account? <Link to="/login" style={{ color: '#E53935', fontWeight: '600', textDecoration: 'none' }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}
