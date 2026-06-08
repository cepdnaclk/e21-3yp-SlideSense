import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ResidentDashboard from '../pages/resident/ResidentDashboard';
import ResearcherDashboard from '../pages/researcher/ResearcherDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

export const ROLE_ROUTE_KEYS = ['resident', 'researcher', 'admin'];
export const DEFAULT_ROUTE_KEY = 'resident';

export const APP_ROUTES = [
  {
    key: 'login',
    path: '/login',
    label: 'Login',
    Component: LoginPage,
  },
  {
    key: 'register',
    path: '/register',
    label: 'Register',
    Component: RegisterPage,
  },
  {
    key: 'resident',
    path: '/resident',
    label: 'Resident',
    Component: ResidentDashboard,
  },
  {
    key: 'researcher',
    path: '/researcher',
    label: 'Researcher',
    Component: ResearcherDashboard,
  },
  {
    key: 'admin',
    path: '/admin',
    label: 'Admin',
    Component: AdminDashboard,
  },
];

export function resolveRouteKey(pathname, storedRole) {
  const normalized = String(pathname ?? '').trim().toLowerCase();
  const routeKey = APP_ROUTES.find((route) => String(route.path).toLowerCase() === normalized)?.key ?? null;

  if (routeKey) {
    return routeKey;
  }

  const storedKey = ROLE_ROUTE_KEYS.includes(String(storedRole ?? '').toLowerCase())
    ? String(storedRole ?? '').toLowerCase()
    : null;

  return storedKey ?? 'login';
}