import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/authApi';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(email, password);
      login(data.token);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#1A5276'
    }}>
      <div style={{
        background: 'white', padding: '40px', borderRadius: '12px',
        width: '100%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#1A5276', marginBottom: '8px' }}>
          🛡️ VaxWise
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>
          Biosecurity Operating System
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '14px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#E74C3C', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: '#1A5276',
            color: 'white', border: 'none', borderRadius: '6px',
            fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}