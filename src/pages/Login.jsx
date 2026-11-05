
import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Icon } from '@iconify/react';
import api from '../api/axios';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  // Registration redirect
  const initialEmail = location.state?.verifyEmail || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP states
  const [step, setStep] = useState(
    initialEmail ? 'otp' : 'login'
  );

  const [otp, setOtp] = useState([
    '', '', '', '', '', ''
  ]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(
    initialEmail ? 60 : 0
  );

  const inputRefs = useRef([]);

  // Remember whether the customer arrived from registration.
  const isRegistrationVerification = Boolean(initialEmail);

  // Site settings
  const [siteName, setSiteName] = useState('Divine Solar Hub');
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
        console.error('Login settings error:', err);
        if (!cancelled) setSettingsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // OTP COUNTDOWN
  // ==========================================

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;

    const timer = setTimeout(() => {
      setResendTimer((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, resendTimer]);

  // ==========================================
  // INPUT HANDLER
  // ==========================================

  const handleInputChange = (setter) => (event) => {
    setError('');
    setSuccess('');
    setter(event.target.value);
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      login(data);

      if (data.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err) {
      console.error('Login error:', err.response?.data || err);

      const responseData = err.response?.data;

      if (
        err.response?.status === 403 &&
        (
          responseData?.requiresVerification ||
          responseData?.success === false
        )
      ) {
        // Unverified customer: display OTP screen.
        setStep('otp');
        setOtp(['', '', '', '', '', '']);
        setResendTimer(0);
        setError('');
        setSuccess(
          responseData?.message ||
          'Your account requires verification. Enter the OTP sent to your registered contact channels.'
        );
      } else {
        setError(
          responseData?.message ||
          'Invalid email or password. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // VERIFY OTP
  // ==========================================

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const otpString = otp.join('');

    if (otpString.length !== 6) {
      return setError('Please enter the 6-digit code.');
    }

    setIsVerifying(true);

    try {
      const { data: verificationData } = await api.post(
        '/auth/verify-otp',
        {
          email: email.trim().toLowerCase(),
          otp: otpString,
        }
      );

      if (verificationData.success === false) {
        throw new Error(
          verificationData.message || 'OTP verification failed.'
        );
      }

      // ========================================
      // CUSTOMER CAME FROM REGISTRATION
      // ========================================

      if (isRegistrationVerification) {
        setStep('login');
        setOtp(['', '', '', '', '', '']);
        setPassword('');
        setResendTimer(0);

        setSuccess(
          'Your account has been verified successfully! Please log in to continue.'
        );

        navigate('/login', {
          replace: true,
          state: {},
        });

        return;
      }

      // ========================================
      // CUSTOMER CAME FROM LOGIN
      // ========================================

      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      login(data);

      if (data.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err) {
      console.error(
        'OTP verification error:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // ==========================================
  // RESEND OTP
  // ==========================================

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
      });

      if (data.success === false) {
        throw new Error(data.message || 'Failed to resend OTP.');
      }

      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);

      inputRefs.current[0]?.focus();

      setSuccess(
        'A new verification code has been sent through the available channels (email and WhatsApp).'
      );

    } catch (err) {
      console.error('Resend OTP error:', err.response?.data || err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to resend OTP. Please try again.'
      );
    }
  };

  // ==========================================
  // OTP INPUT HANDLERS
  // ==========================================

  const handleOtpChange = (element, index) => {
    const value = element.value;

    if (!/^\d?$/.test(value)) return;

    setError('');
    setSuccess('');

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (event, index) => {
    if (
      event.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
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
            Welcome Back!
          </h1>

          <p className="auth-brand-subtitle">
            Login to access your account, track orders,
            and enjoy exclusive deals.
          </p>

          <div className="auth-brand-features">

            <div className="auth-brand-feature">
              <Icon icon="lucide:truck" width={20} />
              <span>Free delivery on orders over ₦15k</span>
            </div>

            <div className="auth-brand-feature">
              <Icon icon="lucide:shield-check" width={20} />
              <span>100% Authentic products</span>
            </div>

            <div className="auth-brand-feature">
              <Icon icon="lucide:rotate-ccw" width={20} />
              <span>30-day return policy</span>
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

          {/* ==================================
              OTP VERIFICATION SCREEN
          ================================== */}

          {step === 'otp' ? (

            <>

              <div className="auth-form-header auth-form-header--center">

                <div className="auth-otp-icon-wrap">
                  <Icon
                    icon="lucide:shield-check"
                    width={28}
                    color="#087b45"
                  />
                </div>

                <h2>Verify Your Account</h2>

                <p className="auth-otp-subtitle">
                  We sent a six-digit verification code to your
                  registered email address and WhatsApp number
                  where available.
                  Enter the code below to verify your account.
                </p>

                <p className="auth-otp-subtitle">
                  <strong>{email}</strong>
                </p>

                <p className="auth-otp-subtitle">
                  Your verification code expires in 10 minutes.
                </p>

              </div>

              {/* ERROR */}

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

              {/* SUCCESS */}

              {success && (
                <div className="auth-success">
                  <Icon icon="lucide:check-circle" width={18} />
                  <span>{success}</span>
                </div>
              )}

              {/* OTP FORM */}

              <form
                onSubmit={handleVerifyOtp}
                className="auth-form"
                style={{ marginTop: '30px' }}
              >

                <div className="auth-otp-inputs">

                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      value={digit}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      onChange={(event) =>
                        handleOtpChange(event.target, index)
                      }
                      onKeyDown={(event) =>
                        handleOtpKeyDown(event, index)
                      }
                      onFocus={(event) =>
                        event.target.select()
                      }
                      className="auth-input auth-otp-input"
                      aria-label={`Verification digit ${index + 1}`}
                    />
                  ))}

                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className={`auth-submit-btn ${
                    isVerifying ? 'auth-submit-btn--loading' : ''
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Icon
                        icon="lucide:loader-2"
                        width={20}
                        className="auth-spinner"
                      />
                      Verifying...
                    </>
                  ) : (
                    'VERIFY ACCOUNT'
                  )}
                </button>

              </form>

              {/* RESEND OTP */}

              <div className="auth-resend-section">

                <p className="auth-resend-text">
                  Code expired or didn't arrive?
                </p>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="auth-resend-btn"
                >
                  {resendTimer > 0
                    ? `Resend Code in ${resendTimer}s`
                    : 'Send New Code'}
                </button>

              </div>

              {/* BACK TO LOGIN */}

              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                  setSuccess('');
                  setResendTimer(0);

                  navigate('/login', {
                    replace: true,
                    state: {},
                  });
                }}
                className="auth-back-btn"
              >
                <Icon icon="lucide:arrow-left" width={16} />
                Back to Login
              </button>

            </>

          ) : (

            /* ==================================
               LOGIN SCREEN
            ================================== */

            <>

              <div className="auth-form-header">
                <h2>Sign In</h2>
                <p>Enter your credentials to access your account</p>
              </div>

              {/* ERROR */}

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

              {/* SUCCESS */}

              {success && (
                <div className="auth-success">
                  <Icon icon="lucide:check-circle" width={18} />
                  <span>{success}</span>
                </div>
              )}

              {/* LOGIN FORM */}

              <form onSubmit={handleSubmit} className="auth-form">

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

                {/* PASSWORD */}

                <div className="auth-input-group">

                  <div className="auth-input-label-row">
                    <label htmlFor="password">Password</label>

                    <Link
                      to="/forgot-password"
                      className="auth-forgot-link"
                    >
                      Forgot Password?
                    </Link>
                  </div>

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
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="auth-input"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
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
                      Signing In...
                    </>
                  ) : (
                    'LOG IN'
                  )}
                </button>

              </form>

              <div className="auth-divider">
                <span>OR</span>
              </div>

              {/* SOCIAL LOGIN */}

              <div className="auth-socials">
                <button
                  type="button"
                  className="auth-social-btn"
                >
                  <Icon icon="logos:google-icon" width={18} />
                  Continue with Google
                </button>
              </div>

              {/* REGISTER LINK */}

              <p className="auth-switch-text">
                New to {siteName}?{' '}
                <Link
                  to="/register"
                  className="auth-switch-link"
                >
                  Create Account
                </Link>
              </p>

            </>

          )}

        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

    </div>
  );
}
