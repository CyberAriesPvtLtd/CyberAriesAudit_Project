import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import logo from '../assets/cyberaries-logo.png';
import { LogIn, ShieldAlert, Check, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { loginAdmin } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [username, setUsername] = useState('admin@cyberaries.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    location.state?.registered ? 'Account created successfully! Please log in.' : ''
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const successLogin = loginAdmin(username, password);
    if (successLogin) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-redesign">
        {/* Logo centered inside card */}
        <div className="auth-logo-container">
          <img src={logo} alt="CyberAries Logo" className="auth-logo-img" />
        </div>

        <div className="auth-card-header">
          <h2 className="auth-card-title">Admin Portal</h2>
          <p className="auth-card-subtitle">Manage compliance standards, companies, and auditor registry.</p>
        </div>

        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '13px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '8px' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#047857', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Email</label>
            <div className="auth-input-wrapper">
              <input
                type="text"
                className="auth-input-field"
                placeholder="admin@cyberaries.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <User size={16} className="auth-input-icon" />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Password</label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} className="auth-input-icon" />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', fontSize: '13px' }}>
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            
            <Link 
              to="/forgot-password" 
              className="forgot-password-link"
              style={{ color: '#E53935', fontWeight: '600', textDecoration: 'none' }}
            >
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="auth-btn-primary">
            <LogIn size={18} /> Sign In
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
          <span style={{ fontWeight: '600' }}>Testing Account:</span> <code style={{ fontSize: '11px', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>admin@cyberaries.com</code> / <code style={{ fontSize: '11px', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>Admin@123</code>
        </div>
      </div>
    </div>
  );
}
