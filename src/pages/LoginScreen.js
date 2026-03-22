import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { setCurrentScreen, login } = useApp();
  const [mode, setMode] = useState('login'); // login | signup | role
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
    // Mock login — demo accounts
    if (form.email === 'owner@demo.com') {
      login({ id: 'owner1', name: 'Rajesh Patel', email: form.email, role: 'owner' });
    } else {
      login({ id: 'user1', name: 'Demo User', email: form.email, role: 'customer' });
    }
  };

  const handleSignup = () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return; }
    setMode('role');
    setError('');
  };

  const handleRoleSelect = () => {
    if (!selectedRole) { setError('Please select a role'); return; }
    login({ id: Date.now().toString(), name: form.name, email: form.email, role: selectedRole });
  };

  const handleGoogle = (role) => {
    if (mode === 'signup') { setMode('role'); return; }
    login({ id: 'google1', name: 'Google User', email: 'user@gmail.com', role: 'customer' });
  };

  if (mode === 'role') {
    return (
      <div className="screen screen-enter" style={{ display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ marginTop: 60 }}>
          <button onClick={() => setMode('signup')} style={{ color: 'var(--text3)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
            I am a...
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 40 }}>
            Choose how you'll use CityFind
          </p>

          {['customer', 'owner'].map(role => (
            <div
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                border: `2px solid ${selectedRole === role ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                background: selectedRole === role ? 'var(--primary-light)' : 'var(--surface)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{
                width: 56, height: 56,
                background: selectedRole === role ? 'var(--primary)' : 'var(--surface3)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, transition: 'all 0.2s',
              }}>
                {role === 'customer' ? '👤' : '🏪'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, fontFamily: 'var(--font-display)', color: selectedRole === role ? 'var(--primary)' : 'var(--text)' }}>
                  {role === 'customer' ? 'Customer' : 'Business Owner'}
                </div>
                <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
                  {role === 'customer' ? 'Search & find local shops' : 'List my shop & products'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${selectedRole === role ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedRole === role ? 'var(--primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selectedRole === role && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />}
                </div>
              </div>
            </div>
          ))}

          {error && <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

          <button className="btn-primary" onClick={handleRoleSelect} style={{ marginTop: 16 }}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top decoration */}
      <div style={{
        background: 'linear-gradient(145deg, #FF6B2C, #E85A1B)',
        padding: '60px 24px 40px',
        borderRadius: '0 0 40px 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>🏙️</div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'white' }}>CityFind</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 34, fontWeight: 800,
          color: 'white', lineHeight: 1.1,
        }}>
          {mode === 'login' ? 'Welcome\nback! 👋' : 'Join your\ncity 🏙️'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 8 }}>
          {mode === 'login' ? 'Sign in to continue' : 'Create your free account'}
        </p>
      </div>

      {/* Form */}
      <div style={{ padding: '28px 24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 12,
                background: mode === m ? 'var(--primary)' : 'var(--surface2)',
                color: mode === m ? 'white' : 'var(--text2)',
                fontWeight: 600, fontSize: 14,
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <input
              className="input-field"
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          )}
          <input
            className="input-field"
            placeholder="Email Address"
            type="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          />

          {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}

          {mode === 'login' && (
            <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
              Demo: any email = customer | owner@demo.com = owner
            </p>
          )}

          <button
            className="btn-primary"
            onClick={mode === 'login' ? handleLogin : handleSignup}
          >
            {mode === 'login' ? 'Login' : 'Continue'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <button className="btn-google" onClick={handleGoogle}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
