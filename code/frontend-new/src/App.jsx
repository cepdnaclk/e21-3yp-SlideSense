import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { APP_ROUTES, DEFAULT_ROUTE_KEY, ROLE_ROUTE_KEYS } from './routes/appRoutes';
import { logout as authLogout, getToken } from './services/api/authService';

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