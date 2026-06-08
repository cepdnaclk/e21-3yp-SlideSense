import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getRiskColor, getRiskLabel } from '../../shared/utils/riskUtils';
import SearchBar from './ProbeSearchBar';

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const COUNTRY_OVERVIEW_ZOOM = 8;
const FOCUS_ZOOM = 11.2;

function createPinIcon(color, selected) {
	return L.divIcon({
		className: 'probe-pin-icon',
		html: `<span class="probe-pin ${selected ? 'is-selected' : ''}" style="--pin-color: ${color};"></span>`,
		iconSize: [24, 34],
		iconAnchor: [12, 34],
		tooltipAnchor: [0, -28],
	});
}

function FocusOnSelection({ selectedProbe, focusTrigger }) {
	const map = useMap();

	useEffect(() => {
		if (!selectedProbe) {
			return;
		}

		map.flyTo([selectedProbe.latitude, selectedProbe.longitude], FOCUS_ZOOM, {
			duration: 1.25,
			easeLinearity: 0.25,
		});
	}, [map, selectedProbe, focusTrigger]);

	return null;
}

function ResetView({ trigger }) {
	const map = useMap();

	useEffect(() => {
		if (trigger > 0) {
			map.flyTo(SRI_LANKA_CENTER, COUNTRY_OVERVIEW_ZOOM, {
				duration: 1.25,
				easeLinearity: 0.25,
			});
		}
	}, [map, trigger]);

	return null;
}

export default function MapView({ probes, selectedProbeId, onSelectProbe, searchValue, onSearchChange, onSearchSubmit, focusTrigger, hideSearch }) {
	const [resetTrigger, setResetTrigger] = useState(0);

	const handleShowAll = () => {
		setResetTrigger(c => c + 1);
	};
	const selectedProbe = useMemo(
		() => probes.find((probe) => probe.id === selectedProbeId) ?? null,
		[probes, selectedProbeId],
	);

	return (
		<section className="map-card card-shell">
			<div className="panel-card__title-row map-card__header">
				<div className="map-card__heading">
					<h2 className="panel-card__title">Probe network overview</h2>
				</div>
				{!hideSearch && (
					<SearchBar
						value={searchValue}
						onChange={onSearchChange}
						onSubmit={onSearchSubmit}
						onShowAll={handleShowAll}
						probeIds={probes.map((probe) => probe.id)}
						inline
					/>
				)}
			</div>

			<div className="map-canvas">
				<MapContainer
					center={SRI_LANKA_CENTER}
					zoom={COUNTRY_OVERVIEW_ZOOM}
					minZoom={7}
					maxZoom={18}
					zoomSnap={0.1}
					scrollWheelZoom
					dragging
					touchZoom
					doubleClickZoom
					attributionControl
					className="slippy-map"
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>

					{(selectedProbeId ? probes.filter(p => p.id === selectedProbeId) : probes).map((probe) => {
						const selected = probe.id === selectedProbeId;
						const riskLabel = getRiskLabel(probe.riskLevel);

						return (
							<Marker
								key={probe.id}
								position={[probe.latitude, probe.longitude]}
								icon={createPinIcon(getRiskColor(probe.riskLevel), selected)}
								eventHandlers={{
									click: () => onSelectProbe(probe.id),
								}}
							>
								<Tooltip direction="top" offset={[0, -22]} opacity={1} className="probe-tooltip">
									<strong>{probe.id}</strong>
									<br />
									{riskLabel}
								</Tooltip>
							</Marker>
						);
					})}

					<FocusOnSelection selectedProbe={selectedProbe} focusTrigger={focusTrigger} />
					<ResetView trigger={resetTrigger} />
				</MapContainer>
			</div>

			<div className="map-footer">
				<span>Interactive slippy map with smooth pan and zoom.</span>
				{selectedProbe ? <strong>{selectedProbe.id}</strong> : <strong>All probes visible</strong>}
			</div>
		</section>
	);
}