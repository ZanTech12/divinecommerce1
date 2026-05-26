import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Icon } from '@iconify/react';
import api from '../api/axios';
import './Register.css';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── Dynamic site settings (same API as Home) ──
  const [siteName, setSiteName] = useState('AFOO TECHNOLOGY');
  const [siteLogo, setSiteLogo] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
      .catch(() => setSettingsLoaded(true));
    return () => { cancelled = true; };
  }, []);

  const handleGoToLogin = () => {
    navigate('/login', {
      state: { otpSent: true, email: registeredEmail },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (!agreeTerms) {
      return setError("You must agree to the Terms & Conditions.");
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', { name, email, phone, password });
      setRegisteredEmail(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    if (error) setError('');
    setter(e.target.value);
  };

  const BrandLogo = ({ size = 28 }) => (
    siteLogo ? (
      <img
        src={siteLogo}
        alt={siteName}
        className="auth-brand-icon-img"
        style={{ width: size + 6, height: size + 6, objectFit: 'contain' }}
      />
    ) : (
      <div className="auth-brand-icon">
        <Icon icon="lucide:shopping-bag" width={size} />
      </div>
    )
  );

  if (!settingsLoaded) return null;

  return (
    <div className="auth-page">
      {/* ═══ LEFT BRANDING PANEL ═══ */}
      <div className="auth-brand">
        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo">
            <BrandLogo size={28} />
            <span className="auth-brand-name">{siteName}</span>
          </Link>
          <h1 className="auth-brand-title">Join {siteName} today!</h1>
          <p className="auth-brand-subtitle">
            Create an account to unlock exclusive deals, track orders, and enjoy a seamless shopping experience.
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

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="auth-form-wrapper">
        <Link to="/" className="auth-mobile-logo">
          <BrandLogo size={24} />
          <span className="auth-brand-name">{siteName}</span>
        </Link>

        {/* ──── SUCCESS STATE ──── */}
        {success ? (
          <div className="auth-form-container auth-success-container">
            <div className="auth-success-icon-wrap">
              <div className="auth-success-icon-circle">
                <Icon icon="lucide:mail-check" width={40} />
              </div>
              <div className="auth-success-pulse" />
            </div>

            <h2 className="auth-success-title">OTP Sent to Your Email</h2>

            <p className="auth-success-message">
              We've sent a one-time password to
            </p>
            <span className="auth-success-email">{registeredEmail}</span>

            <p className="auth-success-hint">
              Please check your inbox (and spam folder) for the OTP, then log in to verify your account.
            </p>

            <button
              onClick={handleGoToLogin}
              className="auth-submit-btn auth-submit-btn--success"
            >
              <Icon icon="lucide:log-in" width={20} />
              GO TO LOGIN
            </button>

            <p className="auth-success-resend">
              Didn't receive it?{' '}
              <button
                type="button"
                className="auth-link"
                onClick={async () => {
                  try {
                    await api.post('/auth/resend-otp', { email: registeredEmail });
                    setError('');
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to resend OTP.');
                  }
                }}
              >
                Resend OTP
              </button>
            </p>
          </div>
        ) : (
          /* ──── REGISTRATION FORM ──── */
          <div className="auth-form-container">
            <div className="auth-form-header">
              <h2>Create Account</h2>
              <p>Fill in your details to get started</p>
            </div>

            {error && (
              <div className="auth-alert">
                <Icon icon="lucide:alert-circle" width={18} />
                <span>{error}</span>
                <button onClick={() => setError('')} className="auth-alert-close">
                  <Icon icon="lucide:x" width={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <label htmlFor="name">Full Name</label>
                <div className="auth-input-wrapper">
                  <Icon icon="lucide:user" width={18} className="auth-input-icon" />
                  <input id="name" type="text" required value={name} onChange={handleInputChange(setName)} placeholder="e.g. Deji Johnson" autoComplete="name" className="auth-input" />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="email">Email Address</label>
                <div className="auth-input-wrapper">
                  <Icon icon="lucide:mail" width={18} className="auth-input-icon" />
                  <input id="email" type="email" required value={email} onChange={handleInputChange(setEmail)} placeholder="e.g. user@afoocommunication.com" autoComplete="email" className="auth-input" />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="auth-input-wrapper">
                  <Icon icon="lucide:phone" width={18} className="auth-input-icon" />
                  <input id="phone" type="tel" required value={phone} onChange={handleInputChange(setPhone)} placeholder="e.g. +2348123456789" autoComplete="tel" className="auth-input" />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="password">Password</label>
                <div className="auth-input-wrapper">
                  <Icon icon="lucide:lock" width={18} className="auth-input-icon" />
                  <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={handleInputChange(setPassword)} placeholder="Min. 6 characters" autoComplete="new-password" className="auth-input" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-input-toggle" aria-label={showPassword ? "Hide password" : "Show password"}>
                    <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width={18} />
                  </button>
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Icon icon="lucide:lock" width={18} className="auth-input-icon" />
                  <input id="confirm-password" type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={handleInputChange(setConfirmPassword)} placeholder="Re-enter your password" autoComplete="new-password" className="auth-input" />
                </div>
              </div>

              <div className="auth-checkbox-group">
                <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="auth-checkbox" />
                <label htmlFor="terms" className="auth-checkbox-label">
                  I agree to the <a href="#" className="auth-link">Terms & Conditions</a> and <a href="#" className="auth-link">Privacy Policy</a>
                </label>
              </div>

              <button type="submit" disabled={isLoading} className={`auth-submit-btn ${isLoading ? 'auth-submit-btn--loading' : ''}`}>
                {isLoading ? (
                  <><Icon icon="lucide:loader-2" width={20} className="auth-spinner" /> Creating Account...</>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </button>
            </form>

            <div className="auth-divider"><span>OR</span></div>

            <div className="auth-socials">
              <button type="button" className="auth-social-btn"><Icon icon="logos:google-icon" width={18} /> Sign up with Google</button>
            </div>

            <p className="auth-switch-text">
              Already have an account? <Link to="/login" className="auth-switch-link">Login</Link>
            </p>

            {/* ✅ NEW: Engineer registration link */}
            <div className="auth-engineer-link">
              <Icon icon="lucide:wrench" width={14} />
              <span>Are you an engineer?</span>
              <Link to="/register-engineer" className="auth-engineer-link__anchor">
                Register with invite code
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}