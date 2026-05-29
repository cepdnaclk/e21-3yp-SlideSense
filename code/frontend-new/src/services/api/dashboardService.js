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

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getAdminDashboardData() {
  return {
    tabs: cloneData(adminDashboardTabs),
    defaultThresholds: cloneData(adminDefaultThresholds),
    users: cloneData(adminUsers),
    securityLogs: cloneData(adminSecurityLogs),
  };
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