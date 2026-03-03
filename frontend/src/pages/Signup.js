import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function getStrengthRules(password) {
  return [
    { label: 'At least 8 characters',             pass: password.length >= 8 },
    { label: 'At least one uppercase letter',      pass: /[A-Z]/.test(password) },
    { label: 'At least one lowercase letter',      pass: /[a-z]/.test(password) },
    { label: 'At least one number',                pass: /[0-9]/.test(password) },
    { label: 'At least one special character',     pass: /[^A-Za-z0-9]/.test(password) },
  ];
}

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const rules        = getStrengthRules(password);
  const allRulesMet  = rules.every(r => r.pass);
  const passwordsMatch = password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allRulesMet) { setError('Please meet all password requirements.'); return; }
    if (!passwordsMatch) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res  = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Sign up failed.');
      } else {
        login(data.token, data.username);
        navigate('/dashboard');
      }
    } catch {
      setError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">Play<span>lytic</span></div>
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-sub">Start analysing your games today</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="yourname"
              value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder=""
              value={password} onChange={e => setPassword(e.target.value)} required />
            {password.length > 0 && (
              <ul className="strength-list">
                {rules.map(r => (
                  <li key={r.label} className={r.pass ? 'rule-pass' : 'rule-fail'}>
                    {r.pass ? '' : ''} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="auth-field">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" type="password" placeholder=""
              value={confirm} onChange={e => setConfirm(e.target.value)} required />
            {confirm.length > 0 && (
              <span className={passwordsMatch ? 'rule-pass match-msg' : 'rule-fail match-msg'}>
                {passwordsMatch ? ' Passwords match' : ' Passwords do not match'}
              </span>
            )}
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;