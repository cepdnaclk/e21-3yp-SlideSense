import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { APP_ROUTES, DEFAULT_ROUTE_KEY, ROLE_ROUTE_KEYS } from './routes/appRoutes';
import { logout as authLogout, getToken } from './services/api/authService';
import RegisterPage from './pages/auth/RegisterPage';

const ROLE_STORAGE_KEY = 'slidesense-role';

function RouterWrapper() {
  const navigate = useNavigate();

  function handleLogin(roleKey) {
    const nextRole = ROLE_ROUTE_KEYS.includes(roleKey) ? roleKey : DEFAULT_ROUTE_KEY;
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    navigate(`/${nextRole}`);
  }

  function handleLogout() {
    authLogout();
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
    navigate('/login');
  }

  useEffect(() => {
    const originalFetch = window.fetch;
    let isAlerting = false;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      // If we get a 401 and it's not the login endpoint itself, we trigger a logout
      if (response.status === 401 && !url.includes('/auth/login')) {
        if (!isAlerting) {
          isAlerting = true;
          alert('Your session has timed out. You have been logged out.');
          authLogout();
          window.localStorage.removeItem(ROLE_STORAGE_KEY);
          navigate('/login');
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [navigate]);

  const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
  const token = getToken();
  
  const defaultPath = (storedRole && ROLE_ROUTE_KEYS.includes(storedRole) && token) ? `/${storedRole}` : '/login';
  
  const Login = APP_ROUTES.find((r) => r.key === 'login').Component;
  const Resident = APP_ROUTES.find((r) => r.key === 'resident').Component;
  const Researcher = APP_ROUTES.find((r) => r.key === 'researcher').Component;
  const Admin = APP_ROUTES.find((r) => r.key === 'admin').Component;

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/resident" element={token ? <Resident onLogout={handleLogout} currentRouteKey={'resident'} /> : <Navigate to="/login" />} />
      <Route path="/researcher" element={token ? <Researcher onLogout={handleLogout} currentRouteKey={'researcher'} /> : <Navigate to="/login" />} />
      <Route path="/admin" element={token ? <Admin onLogout={handleLogout} currentRouteKey={'admin'} /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouterWrapper />
    </BrowserRouter>
  );
}