
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import api from '../api/axios';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic site settings
  const [siteName, setSiteName] = useState('Divine Vine-Edo');
  const [siteLogo, setSiteLogo] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ==========================================
  // FETCH SITE SETTINGS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    api.get('/site-settings')
      .then(({ data }) => {
        if (!cancelled) {
          if (data.companyName) setSiteName(data.companyName);
          if (data.logo) setSiteLogo(data.logo);
          setSettingsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Site settings error:', err);
        if (!cancelled) setSettingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // INPUT HANDLER
  // ==========================================

  const handleInputChange = (setter) => (e) => {
    if (error) setError('');
    setter(e.target.value);
  };

  // ==========================================
  // REGISTRATION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    if (!agreeTerms) {
      return setError('You must agree to the Terms & Conditions.');
    }

    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
      });

      if (!data.success) {
        throw new Error(
          data.message || 'Registration could not be completed.'
        );
      }

      // Immediately open the OTP screen.
      // Do not log the user in before email verification.
      navigate('/login', {
        replace: true,
        state: {
          verifyEmail: normalizedEmail,
        },
      });

    } catch (err) {
      console.error(
        'Registration error:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // BRAND LOGO
  // ==========================================

  const BrandLogo = ({ size = 28 }) => (
    siteLogo ? (
      <img
        src={siteLogo}
        alt={siteName}
        className="auth-brand-icon-img"
        style={{
          width: size + 6,
          height: size + 6,
          objectFit: 'contain',
        }}
      />
    ) : (
      <div className="auth-brand-icon">
        <Icon icon="lucide:shopping-bag" width={size} />
      </div>
    )
  );

  if (!settingsLoaded) return null;

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="auth-page">

      {/* LEFT BRANDING PANEL */}

      <div className="auth-brand">
        <div className="auth-brand-content">

          <Link to="/" className="auth-brand-logo">
            <BrandLogo size={28} />
            <span className="auth-brand-name">{siteName}</span>
          </Link>

          <h1 className="auth-brand-title">
            Join {siteName} today!
          </h1>

          <p className="auth-brand-subtitle">
            Create an account to unlock exclusive deals,
            track orders, and enjoy a seamless shopping experience.
          </p>

          <div className="auth-brand-features">

            <div className="auth-brand-feature">
              <Icon icon="lucide:gift" width={20} />
              <span>Exclusive welcome bonuses</span>
            </div>

            <div className="auth-brand-feature">
              <Icon icon="lucide:bell" width={20} />
              <span>Real-time order notifications</span>
            </div>

            <div className="auth-brand-feature">
              <Icon icon="lucide:heart" width={20} />
              <span>Save items to your wishlist</span>
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}

      <div className="auth-form-wrapper">

        <Link to="/" className="auth-mobile-logo">
          <BrandLogo size={24} />
          <span className="auth-brand-name">{siteName}</span>
        </Link>

        <div className="auth-form-container">

          <div className="auth-form-header">
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {/* ERROR MESSAGE */}

          {error && (
            <div className="auth-alert">
              <Icon icon="lucide:alert-circle" width={18} />
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError('')}
                className="auth-alert-close"
              >
                <Icon icon="lucide:x" width={16} />
              </button>
            </div>
          )}

          {/* REGISTRATION FORM */}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* FULL NAME */}

            <div className="auth-input-group">
              <label htmlFor="name">Full Name</label>

              <div className="auth-input-wrapper">
                <Icon
                  icon="lucide:user"
                  width={18}
                  className="auth-input-icon"
                />

                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={handleInputChange(setName)}
                  placeholder="e.g. Deji Johnson"
                  autoComplete="name"
                  className="auth-input"
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="auth-input-group">
              <label htmlFor="email">Email Address</label>

              <div className="auth-input-wrapper">
                <Icon
                  icon="lucide:mail"
                  width={18}
                  className="auth-input-icon"
                />

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  placeholder="e.g. user@example.com"
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            {/* PHONE */}

            <div className="auth-input-group">
              <label htmlFor="phone">Phone Number</label>

              <div className="auth-input-wrapper">
                <Icon
                  icon="lucide:phone"
                  width={18}
                  className="auth-input-icon"
                />

                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handleInputChange(setPhone)}
                  placeholder="e.g. +2348123456789"
                  autoComplete="tel"
                  className="auth-input"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="auth-input-group">
              <label htmlFor="password">Password</label>

              <div className="auth-input-wrapper">
                <Icon
                  icon="lucide:lock"
                  width={18}
                  className="auth-input-icon"
                />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={handleInputChange(setPassword)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="auth-input"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-input-toggle"
                  aria-label={
                    showPassword ? 'Hide password' : 'Show password'
                  }
                >
                  <Icon
                    icon={
                      showPassword
                        ? 'lucide:eye-off'
                        : 'lucide:eye'
                    }
                    width={18}
                  />
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}

            <div className="auth-input-group">
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <div className="auth-input-wrapper">
                <Icon
                  icon="lucide:lock"
                  width={18}
                  className="auth-input-icon"
                />

                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={handleInputChange(setConfirmPassword)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="auth-input"
                />
              </div>
            </div>

            {/* TERMS */}

            <div className="auth-checkbox-group">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="auth-checkbox"
              />

              <label
                htmlFor="terms"
                className="auth-checkbox-label"
              >
                I agree to the{' '}
                <a href="#" className="auth-link">
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a href="#" className="auth-link">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={isLoading}
              className={`auth-submit-btn ${
                isLoading ? 'auth-submit-btn--loading' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <Icon
                    icon="lucide:loader-2"
                    width={20}
                    className="auth-spinner"
                  />
                  Creating Account...
                </>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>

          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {/* GOOGLE SIGNUP */}

          <div className="auth-socials">
            <button type="button" className="auth-social-btn">
              <Icon icon="logos:google-icon" width={18} />
              Sign up with Google
            </button>
          </div>

          {/* LOGIN LINK */}

          <p className="auth-switch-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">
              Login
            </Link>
          </p>

          {/* ENGINEER REGISTRATION */}

          <div className="auth-engineer-link">
            <Icon icon="lucide:wrench" width={14} />
            <span>Are you an engineer?</span>

            <Link
              to="/register-engineer"
              className="auth-engineer-link__anchor"
            >
              Register with invite code
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
