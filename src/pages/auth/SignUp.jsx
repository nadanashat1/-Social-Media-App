import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AtSign, Mail, User, Eye, EyeOff, Calendar, AlertCircle, ArrowRight, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/common/Footer';

export default function SignUp() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    dateOfBirth: '2000-01-01',
    gender: 'female',
    password: '',
    rePassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { username, name, email, dateOfBirth, gender, password, rePassword } = formData;

    if (!username.trim()) {
      return 'Please choose a username.';
    }
    const cleanUsername = username.replace(/^@/, '').trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 24) {
      return 'Username must be between 3 and 24 characters.';
    }
    if (!/^[a-z0-9_]+$/i.test(cleanUsername)) {
      return 'Username can only contain letters, numbers, and underscores.';
    }

    if (!name.trim()) {
      return 'Please enter your full name.';
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!dateOfBirth) {
      return 'Please specify your date of birth.';
    }

    if (!gender) {
      return 'Please select your gender.';
    }

    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (password !== rePassword) {
      return 'Passwords do not match. Please verify both fields.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const cleanUsername = formData.username.replace(/^@/, '').trim();
      const payload = {
        name: formData.name.trim(),
        username: cleanUsername,
        email: formData.email.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        password: formData.password,
        rePassword: formData.rePassword,
      };

      const res = await signup(payload);

      if (res?.data?.token || res?.token) {
        navigate('/', { replace: true });
      } else {
        setSuccessMsg('Account created successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/signin');
        }, 1200);
      }
    } catch (err) {
      const msg = err.friendlyMessage || err.message || 'Unable to complete induction. Please check your data.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Pill Badge */}
      <div className="pill-badge">
        <span className="pill-dot"></span>
        <span>MEMBER INDUCTION • VOL. IV</span>
      </div>

      {/* Main Card */}
      <div className="auth-card">
        {/* Title Inside Card */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 className="auth-big-logo" style={{ fontSize: '2.8rem' }}>
            Route<span className="logo-dot"></span>
          </h1>
          <p className="auth-subtitle" style={{ maxWidth: '420px', fontSize: '0.94rem' }}>
            Join Route. An expressive digital space for essays, spatial photography, and cultural dialogue.
          </p>
        </div>

        {error && (
          <div className="alert-banner error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner success" role="alert">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="signup-username" className="form-label">
                Username
              </label>
              <span className="form-label-meta accent">@username</span>
            </div>
            <div className="input-container">
              <span className="input-icon-left" aria-hidden="true">
                <AtSign size={17} />
              </span>
              <input
                id="signup-username"
                type="text"
                className="form-input has-left-icon"
                placeholder="cultural_theorist"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                autoComplete="username"
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-helper-text">
              <Info size={13} />
              <span>Only lowercase letters, numbers, and underscores (3–24 characters).</span>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="signup-name" className="form-label">
                Full Name
              </label>
              <span className="form-label-meta">REQUIRED</span>
            </div>
            <div className="input-container">
              <span className="input-icon-left" aria-hidden="true">
                <User size={17} />
              </span>
              <input
                id="signup-name"
                type="text"
                className="form-input has-left-icon"
                placeholder="Helena Vance"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                autoComplete="name"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="signup-email" className="form-label">
                Email Address
              </label>
            </div>
            <div className="input-container">
              <span className="input-icon-left" aria-hidden="true">
                <Mail size={17} />
              </span>
              <input
                id="signup-email"
                type="email"
                className="form-input has-left-icon"
                placeholder="critic@studio.org"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Date of Birth & Gender Grid */}
          <div className="form-grid-2 form-group">
            <div>
              <div className="form-label-row">
                <label htmlFor="signup-dob" className="form-label">
                  Date of Birth
                </label>
              </div>
              <div className="input-container">
                <span className="input-icon-left" aria-hidden="true">
                  <Calendar size={17} />
                </span>
                <input
                  id="signup-dob"
                  type="date"
                  className="form-input has-left-icon"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <div className="form-label-row">
                <span className="form-label">Gender</span>
              </div>
              <div className="gender-selector">
                <button
                  type="button"
                  className={`gender-option ${formData.gender === 'female' ? 'selected' : ''}`}
                  onClick={() => handleChange('gender', 'female')}
                  disabled={isLoading}
                >
                  Female
                </button>
                <button
                  type="button"
                  className={`gender-option ${formData.gender === 'male' ? 'selected' : ''}`}
                  onClick={() => handleChange('gender', 'male')}
                  disabled={isLoading}
                >
                  Male
                </button>
              </div>
            </div>
          </div>

          {/* Password & Confirm Password (Side by side) */}
          <div className="form-grid-2 form-group">
            <div>
              <div className="form-label-row">
                <label htmlFor="signup-password" className="form-label">
                  Password
                </label>
              </div>
              <div className="input-container">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <div className="form-label-row">
                <label htmlFor="signup-repassword" className="form-label">
                  Confirm Password
                </label>
              </div>
              <div className="input-container">
                <input
                  id="signup-repassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Repeat phrase"
                  value={formData.rePassword}
                  onChange={(e) => handleChange('rePassword', e.target.value)}
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
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          </div>

          {/* Manifesto Note */}
          <p className="editorial-note">
            By creating a folio profile on Route, you endorse our open-format{' '}
            <a href="#manifesto">Editorial Manifesto</a> and standard data protocol.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-submit-orange"
            disabled={isLoading}
            id="signup-submit-btn"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Inducting Folio...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Directory Divider */}
        <div className="directory-divider">
          <span>DIRECTORY</span>
        </div>

        {/* Switch to Sign In */}
        <div className="auth-switch-text">
          Already have an account?
          <Link to="/signin" className="auth-switch-link">
            Sign In
          </Link>
        </div>
      </div>

      <Footer showTag={true} />
    </div>
  );
}
