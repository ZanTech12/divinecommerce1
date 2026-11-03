import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Icon } from '@iconify/react';
import api from '../api/axios';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── OTP States ──
  const [step, setStep] = useState('login');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);

  // ── Dynamic site settings (same API as Home) ──
  const [siteName, setSiteName] = useState('Divine SolarHub');
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

  useEffect(() => {
    if (step === 'otp' && resendTimer > 0) {
      const timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  const handleInputChange = (setter) => (e) => {
    if (error) setError('');
    setter(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      if (data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setStep('otp'); 
        setResendTimer(0); 
        setError(''); 
      } else {
        setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) return setError('Please enter the 6-digit code.');

    setIsVerifying(true);
    try {
      await api.post('/auth/verify-otp', { email, otp: otpString });
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otp.map((d, idx) => (idx === index ? element.value : d))];
    setOtp(newOtp);
    if (element.value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
  };

  const BrandLogo = ({ size = 28 }) => (
    siteLogo ? (
      <img src={siteLogo} alt={siteName} className="auth-brand-icon-img" style={{ width: size + 6, height: size + 6, objectFit: 'contain' }} />
    ) : (
      <div className="auth-brand-icon"><Icon icon="lucide:shopping-bag" width={size} /></div>
    )
  );

  if (!settingsLoaded) return null;

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-content">
          <Link to="/" className="auth-brand-logo"><BrandLogo size={28} /><span className="auth-brand-name">{siteName}</span></Link>
          <h1 className="auth-brand-title">Welcome Back!</h1>
          <p className="auth-brand-subtitle">Login to access your account, track orders, and enjoy exclusive deals.</p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature"><Icon icon="lucide:truck" width={20} /><span>Free delivery on orders over ₦15k</span></div>
            <div className="auth-brand-feature"><Icon icon="lucide:shield-check" width={20} /><span>100% Authentic products</span></div>
            <div className="auth-brand-feature"><Icon icon="lucide:rotate-ccw" width={20} /><span>30-day return policy</span></div>
          </div>
        </div>
      </div>

      <div className="auth-form-wrapper">
        <Link to="/" className="auth-mobile-logo"><BrandLogo size={24} /><span className="auth-brand-name">{siteName}</span></Link>

        <div className="auth-form-container">
          
          {step === 'otp' ? (
            <>
              <div className="auth-form-header auth-form-header--center">
                <div className="auth-otp-icon-wrap">
                  <Icon icon="lucide:shield-alert" width={28} color="#d97706" />
                </div>
                <h2>Verify Your Email</h2>
                <p className="auth-otp-subtitle">
                  You must verify <strong>{email}</strong> before logging in.
                </p>
              </div>

              {error && (
                <div className="auth-alert">
                  <Icon icon="lucide:alert-circle" width={18} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="auth-alert-close"><Icon icon="lucide:x" width={16} /></button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="auth-form" style={{ marginTop: '30px' }}>
                <div className="auth-otp-inputs">
                  {otp.map((data, index) => (
                    <input key={index} type="text" maxLength="1" value={data} ref={(el) => (inputRefs.current[index] = el)}
                      onChange={(e) => handleOtpChange(e.target, index)} onKeyDown={(e) => handleOtpKeyDown(e, index)} onFocus={(e) => e.target.select()}
                      className="auth-input auth-otp-input"
                    />
                  ))}
                </div>

                <button type="submit" disabled={isVerifying} className={`auth-submit-btn ${isVerifying ? 'auth-submit-btn--loading' : ''}`}>
                  {isVerifying ? (<><Icon icon="lucide:loader-2" width={20} className="auth-spinner" /> Verifying...</>) : 'VERIFY & LOGIN'}
                </button>
              </form>

              <div className="auth-resend-section">
                <p className="auth-resend-text">Code expired or didn't arrive?</p>
                <button onClick={handleResendOtp} disabled={resendTimer > 0} className="auth-resend-btn">
                  {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Send New Code'}
                </button>
              </div>

              <button onClick={() => { setStep('login'); setOtp(['', '', '', '', '', '']); setError(''); }} className="auth-back-btn">
                <Icon icon="lucide:arrow-left" width={16} /> Back to Login
              </button>
            </>
          ) : (
            <>
              <div className="auth-form-header">
                <h2>Sign In</h2>
                <p>Enter your credentials to access your account</p>
              </div>

              {error && (
                <div className="auth-alert">
                  <Icon icon="lucide:alert-circle" width={18} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="auth-alert-close"><Icon icon="lucide:x" width={16} /></button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Icon icon="lucide:mail" width={18} className="auth-input-icon" />
                    <input id="email" type="email" required value={email} onChange={handleInputChange(setEmail)} placeholder="e.g. user@Divine SolarHub.com" autoComplete="email" className="auth-input" />
                  </div>
                </div>

                <div className="auth-input-group">
                  <div className="auth-input-label-row">
                    <label htmlFor="password">Password</label>
                    <a href="#" className="auth-forgot-link">Forgot Password?</a>
                  </div>
                  <div className="auth-input-wrapper">
                    <Icon icon="lucide:lock" width={18} className="auth-input-icon" />
                    <input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={handleInputChange(setPassword)} placeholder="Enter your password" autoComplete="current-password" className="auth-input" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-input-toggle" aria-label={showPassword ? "Hide password" : "Show password"}>
                      <Icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width={18} />
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className={`auth-submit-btn ${isLoading ? 'auth-submit-btn--loading' : ''}`}>
                  {isLoading ? (<><Icon icon="lucide:loader-2" width={20} className="auth-spinner" /> Signing In...</>) : 'LOG IN'}
                </button>
              </form>

              <div className="auth-divider"><span>OR</span></div>

              <div className="auth-socials">
                <button type="button" className="auth-social-btn"><Icon icon="logos:google-icon" width={18} /> Continue with Google</button>
              </div>

              <p className="auth-switch-text">
                New to {siteName}? <Link to="/register" className="auth-switch-link">Create Account</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
