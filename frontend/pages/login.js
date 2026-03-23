import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { authAPI } from '../services/api';
import BrandLockup from '../components/BrandLockup';
import HomeBackButton from '../components/HomeBackButton';

export default function Login() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'candidate',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isSignup) {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        res = await authAPI.signup(formData);
      } else {
        res = await authAPI.login({
          email: formData.email,
          password: formData.password,
        });
      }

      const { access_token, role, name, user_id } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('userName', name);
      localStorage.setItem('userId', user_id);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>{isSignup ? 'Sign Up' : 'Log In'} - AI Interview Room</title>
        <meta name="description" content="Log in to your Blue Planet InfoSolutions AI Interview Room account." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="login-page">
        <HomeBackButton />
        <div className="login-left">
          <BrandLockup className="login-brand" theme="dark" size="md" />
          <div className="login-art">
            <div className="art-circle c1"></div>
            <div className="art-circle c2"></div>
            <div className="art-circle c3"></div>
            <h2 className="art-title">Smart Hiring Starts Here</h2>
            <p className="art-desc">AI-powered interviews with real-time video, intelligent questions, and automated scoring.</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <h1 className="form-title">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="form-subtitle">
              {isSignup
                ? 'Start your journey with Blue Planet InfoSolutions'
                : 'Log in to your account to continue'}
            </p>

            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className={`form-group anim-fold ${isSignup ? 'expanded' : ''}`}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required={isSignup}
                  tabIndex={isSignup ? 0 : -1}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>

              <div className={`form-group anim-fold ${isSignup ? 'expanded' : ''}`}>
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={isSignup}
                  tabIndex={isSignup ? 0 : -1}
                  minLength={6}
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Log In'}
              </button>
            </form>

            <div className="form-footer">
              <span className="footer-text">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                className="toggle-btn"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                }}
              >
                {isSignup ? 'Log In' : 'Sign Up'}
              </button>
            </div>


          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        .login-left {
          background: linear-gradient(135deg, #0A2540 0%, #1a3a5c 50%, #0A2540 100%);
          padding: 96px 40px 40px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .login-brand {
          align-self: flex-start;
        }

        .login-art {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        .art-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(0, 163, 224, 0.15);
        }

        .c1 {
          width: 400px;
          height: 400px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-ring 4s ease-in-out infinite;
        }

        .c2 {
          width: 280px;
          height: 280px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-color: rgba(0, 163, 224, 0.25);
          animation: pulse-ring 4s ease-in-out infinite 1s;
        }

        .c3 {
          width: 160px;
          height: 160px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-color: rgba(0, 163, 224, 0.35);
          background: rgba(0, 163, 224, 0.05);
          animation: pulse-ring 4s ease-in-out infinite 2s;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.7; }
        }

        .art-title {
          color: #FFFFFF;
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 16px 0;
          position: relative;
        }

        .art-desc {
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          line-height: 1.6;
          max-width: 360px;
          position: relative;
        }

        .login-right {
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .login-form-container {
          width: 100%;
          max-width: 420px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 800;
          color: #0A2540;
          margin: 0 0 8px 0;
        }

        .form-subtitle {
          font-size: 15px;
          color: #6B7280;
          margin: 0 0 32px 0;
        }

        .error-msg {
          padding: 12px 16px;
          background: #FEE2E2;
          border: 1px solid #FECACA;
          border-radius: 8px;
          color: #DC2626;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          perspective: 1200px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }

        .anim-fold {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          margin-bottom: 0 !important;
          padding: 0 4px;
          margin-left: -4px;
          margin-right: -4px;
          transform-origin: top;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform: rotateX(-90deg) scaleY(0.8) translateY(-20px);
        }

        .anim-fold.expanded {
          max-height: 140px;
          opacity: 1;
          margin-bottom: 20px !important;
          padding-bottom: 8px; /* Room for focus shadow */
          transform: rotateX(0deg) scaleY(1) translateY(0);
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .form-input {
          padding: 12px 16px;
          border: 1px solid #D1D5DB;
          border-radius: 10px;
          font-size: 14px;
          color: #1F2937;
          background: #FFFFFF;
          outline: none;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .form-input:focus {
          border-color: #00A3E0;
          box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.1);
        }

        .form-input::placeholder {
          color: #9CA3AF;
        }

        .submit-btn {
          padding: 14px;
          background: #00A3E0;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          margin-top: 4px;
        }

        .submit-btn:hover {
          background: #0090c7;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .form-footer {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 24px;
        }

        .footer-text {
          font-size: 14px;
          color: #6B7280;
        }

        .toggle-btn {
          font-size: 14px;
          color: #00A3E0;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }

        .toggle-btn:hover {
          text-decoration: underline;
        }

        .demo-credentials {
          margin-top: 32px;
          padding: 16px;
          background: rgba(0, 163, 224, 0.05);
          border: 1px solid rgba(0, 163, 224, 0.15);
          border-radius: 10px;
        }

        .demo-title {
          font-size: 12px;
          font-weight: 700;
          color: #0A2540;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .demo-item {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          font-size: 13px;
          color: #6B7280;
        }

        .demo-item code {
          font-size: 12px;
          color: #00A3E0;
          background: rgba(0, 163, 224, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .login-page {
            grid-template-columns: 1fr;
          }
          .login-left {
            display: none;
          }
          .login-right {
            padding: 88px 24px 32px;
            align-items: flex-start;
          }
          .login-form-container {
            max-width: 100%;
          }
        }
      `}</style>
    </>
  );
}
