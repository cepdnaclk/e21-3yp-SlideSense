import { useEffect, useState } from 'react';

const INITIAL_FORM = {
	id: '',
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
		const latitude = Number(form.latitude);
		const longitude = Number(form.longitude);

		if (!id || Number.isNaN(latitude) || Number.isNaN(longitude)) {
			setMessage('Enter a valid probe ID, latitude, and longitude.');
			return;
		}

		if (existingIds.includes(id)) {
			setMessage('Probe ID already exists.');
			return;
		}

		onAddProbe({ id, latitude, longitude });
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
				<input name="id" value={form.id} onChange={updateField} placeholder="Probe ID" />
				<div className="add-probe-form__row">
					<input name="latitude" value={form.latitude} onChange={updateField} placeholder="Latitude" />
					<input name="longitude" value={form.longitude} onChange={updateField} placeholder="Longitude" />
				</div>
				<button className="primary-button primary-button--full" type="submit">
					Add probe
				</button>
			</form>

			{message ? <p className="form-message">{message}</p> : null}
		</section>
	);
}