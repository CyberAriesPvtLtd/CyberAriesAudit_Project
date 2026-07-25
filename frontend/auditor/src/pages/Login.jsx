import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, ShieldAlert } from 'lucide-react';
import logo from '../assets/cyberaries-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password recovery is managed by your CyberAries administrator. Please contact your administrator to reset your password.');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-redesign">
        {/* Logo centered inside card */}
        <div className="auth-logo-container">
          <img src={logo} alt="CyberAries Logo" className="auth-logo-img" />
        </div>

        <div className="auth-card-header">
          <h2 className="auth-card-title">Auditor Portal</h2>
          <p className="auth-card-subtitle">Access assignments, examine evidence, and compile draft reports.</p>
        </div>

        {errorMsg && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', fontSize: '13px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '8px' }}>
            <ShieldAlert size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="auth-input-group">
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>Email Address</label>
            <div className="auth-input-wrapper">
              <input
                type="email"
                className="auth-input-field"
                placeholder="rahul.sharma@cyberaries.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Mail size={16} className="auth-input-icon" />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', marginBottom: 0 }}>Password</label>
              <a 
                href="#forgot-password" 
                onClick={handleForgotPassword} 
                className="forgot-password-link"
                style={{ fontSize: '13px', textDecoration: 'none', color: '#E53935', fontWeight: '600' }}
              >
                Forgot Password?
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Lock size={16} className="auth-input-icon" />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <span>Remember Me</span>
            </label>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '12px', color: '#64748B', textAlign: 'center' }}>
          <span style={{ fontWeight: '600' }}>Testing Account:</span> <code style={{ fontSize: '11px', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>rahul.sharma@cyberaries.com</code> / <code style={{ fontSize: '11px', background: '#F1F5F9', padding: '2px 4px', borderRadius: '4px' }}>Auditor@123</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
