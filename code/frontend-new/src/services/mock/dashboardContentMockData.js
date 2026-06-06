export const adminDashboardTabs = [
  {
    id: 'overview',
    label: 'System Overview',
    description: 'Health, connectivity, and critical alerts',
  },
  {
    id: 'nodes',
    label: 'Node Management',
    description: 'Map, details, and selected probe data',
  },
  {
    id: 'alerts',
    label: 'Alerts Management',
    description: 'Active alerts, history, and actions',
  },
  {
    id: 'configuration',
    label: 'System Configuration',
    description: 'Thresholds, risk rules, and security logs',
  },
  {
    id: 'user_management',
    label: 'User Management',
    description: 'Registration approvals, roles, and user access',
  },
];

export const adminDefaultThresholds = {
  rainfall: 60,
  moisture: 70,
  vibration: 55,
};

export const adminUsers = [
  { name: 'System Admin', email: 'admin@slidesense.local', role: 'admin', status: 'Enabled' },
  { name: 'Research Lead', email: 'research@slidesense.local', role: 'researcher', status: 'Enabled' },
  { name: 'Community Contact', email: 'resident@slidesense.local', role: 'resident', status: 'Enabled' },
  { name: 'New Researcher', email: 'new_researcher@slidesense.local', role: 'researcher', status: 'Pending' },
];

export const adminSecurityLogs = [
  { time: '2026-05-25 08:12', event: 'Successful admin login', detail: 'Session established from trusted network' },
  { time: '2026-05-25 09:04', event: 'Failed login attempt', detail: 'Unknown IP blocked after retry limit' },
  { time: '2026-05-25 09:18', event: 'Theft alert', detail: 'Tilt sensor movement detected on probe network' },
];

export const roleOptions = [
  {
    id: 'resident',
    title: 'Resident',
    description: 'View local risk status, alerts, and emergency guidance.',
  },
  {
    id: 'researcher',
    title: 'Researcher',
    description: 'Monitor probes, review analytics, and export data.',
  },
  {
    id: 'admin',
    title: 'Admin',
    description: 'Manage the system, alerts, thresholds, users, and logs.',
  },
];

export const researcherTabs = [
  { id: 'live', label: 'Live Monitoring', description: 'Map, feed, and live stream' },
  { id: 'analytics', label: 'Analytics', description: 'Trends and comparisons' },
  { id: 'export', label: 'Data & Export', description: 'History, filters, and downloads' },
];

export const researcherTimeRanges = [
  { id: '1h', label: '1 hour' },
  { id: '24h', label: '24 hours' },
  { id: '7d', label: '7 days' },
  { id: 'custom', label: 'Custom range' },
];

export const residentTabs = [
  { id: 'overview', label: 'Overview', description: 'Risk, conditions, and alerts' },
  { id: 'safety', label: 'Emergency & Safety', description: 'Instructions and contacts' },
];

export const residentSafetyContent = {
  emergencyInstructions: [
    { severity: 'Moderate', detail: 'Keep devices charged, monitor alerts, and avoid steep or loose slopes.' },
    { severity: 'High', detail: 'Move to safer ground, keep family together, and prepare a go-bag.' },
    { severity: 'Critical', detail: 'Evacuate immediately and follow official instructions without delay.' },
  ],
  emergencyContacts: [
    { label: 'Disaster Management Center', value: '117' },
    { label: 'Local emergency authority', value: 'contact your district office or local response unit.' },
  ],
  evacuationGuide: [
    'Leave early if warnings increase.',
    'Move away from slopes, drains, and streams.',
    'Use official routes and meet at a safe location.',
  ],
  evacuationNotes: {
    do: 'carry medicines, documents, and water.',
    doNot: 'cross fresh landslide debris or wait near retaining walls.',
  },
  safetyTips: [
    'Cracks in the ground or walls.',
    'Unusual rumbling sounds.',
    'Tilting trees or poles.',
    'Sudden muddy water or blocked drains.',
  ],
};

export const analyticsMetrics = [
  {
    key: 'rainfall',
    label: 'Rainfall',
    unit: 'mm',
    color: '#002e6b',
    maxValue: 10,
  },
  {
    key: 'moisture',
    label: 'Moisture',
    unit: '%',
    color: '#215e69',
    maxValue: 100,
  },
];

export const analyticsTimeRanges = [
  { key: '1h', label: '1h', points: 12, labels: ['60m', '55m', '50m', '45m', '40m', '35m', '30m', '25m', '20m', '15m', '10m', '5m'] },
  { key: '24h', label: '24h', points: 24, labels: ['24h', '23h', '22h', '21h', '20h', '19h', '18h', '17h', '16h', '15h', '14h', '13h', '12h', '11h', '10h', '9h', '8h', '7h', '6h', '5h', '4h', '3h', '2h', 'Now'] },
  { key: '7d', label: '7days', points: 7, labels: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'] },
];

export const realtimeMetricConfig = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: '#002e6b' },
  { key: 'moisture', label: 'Avg moisture', unit: '%', color: '#215e69' },
  { key: 'vibration', label: 'Vibration', unit: 'Hz', color: '#49947e' },
  { key: 'power', label: 'Power', unit: '%', color: '#9cbfa6' },
];