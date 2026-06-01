import { getRiskColor, getRiskLabel } from '../../shared/utils/riskUtils';

export default function AlertHistory({ alerts }) {
	return (
		<section className="panel-card panel-card--history">
			<div className="panel-card__title-row">
				<div>
					<span className="section-label">Alert history</span>
					<h2 className="panel-card__title">Recent high-risk events</h2>
				</div>
			</div>

			<div className="history-list">
				{alerts.length === 0 ? (
					<p className="empty-state">No recent high-risk changes.</p>
				) : (
					alerts.slice(0, 4).map((probe) => (
						<div key={probe.id} className="history-row">
							<span className="history-row__dot" style={{ backgroundColor: getRiskColor('high') }} />
							<div>
								<strong>{probe.id}</strong>
								<p>{getRiskLabel(probe.riskLevel)} risk updated at {probe.lastUpdated}</p>
							</div>
						</div>
					))
				)}
			</div>
		</section>
	);
}