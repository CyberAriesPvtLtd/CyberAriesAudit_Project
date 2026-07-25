import React, { useState } from 'react';
import { useClient } from '../context/ClientContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const success = login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Please use sarah@aether.io and password.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-redesign">
        {/* Logo centered inside card */}
        <div className="auth-logo-container">
          <img src="/assets/logos/cyberaries-logo.png" alt="CyberAries Logo" className="auth-logo-img" />
        </div>

        <div className="auth-card-header">
          <h2 className="auth-card-title">Client Portal</h2>
          <p className="auth-card-subtitle">Access your compliance workspace to upload evidence and track certification.</p>
        </div>

        {error && (
          <div className="error-message" style={{ padding: '12px', fontSize: '13px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Corporate Email Address</label>
            <div className="auth-input-wrapper">
              <input 
                type="text" 
                className="auth-input-field" 
                required 
                placeholder="e.g. sarah@aether.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail size={16} className="auth-input-icon" />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Account Password</label>
            <div className="auth-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="auth-input-field" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <input type="checkbox" defaultChecked />
              <span>Remember this session</span>
            </label>
          </div>

          <button type="submit" className="auth-btn-primary">
            Secure Portal Login &rarr;
          </button>
        </form>
      </div>
    </div>
  );
}
