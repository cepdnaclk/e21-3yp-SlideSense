import { useEffect, useState } from 'react';
import Button from '../common/Button';

const PlusIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M5 12h14" />
		<path d="M12 5v14" />
	</svg>
);

const INITIAL_FORM = {
	id: '',
	hwSerial: '',
	latitude: '',
	longitude: '',
};

export default function AddProbeForm({ onAddProbe, existingIds }) {
	const [form, setForm] = useState(INITIAL_FORM);
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (message) {
			const timer = window.setTimeout(() => setMessage(''), 3000);
			return () => window.clearTimeout(timer);
		}
		return undefined;
	}, [message]);

	function updateField(event) {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
	}

	function handleSubmit(event) {
		event.preventDefault();

		const id = form.id.trim().toUpperCase();
		const hwSerial = form.hwSerial.trim();
		const latitude = Number(form.latitude);
		const longitude = Number(form.longitude);

		if (!id || !hwSerial || Number.isNaN(latitude) || Number.isNaN(longitude)) {
			setMessage('Enter a valid probe ID, HW Serial, latitude, and longitude.');
			return;
		}

		if (existingIds.includes(id)) {
			setMessage('Probe ID already exists.');
			return;
		}

		onAddProbe({ id, hwSerial, latitude, longitude });
		setForm(INITIAL_FORM);
		setMessage(`Probe ${id} added to the map.`);
	}

	return (
		<section className="panel-card panel-card--compact">
			<div className="panel-card__title-row">
				<div>
					<span className="section-label">Add probe</span>
					<h2 className="panel-card__title">Register a sensor node</h2>
				</div>
			</div>

			<form className="add-probe-form" onSubmit={handleSubmit}>
				<div className="add-probe-form__row">
					<input name="id" value={form.id} onChange={updateField} placeholder="Probe ID" />
					<input name="hwSerial" value={form.hwSerial} onChange={updateField} placeholder="HW Serial" />
				</div>
				<div className="add-probe-form__row">
					<input name="latitude" value={form.latitude} onChange={updateField} placeholder="Latitude" />
					<input name="longitude" value={form.longitude} onChange={updateField} placeholder="Longitude" />
				</div>
				<Button className="primary-button--full" type="submit" title="Add probe">
					<PlusIcon />
				</Button>
			</form>

			{message ? <p className="form-message">{message}</p> : null}
		</section>
	);
}