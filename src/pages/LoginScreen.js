import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { auth, db, googleProvider } from '../firebase';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getRedirectResult,
  linkWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import logo from '../logo.png';

export default function LoginScreen() {
  const { setCurrentScreen, setCurrentUser } = useApp();
  const [mode, setMode] = useState('login'); // login | signup-choice | signup-email | signup-phone | otp | setup | role
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', otp: '' });
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' | 'email'

  const upsertUserDocAndRoute = async (firebaseUser, roleIfNew = null) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const role = roleIfNew || 'customer';
      const userData = {
        name: firebaseUser.displayName || form.name || 'User',
        email: firebaseUser.email || (form.phone ? `${form.phone}@cityfind.com` : ''),
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, userData);
      setCurrentUser({ id: firebaseUser.uid, ...userData });
      if (role === 'owner') setCurrentScreen('ownerDashboard');
      else setCurrentScreen('customerHome');
      return;
    }

    const userData = userSnap.data();
    setCurrentUser({ id: firebaseUser.uid, email: firebaseUser.email, ...userData });
    if (userData.role === 'owner') setCurrentScreen('ownerDashboard');
    else setCurrentScreen('customerHome');
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handleSendOTP = async () => {
    if (!form.phone || form.phone.length !== 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true);
    setError('');
    try {
      setupRecaptcha();
      const phone = '+91' + form.phone;
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setMode('otp');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!form.otp || form.otp.length !== 6) { setError('Enter 6-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      const result = await confirmationResult.confirm(form.otp);
      const user = result.user;
      
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        await upsertUserDocAndRoute(user);
      } else {
        setMode('setup'); 
      }
    } catch (err) {
      console.error(err);
      setError('Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupEmail = async () => {
    if (!form.name || !form.email || !form.password || !selectedRole) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await upsertUserDocAndRoute(userCred.user, selectedRole);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountPhone = async () => {
    if (!form.name || !form.password || !selectedRole) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      const email = `${form.phone || user.phoneNumber.replace('+91', '')}@cityfind.com`;
      const credential = EmailAuthProvider.credential(email, form.password);
      await linkWithCredential(user, credential);
      await upsertUserDocAndRoute(user, selectedRole);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (authMethod === 'email') {
        if (!form.email || !form.password) throw new Error('Please fill all fields');
        await signInWithEmailAndPassword(auth, form.email, form.password);
        await upsertUserDocAndRoute(auth.currentUser);
      } else {
        if (!form.phone || !form.password) throw new Error('Enter phone and password');
        const email = `${form.phone}@cityfind.com`;
        await signInWithEmailAndPassword(auth, email, form.password);
        await upsertUserDocAndRoute(auth.currentUser);
      }
    } catch (err) {
      console.error(err);
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        await upsertUserDocAndRoute(user);
      } else {
        // Default Google logins to customer if first time
        setMode('setup'); 
      }
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cf-screen" style={{ background: '#F8FAF9' }}>
      <div className="cf-safe" style={{ maxWidth: 400, margin: '0 auto', paddingTop: 60, paddingBottom: 40, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {/* App Logo — shown on all auth screens */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40, paddingTop: 20 }}>
          <div style={{ 
            width: 80, height: 80, 
            borderRadius: 22, 
            background: 'linear-gradient(135deg, #FF6B00, #F26101)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            marginBottom: 14, 
            boxShadow: '0 12px 32px rgba(242, 97, 1, 0.35)' 
          }}>
             <img src={logo} alt="CityFind" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 12 }} />
          </div>
          <div style={{ fontWeight: 900, fontSize: 28, color: '#111827', letterSpacing: '-0.02em' }}>CityFind</div>
          <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginTop: 4 }}>
            {mode === 'login' ? 'Welcome back!' : mode === 'signup-choice' ? 'Create your account' : mode === 'setup' ? 'Almost there!' : 'Get started free'}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 6, color: '#111827' }}>
            {mode === 'login' ? 'Sign In' : mode === 'signup-choice' ? 'Join CityFind' : 'Register'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {error && (
              <div style={{ color: '#dc2626', background: '#fef2f2', padding: '12px 16px', borderRadius: 12, fontSize: 14 }}>
                {error}
              </div>
            )}
            
            <div id="recaptcha-container"></div>

            {mode === 'login' && (
              <>
                <div style={{ display: 'flex', background: '#E5E7EB', borderRadius: 12, padding: 4 }}>
                   <button onClick={() => setAuthMethod('phone')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: authMethod === 'phone' ? '#fff' : 'transparent', fontWeight: 800 }}>Phone</button>
                   <button onClick={() => setAuthMethod('email')} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: authMethod === 'email' ? '#fff' : 'transparent', fontWeight: 800 }}>Email</button>
                </div>

                {authMethod === 'phone' ? (
                  <>
                    <input type="tel" placeholder="Phone Number (10 digit)" className="cf-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} style={{ height: 52 }} />
                    <input type="password" placeholder="Password" className="cf-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ height: 52 }} />
                    <button disabled={loading} onClick={handleLogin} className="cf-btn-primary" style={{ height: 54, borderRadius: 14 }}>Login</button>
                    <div style={{ textAlign: 'center', fontSize: 14 }}>
                       <span onClick={handleSendOTP} style={{ color: 'var(--cf-brand)', fontWeight: 800, cursor: 'pointer' }}>Login with OTP instead</span>
                    </div>
                  </>
                ) : (
                  <>
                    <input type="email" placeholder="Email Address" className="cf-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ height: 52 }} />
                    <input type="password" placeholder="Password" className="cf-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ height: 52 }} />
                    <button disabled={loading} onClick={handleLogin} className="cf-btn-primary" style={{ height: 54, borderRadius: 14 }}>Login</button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
                      <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                      <div style={{ fontSize: 12, color: '#999', fontWeight: 700 }}>OR</div>
                      <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                    </div>

                    <button 
                      onClick={handleGoogleSignIn} 
                      style={{ 
                        width: '100%', height: 54, borderRadius: 14, border: '1px solid #ddd', 
                        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        gap: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' 
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </>

                )}
                <div style={{ textAlign: 'center', fontSize: 15, marginTop: 20 }}>
                   Don't have an account? <span onClick={() => setMode('signup-choice')} style={{ color: 'var(--cf-brand)', fontWeight: 800, cursor: 'pointer' }}>Sign Up</span>
                </div>
              </>
            )}

            {mode === 'signup-choice' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <button onClick={() => setMode('signup-phone')} style={{ width: '100%', padding: '20px', borderRadius: 16, border: '2px solid var(--cf-brand)', background: '#fff', fontSize: 16, fontWeight: 900, color: 'var(--cf-brand)' }}>📱 Sign up with Phone (OTP)</button>
                  <button onClick={() => setMode('signup-email')} style={{ width: '100%', padding: '20px', borderRadius: 16, border: '1px solid #ddd', background: '#fff', fontSize: 16, fontWeight: 900 }}>📧 Sign up with Email (No OTP)</button>
                  <button onClick={() => setMode('login')} style={{ marginTop: 20, background: 'none', border: 'none', color: '#666', fontWeight: 700 }}>Back to Login</button>
               </div>
            )}

            {mode === 'signup-phone' && (
              <>
                 <input type="tel" placeholder="Enter Phone Number" className="cf-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value.replace(/\D/g, '').slice(0,10)})} style={{ height: 52 }} />
                 <button disabled={loading} onClick={handleSendOTP} className="cf-btn-primary" style={{ height: 54, borderRadius: 14 }}>Send OTP</button>
                 <button onClick={() => setMode('signup-choice')} style={{ background: 'none', border: 'none', color: '#666', fontWeight: 700 }}>Back</button>
              </>
            )}

            {mode === 'signup-email' && (
              <>
                 <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSelectedRole('customer')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${selectedRole === 'customer' ? 'var(--cf-brand)' : '#eee'}`, background: selectedRole === 'customer' ? '#FFF5EF' : '#fff' }}>Customer</button>
                    <button onClick={() => setSelectedRole('owner')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${selectedRole === 'owner' ? 'var(--cf-brand)' : '#eee'}`, background: selectedRole === 'owner' ? '#FFF5EF' : '#fff' }}>Owner</button>
                 </div>
                 <input placeholder="Full Name" className="cf-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ height: 52 }} />
                 <input type="email" placeholder="Email Address" className="cf-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={{ height: 52 }} />
                 <input type="password" placeholder="Password" className="cf-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ height: 52 }} />
                 <button disabled={loading} onClick={handleSignupEmail} className="cf-btn-primary" style={{ height: 54, borderRadius: 14 }}>Complete Registration</button>
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
                   <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                   <div style={{ fontSize: 12, color: '#999', fontWeight: 700 }}>OR</div>
                   <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                 </div>

                 <button 
                   onClick={handleGoogleSignIn} 
                   style={{ 
                     width: '100%', height: 54, borderRadius: 14, border: '1px solid #ddd', 
                     background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                     gap: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' 
                   }}
                 >
                   <svg width="20" height="20" viewBox="0 0 24 24">
                     <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                     <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                     <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                     <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"/>
                   </svg>
                   Continue with Google
                 </button>
                 
                 <button onClick={() => setMode('signup-choice')} style={{ background: 'none', border: 'none', color: '#666', fontWeight: 700 }}>Back</button>
              </>
            )}

            {mode === 'otp' && (
              <>
                 <input type="text" placeholder="6-digit OTP" className="cf-input" value={form.otp} onChange={e => setForm({...form, otp: e.target.value.replace(/\D/g, '').slice(0,6)})} style={{ height: 52, textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: 8 }} />
                 <button disabled={loading} onClick={handleVerifyOTP} className="cf-btn-primary" style={{ height: 54, borderRadius: 14 }}>Verify OTP</button>
              </>
            )}

            {mode === 'setup' && (
              <>
                 <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setSelectedRole('customer')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${selectedRole === 'customer' ? 'var(--cf-brand)' : '#eee'}`, background: selectedRole === 'customer' ? '#FFF5EF' : '#fff' }}>Customer</button>
                    <button onClick={() => setSelectedRole('owner')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${selectedRole === 'owner' ? 'var(--cf-brand)' : '#eee'}`, background: selectedRole === 'owner' ? '#FFF5EF' : '#fff' }}>Owner</button>
                 </div>
                 <input placeholder="Full Name" className="cf-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ height: 52 }} />
                 <input type="password" placeholder="Choose Password" className="cf-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={{ height: 52 }} />
                 <button disabled={loading} onClick={handleCreateAccountPhone} className="cf-btn-primary" style={{ height: 54, borderRadius: 14 }}>Finish Signup</button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
