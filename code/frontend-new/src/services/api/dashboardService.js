import {
  adminDashboardTabs,
  adminDefaultThresholds,
  adminUsers,
  adminSecurityLogs,
  roleOptions,
  researcherTabs,
  researcherTimeRanges,
  residentTabs,
  residentSafetyContent,
  analyticsMetrics,
  analyticsTimeRanges,
  realtimeMetricConfig,
} from '../mock/dashboardContentMockData.js';
import { getToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getAdminDashboardData() {
  try {
    const [thresholds, logs] = await Promise.all([
      fetchWithAuth('/admin/config/thresholds'),
      fetchWithAuth('/admin/config/security-logs'),
    ]);
    return {
      tabs: cloneData(adminDashboardTabs),
      defaultThresholds: thresholds,
      users: cloneData(adminUsers),
      securityLogs: logs,
    };
  } catch (err) {
    console.error('Failed to load admin dashboard data from backend:', err);
    return {
      tabs: cloneData(adminDashboardTabs),
      defaultThresholds: cloneData(adminDefaultThresholds),
      users: cloneData(adminUsers),
      securityLogs: cloneData(adminSecurityLogs),
    };
  }
}

export async function updateThresholds(thresholdsData) {
  return fetchWithAuth('/admin/config/thresholds', {
    method: 'POST',
    body: JSON.stringify(thresholdsData),
  });
}

export async function getRoleOptions() {
  return cloneData(roleOptions);
}

export async function getResearcherDashboardData() {
  return {
    tabs: cloneData(researcherTabs),
    timeRanges: cloneData(researcherTimeRanges),
    defaultRange: researcherTimeRanges[1]?.id ?? researcherTimeRanges[0]?.id ?? '',
  };
}

export async function getResidentDashboardData() {
  return {
    tabs: cloneData(residentTabs),
    safetyContent: cloneData(residentSafetyContent),
  };
}

export async function getAnalyticsConfig() {
  return {
    metrics: cloneData(analyticsMetrics),
    timeRanges: cloneData(analyticsTimeRanges),
    realtimeMetrics: cloneData(realtimeMetricConfig),
    defaultRange: analyticsTimeRanges[1]?.key ?? analyticsTimeRanges[0]?.key ?? '',
  };
}