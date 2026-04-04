import React from 'react';
import './index.css';
import './ui/kit.css';
import { AppProvider, useApp } from './context/AppContext';
import SplashScreen from './pages/SplashScreen';
import LoginScreen from './pages/LoginScreen';
import CustomerHome from './pages/CustomerHome';
import OwnerDashboard from './pages/OwnerDashboard';
import ShopDetail from './pages/ShopDetail';

function Router() {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case 'splash': return <SplashScreen />;
    case 'login': return <LoginScreen />;
    case 'customerHome': return <CustomerHome />;
    case 'ownerDashboard': return <OwnerDashboard />;
    case 'shopDetail': return <ShopDetail />;
    default: return <LoginScreen />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
