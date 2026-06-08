import { getRiskColor, getRiskLabel } from '../../shared/utils/riskUtils';
import Button from '../common/Button';

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

export default function ProbeDetailsPanel({ probe, onEditCoordinate, onRemoveProbe }) {
	if (!probe) {
		return (
			<section className="panel-card panel-card--empty" id="probe-details-panel">
				<div className="panel-card__title-row">
					<div>
						<span className="section-label">Probe details</span>
						<h2 className="panel-card__title">No probe selected</h2>
					</div>
				</div>
				<p className="empty-state">Use search, the map, or the alert list to focus a probe and load live monitoring data.</p>
			</section>
		);
	}

	function handleEditCoordinate(field) {
		const label = field === 'latitude' ? 'Latitude' : 'Longitude';
		const nextValue = window.prompt(`Enter new ${label} value`, String(probe[field]));

		if (nextValue === null) {
			return;
		}

		const parsedValue = Number(nextValue.trim());
		if (!Number.isFinite(parsedValue)) {
			window.alert(`Please enter a valid number for ${label}.`);
			return;
		}

		if (typeof onEditCoordinate === 'function') onEditCoordinate(probe.id, field, parsedValue);
	}

	function handleRemove() {
		if (typeof onRemoveProbe === 'function') {
			onRemoveProbe(probe.id);
		}
	}

	return (
		<section className="panel-card" id="probe-details-panel">
			<div className="panel-card__title-row">
				<div>
					<span className="section-label">Probe details</span>
					<h2 className="panel-card__title">{probe.id}</h2>
				</div>
			</div>

			<div className="details-grid">
				<div className="detail-item">
					<span className="detail-item__label">Latitude</span>
					<div className="detail-item__value-row">
						<span className="detail-item__value">{probe.latitude.toFixed(4)}</span>
						<Button variant="ghost" className="detail-action-button" onClick={() => handleEditCoordinate('latitude')} title="Edit Latitude">
							<EditIcon />
						</Button>
					</div>
				</div>
				<div className="detail-item">
					<span className="detail-item__label">Longitude</span>
					<div className="detail-item__value-row">
						<span className="detail-item__value">{probe.longitude.toFixed(4)}</span>
						<Button variant="ghost" className="detail-action-button" onClick={() => handleEditCoordinate('longitude')} title="Edit Longitude">
							<EditIcon />
						</Button>
					</div>
				</div>
				<div className="detail-item">
					<span className="detail-item__label">Last updated</span>
					<span className="detail-item__value">{probe.lastUpdated}</span>
				</div>
			</div>

			<Button variant="outline" className="remove-probe-button" onClick={handleRemove} title="Remove probe">
				<TrashIcon />
			</Button>

		</section>
	);
}