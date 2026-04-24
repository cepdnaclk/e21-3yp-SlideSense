import { getRiskColor } from '../../../shared/utils/riskUtils';

export default function StatCard({ label, value, tone = 'low', note }) {
  const accent = tone === 'total' ? getRiskColor('low') : tone === 'high' ? getRiskColor('high') : tone === 'medium' ? getRiskColor('medium') : getRiskColor('low');

  return (
    <article className="stat-card" style={{ '--stat-accent': accent }}>
      <span className="stat-card__accent" />
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__label">{label}</div>
      {note ? <div className="stat-card__note">{note}</div> : null}
    </article>
  );
}