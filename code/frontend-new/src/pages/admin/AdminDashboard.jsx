import { useMemo, useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import Tabs from '../../components/common/Tabs';
import ConfirmModal from '../../components/common/ConfirmModal';
import LogoutButton from '../../components/common/LogoutButton';
import AdminLayout from '../../layouts/AdminLayout';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import { useProbeNetwork } from '../../shared/hooks/useProbeNetwork';
import { getAdminDashboardData } from '../../services/api/dashboardService';
import { isProbeOffline, getAlertRows } from '../../shared/utils/probeUtils';


import OverviewTab from './tabs/OverviewTab';
import NodesTab from './tabs/NodesTab';
import AlertsTab from './tabs/AlertsTab';
import ConfigurationTab from './tabs/ConfigurationTab';

const initialTabs = [];
const initialUsers = [];
const initialSecurityLogs = [];
const initialThresholds = { rainfall: 60, moisture: 70, vibration: 55 };

export default function AdminDashboard({ onLogout }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [users, setUsers] = useState(initialUsers);
  const [securityLogs, setSecurityLogs] = useState(initialSecurityLogs);
  const [defaultThresholds, setDefaultThresholds] = useState(initialThresholds);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getAdminDashboardData();
        if (!active) return;
        setTabs(data.tabs ?? []);
        setSecurityLogs(data.securityLogs ?? []);
        setDefaultThresholds(data.defaultThresholds ?? initialThresholds);
        setThresholds(data.defaultThresholds ?? initialThresholds);
      } catch (err) {
        // keep defaults on error
      }
    }

    load();
    return () => { active = false; };
  }, []);
  
  const {
    probes,
    selectedProbe,
    selectedProbeId,
    searchValue,
    focusTrigger,
    isLoadingLiveData,
    loadError,
    stats,
    highRiskProbes,
    selectProbe,
    handleSearchChange,
    handleSearchSubmit,
    addProbe,
    updateProbeCoordinate,
    removeProbe,
  } = useProbeNetwork();
  
  const [activeTabId, setActiveTabId] = useState('overview');
  const [activeNodeTab, setActiveNodeTab] = useState('overview');
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [statusMessage, setStatusMessage] = useState('');
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState([]);
  const [nodeToRemove, setNodeToRemove] = useState(null);

  const activeAlerts = useMemo(() => getAlertRows(probes).filter((alert) => !acknowledgedAlertIds.includes(alert.id)), [probes, acknowledgedAlertIds]);
  const offlineCount = useMemo(() => probes.filter(isProbeOffline).length, [probes]);
  const activeNodeCount = Math.max(stats.total - offlineCount, 0);
  const systemHealthLabel = loadError ? 'Needs attention' : activeNodeCount === stats.total ? 'Healthy' : 'Degraded';

  function acknowledgeAlert(alertId) {
    setAcknowledgedAlertIds((current) => (current.includes(alertId) ? current : [...current, alertId]));
    setStatusMessage(`Alert ${alertId} acknowledged.`);
  }

  function clearResolvedAlerts() {
    setAcknowledgedAlertIds([]);
    setStatusMessage('Resolved alerts cleared from the active list.');
  }

  function saveThresholds() {
    setStatusMessage('Threshold settings saved locally for the current session.');
  }

  function handleThresholdChange(event) {
    const { name, value } = event.target;
    setThresholds((current) => ({ ...current, [name]: value }));
  }

  function confirmRemoveProbe(probeId) {
    setNodeToRemove(probeId);
  }

  function handleRemoveProbe() {
    if (nodeToRemove) {
      removeProbe(nodeToRemove);
      setNodeToRemove(null);
      setStatusMessage(`Node ${nodeToRemove} has been removed.`);
    }
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      status={isLoadingLiveData ? 'Loading live sensor data from backend...' : loadError || 'Live backend connected.'}
      actions={<LogoutButton onLogout={onLogout} />}
      sidebar={
        <Tabs 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onChange={setActiveTabId} 
          ariaLabel="Admin dashboard sections"
          variant="vertical"
          hideDescriptions={true}
        />
      }
    >
      <main className="admin-dashboard">

        {statusMessage ? <p className="dashboard-banner">{statusMessage}</p> : null}

        {activeTabId === 'overview' ? (
          <OverviewTab
            stats={stats}
            selectedProbeId={selectedProbeId}
            systemHealthLabel={systemHealthLabel}
            activeNodeCount={activeNodeCount}
            loadError={loadError}
            highRiskProbes={highRiskProbes}
            activeAlerts={activeAlerts}
            offlineCount={offlineCount}
            probes={probes}
            selectProbe={selectProbe}
            searchValue={searchValue}
            handleSearchChange={handleSearchChange}
            handleSearchSubmit={handleSearchSubmit}
            focusTrigger={focusTrigger}
            selectedProbe={selectedProbe}
          />
        ) : null}

        {activeTabId === 'nodes' ? (
          <NodesTab
            activeNodeTab={activeNodeTab}
            setActiveNodeTab={setActiveNodeTab}
            selectedProbeId={selectedProbeId}
            selectProbe={selectProbe}
            probes={probes}
            searchValue={searchValue}
            handleSearchChange={handleSearchChange}
            handleSearchSubmit={handleSearchSubmit}
            focusTrigger={focusTrigger}
            selectedProbe={selectedProbe}
            updateProbeCoordinate={updateProbeCoordinate}
            confirmRemoveProbe={confirmRemoveProbe}
            addProbe={addProbe}
          />
        ) : null}

        {activeTabId === 'alerts' ? (
          <AlertsTab
            highRiskProbes={highRiskProbes}
            selectProbe={selectProbe}
            clearResolvedAlerts={clearResolvedAlerts}
            activeAlerts={activeAlerts}
            acknowledgeAlert={acknowledgeAlert}
          />
        ) : null}

        {activeTabId === 'configuration' ? (
          <ConfigurationTab
            thresholds={thresholds}
            handleThresholdChange={handleThresholdChange}
            saveThresholds={saveThresholds}
            securityLogs={securityLogs}
          />
        ) : null}

        {activeTabId === 'user_management' ? (
          <UserManagementPanel probes={probes} />
        ) : null}
      </main>

      <ConfirmModal
        isOpen={!!nodeToRemove}
        onClose={() => setNodeToRemove(null)}
        onConfirm={handleRemoveProbe}
        title="Remove Node"
        message={`Are you sure you want to remove node ${nodeToRemove}? This action will permanently disconnect the node from the network and stop all data collection for this unit.`}
        confirmText="Remove Node"
        cancelText="Cancel"
        isDestructive={true}
      />
    </AdminLayout>
  );
}