import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Scanner from './pages/Scanner';
import Result from './pages/Result';
import Settings from './pages/Settings';
import About from './pages/About';
import History from './pages/History';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
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

function RequireOnboarding({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/register" replace />;
  }
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
    <AuthContext.Provider value={{ user, setUser, handleLogout }}>
      <Routes>
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/login" element={<Login onAuth={handleAuth} />} />
        <Route path="/register" element={<Register onAuth={handleAuth} />} />
        <Route element={<Layout />}>
          <Route index element={<RequireOnboarding><Scanner /></RequireOnboarding>} />
          <Route path="/result/:upc" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}
