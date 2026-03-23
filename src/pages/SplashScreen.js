import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import logo from '../logo.png';

export default function SplashScreen() {
  const { setCurrentScreen, loadingConfig, currentUser } = useApp();

  useEffect(() => {
    const startTime = Date.now();

    // Hard failsafe: never wait more than 5 seconds total — navigate regardless
    const hardTimeout = setTimeout(() => {
      if (currentUser) {
        if (currentUser.role === 'owner') setCurrentScreen('ownerDashboard');
        else if (currentUser.role === 'rider') setCurrentScreen('riderDashboard');
        else setCurrentScreen('customerHome');
      } else {
        setCurrentScreen('login');
      }
    }, 5000);

    // If Firebase resolves faster, navigate as soon as both are ready
    const checkState = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 2000 && !loadingConfig) {
        clearInterval(checkState);
        clearTimeout(hardTimeout);
        if (currentUser) {
          if (currentUser.role === 'owner') setCurrentScreen('ownerDashboard');
          else if (currentUser.role === 'rider') setCurrentScreen('riderDashboard');
          else setCurrentScreen('customerHome');
        } else {
          setCurrentScreen('login');
        }
      }
    }, 100);

    return () => {
      clearInterval(checkState);
      clearTimeout(hardTimeout);
    };
  }, [loadingConfig, currentUser, setCurrentScreen]);

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(145deg, #FF6B2C 0%, #E85A1B 50%, #1A1A2E 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      {/* Logo */}
        <div style={{ animation: 'splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{
          width: 110, height: 110,
          borderRadius: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(255,107,44,0.5)',
          border: '3px solid rgba(255,255,255,0.3)',
          marginBottom: 8,
        }}>
          <img src={logo} alt="CityFind Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s 0.3s ease both' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 42, fontWeight: 800,
          color: 'white', letterSpacing: '-1px',
          lineHeight: 1,
        }}>CityFind</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 8, fontWeight: 300 }}>
          Discover your city's best shops
        </p>
      </div>

      {/* Loading dots */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 32,
        animation: 'fadeUp 0.5s 0.6s ease both',
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            animation: `dotPulse 1.2s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splashPop {
          from { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
          40% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
