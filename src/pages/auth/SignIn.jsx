import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, AlertCircle, ArrowRight, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/common/Footer';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);


  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email, username, or login ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login({ identifier, password, rememberMe });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Invalid credentials. Please verify your details.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitting = isLoading || previewLoading;
  const displayError = previewError
    ? 'State Preview: Invalid security credentials or session expired.'
    : error;

  return (
    <div className="auth-page-container">
      {/* Pill Badge */}
      <div className="pill-badge">
        <span className="pill-dot"></span>
        <span>AUTH PROTOCOL • VOLUME 04</span>
      </div>

      {/* Main Title & Subtitle */}
      <div className="auth-header-block">
        <h1 className="auth-big-logo">
          Route<span className="logo-dot"></span>
        </h1>
        <p className="auth-subtitle">
          Welcome back to Route. Continue reading, composing, and connecting with creative editions and curated cultural discourse.
        </p>
      </div>

      {/* Sign In Form Card — Main Focus */}
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {displayError && (
          <div className="alert-banner error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{displayError}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => {
                setError(null);
                setPreviewError(false);
              }}
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Identifier Input */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="identifier-input" className="form-label">
                Email, Username, or Login ID
              </label>
              <span className="form-label-meta">REQUIRED</span>
            </div>
            <div className="input-container">
              <input
                id="identifier-input"
                type="text"
                className="form-input"
                placeholder="e.g. helena@route.press or @helenavance"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
                required
              />
              <span className="input-icon-right" aria-hidden="true">
                <User size={18} />
              </span>
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div className="form-label-row">
              <label htmlFor="password-input" className="form-label">
                Password
              </label>
              <span className="form-label-meta">SECURITY</span>
            </div>
            <div className="input-container">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your security token"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="form-group remember-me-group">
            <label className="remember-me-label" htmlFor="remember-me-checkbox">
              <input
                id="remember-me-checkbox"
                type="checkbox"
                className="remember-me-checkbox-hidden"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className={`remember-me-box ${rememberMe ? 'checked' : ''}`} aria-hidden="true">
                {rememberMe && <Check size={13} strokeWidth={3} />}
              </span>
              <span className="remember-me-text">
                Remember me on this device
              </span>
            </label>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            className="btn-submit-orange"
            disabled={isSubmitting}
            id="signin-submit-btn"
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>Authenticating Protocol...</span>
              </>
            ) : (
              <>
                <span>Sign In to Route</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

       

        {/* Bottom Switch Link */}
        <div style={{ marginTop: '1.75rem' }} className="auth-switch-text">
          Don't have an account?
          <Link to="/signup" className="auth-switch-link">
            Sign Up
          </Link>
        </div>
      </div>

      <Footer showTag={true} />
    </div>
  );
}
