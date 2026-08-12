import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/cyberaries-logo.png';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    // Dummy password reset logic
    setSubmitted(true);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '24px', backgroundColor: 'var(--bg-main)' }}>
      <div className="dashboard-section-card" style={{ width: '480px', padding: '32px', backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src={logo} alt="CyberAries Logo" style={{ height: '48px', width: 'auto', marginBottom: '12px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Reset Password</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Enter your email below to receive reset instructions</p>
        </div>

        {error && <div className="error-message" style={{ padding: '8px 12px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ backgroundColor: '#E6F4EA', color: '#137333', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '14px', marginBottom: '24px', fontWeight: '500', lineHeight: '1.5' }}>
              Reset link sent! Please check your email inbox at <strong>{email}</strong> for password recovery instructions.
            </div>
            <Link to="/login" className="btn btn-secondary btn-block" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Official Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. admin@cyberaries.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px', padding: '10px 20px' }}>
              <Mail size={16} /> Send Reset Link
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', fontWeight: '500' }}>
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
