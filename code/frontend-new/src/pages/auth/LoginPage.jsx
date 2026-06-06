import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { login } from '../../services/api/authService';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('resident@test.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data?.user?.role?.toLowerCase() || 'resident';
      onLogin(role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <span className="section-label">Landslide monitoring platform</span>
        <h1>Sign In</h1>
        <p>
          Access your dashboard to view safety guidance, analyze data, or manage the system.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <Card className="login-role-card" style={{ width: '100%', maxWidth: '400px' }}>
          <h2>Welcome Back</h2>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <Button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}