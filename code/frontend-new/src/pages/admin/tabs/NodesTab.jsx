import Tabs from '../../../components/common/Tabs';
import Card from '../../../components/common/Card';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import ProbeMapView from '../../../components/admin/ProbeMapView';
import CurrentStatusPanel from '../../../components/admin/CurrentStatusPanel';
import ProbeDetailsPanel from '../../../components/admin/ProbeDetailsPanel';
import AnalyticsCharts from '../../../components/admin/AnalyticsCharts';
import NodeRegistrationForm from '../../../components/admin/NodeRegistrationForm';
import { isProbeOffline } from '../../../shared/utils/probeUtils';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

export default function NodesTab({
  activeNodeTab,
  setActiveNodeTab,
  selectedProbeId,
  selectProbe,
  probes,
  searchValue,
  handleSearchChange,
  handleSearchSubmit,
  focusTrigger,
  selectedProbe,
  updateProbeCoordinate,
  confirmRemoveProbe,
  addProbe
}) {
  return (
    <section className="dashboard-stack">
      <Tabs 
         tabs={[
           {id: 'overview', label: 'Node Overview'}, 
           {id: 'registered', label: 'Registered Nodes'}
         ]}
         activeTabId={activeNodeTab}
         onChange={setActiveNodeTab}
         ariaLabel="Node management sub-tabs"
      />
      {activeNodeTab === 'overview' ? (
        <div className="dashboard-stack">
          <Card className="node-overview-header">
             <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span style={{ fontWeight: 'bold' }}>Select Probe:</span>
               <input 
                 list="probe-select-list"
                 value={searchValue || ''}
                 onChange={(e) => {
                   handleSearchChange(e);
                   const val = e.target.value.toUpperCase();
                   if (probes.some(p => p.id === val)) {
                     selectProbe(val);
                   }
                 }}
                 placeholder="Search probe..."
                 style={{ padding: '0.5rem', borderRadius: '4px', minWidth: '200px', border: '1px solid var(--border)' }}
               />
               <datalist id="probe-select-list">
                 {probes
                   .filter(p => !searchValue || p.id.toLowerCase().includes(searchValue.toLowerCase()))
                   .slice(0, 10)
                   .map(p => <option key={p.id} value={p.id} />)}
               </datalist>
               <Button type="submit" variant="primary">Locate probe</Button>
               {selectedProbeId && (
                 <Button type="button" variant="outline" onClick={() => selectProbe('')}>
                   Show all
                 </Button>
               )}
             </form>
          </Card>
          <ProbeMapView
            probes={probes}
            selectedProbeId={selectedProbeId}
            onSelectProbe={selectProbe}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
            focusTrigger={focusTrigger}
            hideSearch={true}
          />

          <section className="card-grid card-grid--two">
            <CurrentStatusPanel probe={selectedProbe} />
            <Card className="historical-data-card">
              <span className="section-label">Selected probe history</span>
              <h2>{selectedProbe?.id ?? 'No probe selected'}</h2>
              <Table style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>Date & Time</th>
                    <th style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>Rainfall</th>
                    <th style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>Moisture</th>
                    <th style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>Vibration</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(selectedProbe?.history ?? [])].reverse().map((row) => (
                    <tr key={`${row.timestamp || row.label}-${row.rainfall}`}>
                      <td>{row.timestamp || row.label}</td>
                      <td>{row.rainfall}</td>
                      <td>{row.moisture}</td>
                      <td>{row.vibration}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            <ProbeDetailsPanel
              probe={selectedProbe}
              onEditCoordinate={updateProbeCoordinate}
              onRemoveProbe={confirmRemoveProbe}
            />
          </section>
          <AnalyticsCharts probe={selectedProbe} />
        </div>
      ) : (
        <div className="dashboard-stack">
          <NodeRegistrationForm onAddProbe={addProbe} existingIds={probes.map((probe) => probe.id)} />
          <Card className="node-list-card">
            <div className="panel-card__title-row">
              <div>
                <span className="section-label">Node list</span>
                <h2 className="panel-card__title">Registered probes</h2>
              </div>
            </div>
            <Table>
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Last update</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {probes.map((probe) => (
                  <tr key={probe.id}>
                    <td>{probe.id}</td>
                    <td>{probe.latitude.toFixed(4)}, {probe.longitude.toFixed(4)}</td>
                    <td>{isProbeOffline(probe) ? 'offline' : 'online'}</td>
                    <td>{probe.lastUpdated}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" title="Edit Probe" onClick={() => alert('Editing functionality will be fully implemented by the backend soon. For now, use the map to update coordinates if needed.')}>
                          <EditIcon />
                        </Button>
                        <Button variant="ghost" title="Remove Probe" onClick={() => confirmRemoveProbe(probe.id)}>
                          <TrashIcon />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}
    </section>
  );
}
