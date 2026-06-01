import { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { APP_ROUTES, DEFAULT_ROUTE_KEY, ROLE_ROUTE_KEYS } from './routes/appRoutes';

const ROLE_STORAGE_KEY = 'slidesense-role';

function RouterWrapper() {
  const navigate = useNavigate();

  function handleLogin(roleKey) {
    const nextRole = ROLE_ROUTE_KEYS.includes(roleKey) ? roleKey : DEFAULT_ROUTE_KEY;
    window.localStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    navigate(`/${nextRole}`);
  }

  function handleLogout() {
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
    navigate('/login');
  }

  const storedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
  const defaultPath = storedRole && ROLE_ROUTE_KEYS.includes(storedRole) ? `/${storedRole}` : '/login';
  const Login = APP_ROUTES.find((r) => r.key === 'login').Component;
  const Resident = APP_ROUTES.find((r) => r.key === 'resident').Component;
  const Researcher = APP_ROUTES.find((r) => r.key === 'researcher').Component;
  const Admin = APP_ROUTES.find((r) => r.key === 'admin').Component;

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/resident" element={<Resident onLogout={handleLogout} currentRouteKey={'resident'} />} />
      <Route path="/researcher" element={<Researcher onLogout={handleLogout} currentRouteKey={'researcher'} />} />
      <Route path="/admin" element={<Admin onLogout={handleLogout} currentRouteKey={'admin'} />} />
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