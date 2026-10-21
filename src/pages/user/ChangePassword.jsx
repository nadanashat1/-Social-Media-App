import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PASSWORD_RULE, PASSWORD_RULE_HINT, PASSWORD_RULE_ERROR, friendlyPasswordError } from '../../utils/password';
import Footer from '../../components/common/Footer';

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      setError('Please enter your current password.');
      return;
    }
    if (!newPassword || !PASSWORD_RULE.test(newPassword)) {
      setError(PASSWORD_RULE_ERROR);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (password === newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
     
      await changePassword({
        password,
        newPassword,
      });

      setSuccess(true);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Failed to change password. Please verify current password.';
      setError(friendlyPasswordError(msg, [password, newPassword, confirmPassword]));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Pill Badge */}
      <div className="pill-badge">
        <span className="pill-dot"></span>
        <span>SECURITY PROTOCOL • ACCESS ROTATION</span>
      </div>

      <div className="auth-card" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--primary-orange-subtle)',
              color: 'var(--primary-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Change Password
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Rotate your security credentials. Your active session will be updated with a new encrypted token.
          </p>
        </div>

        {error && (
          <div className="alert-banner error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner success" role="alert">
            <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Password rotated successfully. Token refreshed! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="current-password" className="form-label">
                Current Password
              </label>
            </div>
            <div className="input-container">
              <input
                id="current-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter existing password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="new-password" className="form-label">
                New Password
              </label>
              <span className="form-label-meta">MIN 8 CHARACTERS</span>
            </div>
            <div className="input-container">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="form-helper-text">
              <Info size={13} />
              <span>{PASSWORD_RULE_HINT}</span>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div className="form-label-row">
              <label htmlFor="confirm-password" className="form-label">
                Confirm New Password
              </label>
            </div>
            <div className="input-container">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-orange"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Rotating Security Token...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>

      <Footer showTag={true} />
    </div>
  );
}
