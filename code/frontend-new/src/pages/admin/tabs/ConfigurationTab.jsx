import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';

function ConfigCard({ title, children }) {
  return (
    <Card className="config-card">
      <span className="section-label">{title}</span>
      {children}
    </Card>
  );
}

export default function ConfigurationTab({
  thresholds,
  handleThresholdChange,
  saveThresholds,
  securityLogs
}) {
  return (
    <section className="dashboard-stack">
      <div className="card-grid card-grid--two">
        <ConfigCard title="Threshold settings">
          <div className="config-form-grid">
            <label>
              Rainfall threshold
              <input name="rainfall" type="number" value={thresholds.rainfall} onChange={handleThresholdChange} />
            </label>
            <label>
              Soil moisture threshold
              <input name="moisture" type="number" value={thresholds.moisture} onChange={handleThresholdChange} />
            </label>
            <label>
              Vibration threshold
              <input name="vibration" type="number" value={thresholds.vibration} onChange={handleThresholdChange} />
            </label>
          </div>
          <Button onClick={saveThresholds}>Save thresholds</Button>
        </ConfigCard>

        <ConfigCard title="Risk rules editor">
          <p>Define risk levels and update detection logic parameters.</p>
          <div className="config-form-grid">
            <label>
              Low risk label
              <input defaultValue="Stable" />
            </label>
            <label>
              Warning label
              <input defaultValue="Watch closely" />
            </label>
            <label>
              Critical label
              <input defaultValue="Evacuate" />
            </label>
          </div>
        </ConfigCard>
      </div>

      <div className="card-grid card-grid--two">
        <ConfigCard title="Security logs">
          <Table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {securityLogs.map((entry) => (
                <tr key={`${entry.time}-${entry.event}`}>
                  <td>{entry.time}</td>
                  <td>{entry.event}</td>
                  <td>{entry.detail}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ConfigCard>
      </div>
    </section>
  );
}
