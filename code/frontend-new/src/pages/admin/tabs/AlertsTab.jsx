import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import HighRiskAlertsPanel from '../../../components/admin/HighRiskAlertsPanel';
import AlertHistoryPanel from '../../../components/admin/AlertHistoryPanel';

export default function AlertsTab({
  highRiskProbes,
  selectProbe,
  clearResolvedAlerts,
  activeAlerts,
  acknowledgeAlert
}) {
  return (
    <section className="dashboard-stack">
      <div className="card-grid card-grid--two">
        <HighRiskAlertsPanel alerts={highRiskProbes} onSelectProbe={selectProbe} />
        <AlertHistoryPanel alerts={highRiskProbes} />
      </div>

      <Card className="alerts-management-card">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">Active alerts list</span>
            <h2 className="panel-card__title">System-wide alerts</h2>
          </div>
          <Button variant="outline" onClick={clearResolvedAlerts}>Clear resolved</Button>
        </div>

        <Table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Time</th>
              <th>Node</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeAlerts.length === 0 ? (
              <tr>
                <td colSpan="5">No active alerts.</td>
              </tr>
            ) : activeAlerts.map((alert) => (
              <tr key={alert.id}>
                <td>{alert.severity}</td>
                <td>{alert.time}</td>
                <td>{alert.node}</td>
                <td>{alert.description}</td>
                <td>
                  <Button variant="ghost" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </section>
  );
}
