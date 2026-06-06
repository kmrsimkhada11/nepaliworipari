import { useState, FormEvent } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { login, signup, googleLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import { AUSTRALIAN_STATES } from '../types';
import { PostcodeLookup } from './PostcodeLookup';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
}

export function AuthModal({ show, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();

  if (!show) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setState('');
    setCity('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await login(email, password);
      } else {
        response = await signup(name, email, password, 'seeker', phone || undefined, state || undefined, city || undefined);
      }

      loginUser(response.user, response.token);
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>{isLogin ? 'Sign in to add your post' : 'Sign up to post what you are looking for'}</h2>

        {error && <div className="auth-error">{error}</div>}

        <div className="google-signin-wrapper">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                try {
                  const response = await googleLogin(credentialResponse.credential);
                  loginUser(response.user, response.token);
                  resetForm();
                  onClose();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Google login failed');
                }
              }
            }}
            onError={() => setError('Google login failed')}
            size="large"
            width="100%"
            text={isLogin ? 'signin_with' : 'signup_with'}
          />
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="auth-phone">Phone (optional)</label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0412345678"
                />
              </div>

              <PostcodeLookup onSuburbSelect={(suburb, st) => { setCity(suburb); setState(st); }} />

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="auth-state">State</label>
                  <select
                    id="auth-state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  >
                    <option value="">Select state</option>
                    {AUSTRALIAN_STATES.filter((s) => s.value !== 'ALL').map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="auth-city">City/Suburb</label>
                  <input
                    id="auth-city"
                    type="text"
                    value={city}
                    readOnly
                    placeholder="Auto-filled from postcode"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="auth-address">Address (optional)</label>
                <input
                  id="auth-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Main St"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              minLength={6}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                minLength={6}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already signed up? '}
          <button type="button" className="auth-switch-btn" onClick={switchMode}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
