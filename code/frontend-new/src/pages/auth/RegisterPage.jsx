import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { register } from '../../services/api/authService';

export default function RegisterPage() {
  // Registration State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regRole, setRegRole] = useState('RESIDENT');
  const [regReason, setRegReason] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setRegLoading(true);
    try {
      await register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        phoneNumber: regPhone,
        address: regAddress,
        requestedRole: regRole,
        reason: regReason,
      });
      setRegSuccess('Registration submitted successfully! It is pending admin approval.');
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegPhone('');
      setRegAddress('');
      setRegReason('');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="login-page login-page--centered">
      <div className="login-page__logo-container">
        <img src="/logo.png" alt="Slide Sense Logo" className="login-page__logo" />
      </div>
      <div className="login-page__hero login-page__hero--centered">
        <span className="section-label">Join SlideSense Community</span>
        <h1>Register</h1>
        <p>
          Request access to SlideSense to view landslide monitoring data, alerts, and guidelines.
        </p>
      </div>

      <div className="login-page__content-centered">
        <Card className="login-role-card" style={{ width: '100%', maxWidth: '480px' }}>
          <h2>Create Account</h2>
          {regError && <div style={{ color: 'var(--high-risk)', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>{regError}</div>}
          {regSuccess && <div style={{ color: 'var(--risk-low)', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem' }}>{regSuccess}</div>}
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regFullName">Full Name</label>
              <input 
                id="regFullName" 
                type="text" 
                value={regFullName} 
                onChange={(e) => setRegFullName(e.target.value)} 
                required 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regEmail">Email Address</label>
              <input 
                id="regEmail" 
                type="email" 
                value={regEmail} 
                onChange={(e) => setRegEmail(e.target.value)} 
                required 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regPassword">Password</label>
              <input 
                id="regPassword" 
                type="password" 
                value={regPassword} 
                onChange={(e) => setRegPassword(e.target.value)} 
                required 
                minLength={8} 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regPhone">Phone Number</label>
              <input 
                id="regPhone" 
                type="text" 
                value={regPhone} 
                onChange={(e) => setRegPhone(e.target.value)} 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regAddress">Address</label>
              <input 
                id="regAddress" 
                type="text" 
                value={regAddress} 
                onChange={(e) => setRegAddress(e.target.value)} 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regRole">Role</label>
              <select 
                id="regRole" 
                value={regRole} 
                onChange={(e) => setRegRole(e.target.value)} 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="RESIDENT">Resident</option>
                <option value="RESEARCHER">Researcher</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <label htmlFor="regReason">Reason for access</label>
              <textarea 
                id="regReason" 
                value={regReason} 
                onChange={(e) => setRegReason(e.target.value)} 
                required 
                style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }} 
              />
            </div>
            <Button type="submit" disabled={regLoading} style={{ marginTop: '1rem' }}>
              {regLoading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <div className="auth-switch-link" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
