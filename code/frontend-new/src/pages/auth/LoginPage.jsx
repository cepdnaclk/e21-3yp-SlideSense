import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { login } from '../../services/api/authService';

export default function LoginPage({ onLogin }) {
  // Login State
  const [email, setEmail] = useState('resident@test.com');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = await login(email, password);
      const role = data?.user?.role?.toLowerCase() || 'resident';
      onLogin(role);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="login-page login-page--centered">
      <div className="login-page__logo-container">
        <img src="/logo.png" alt="Slide Sense Logo" className="login-page__logo" />
      </div>
      <div className="login-page__hero login-page__hero--centered">
        <span className="section-label">Landslide monitoring platform</span>
        <h1>Sign In</h1>

      </div>

      <div className="login-page__content-centered">
        <Card className="login-role-card" style={{ width: '100%', maxWidth: '400px' }}>
          <h2>Welcome Back</h2>
          {loginError && <div style={{ color: 'var(--high-risk)', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>{loginError}</div>}
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <Button type="submit" disabled={loginLoading} style={{ marginTop: '1rem' }}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="auth-switch-link" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}