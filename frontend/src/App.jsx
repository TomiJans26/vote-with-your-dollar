import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Scanner from './pages/Scanner';
import Result from './pages/Result';
import Settings from './pages/Settings';
import About from './pages/About';
import History from './pages/History';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import BetaGate from './components/BetaGate';
import { hasCompletedOnboarding } from './lib/prefs';
import { getStoredUser, isAuthenticated, getMe, saveBeliefProfileToServer } from './lib/api';
import { getBeliefProfile } from './lib/prefs';

// Auth context
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function RequireAuth({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/register" replace />;
  }
  return children;
}

function RequireVerified({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/register" replace />;
  }
  const u = getStoredUser();
  if (u && !u.email_verified) {
    return <Navigate to="/verify-email" replace />;
  }
  return children;
}

function RequireOnboarding({ children }) {
  // If logged in but not verified, nudge them
  if (isAuthenticated()) {
    const u = getStoredUser();
    if (u && !u.email_verified) {
      return <Navigate to="/verify-email" replace />;
    }
  }
  // Onboarding is required for everyone (but NOT auth)
  if (!hasCompletedOnboarding()) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);

  // On mount, verify token is still valid
  useEffect(() => {
    if (isAuthenticated()) {
      getMe().then(u => { if (u) setUser(u); else setUser(null); }).catch(() => setUser(null));
    }
  }, []);

  const handleAuth = useCallback((u) => {
    setUser(u);
    // Sync localStorage beliefs to server after login/register
    if (u) {
      const localBeliefs = getBeliefProfile();
      if (localBeliefs && Object.keys(localBeliefs).length > 0) {
        saveBeliefProfileToServer(localBeliefs);
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <BetaGate>
    <AuthContext.Provider value={{ user, setUser, handleLogout }}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/verify-email" element={<RequireAuth><VerifyEmail /></RequireAuth>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login" element={<Login onAuth={handleAuth} />} />
        <Route path="/register" element={<Register onAuth={handleAuth} />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route element={<Layout />}>
          <Route index element={<RequireOnboarding><Scanner /></RequireOnboarding>} />
          <Route path="/result/:upc" element={<Result />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/report" element={<RequireOnboarding><Dashboard /></RequireOnboarding>} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
    </BetaGate>
  );
}
