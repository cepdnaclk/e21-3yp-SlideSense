import { useMemo, useState, useEffect } from 'react';
import { chartColors } from '../../shared/styles/colors';
import { getAnalyticsConfig } from '../../services/api/dashboardService';

const DEFAULT_METRICS = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: chartColors[0], maxValue: 10 },
  { key: 'moisture', label: 'Moisture', unit: '%', color: chartColors[1], maxValue: 100 },
];

const DEFAULT_TIME_RANGES = [
  { key: '1h', label: '1h', points: 12, labels: ['60m', '55m', '50m', '45m', '40m', '35m', '30m', '25m', '20m', '15m', '10m', '5m'] },
  { key: '24h', label: '24h', points: 24, labels: ['24h', '23h', '22h', '21h', '20h', '19h', '18h', '17h', '16h', '15h', '14h', '13h', '12h', '11h', '10h', '9h', '8h', '7h', '6h', '5h', '4h', '3h', '2h', 'Now'] },
  { key: '7d', label: '7days', points: 7, labels: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'] },
];

const SVG_WIDTH = 640;
const SVG_HEIGHT = 300;
const MARGIN = { top: 18, right: 18, bottom: 58, left: 52 };
const GRID_STEPS = 10;

function normalizeMetricValue(metric, value) {
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return 0;
	}

	return Math.max(0, Math.min(metric.maxValue, parsed));
}

function resample(values, targetCount) {
	if (targetCount <= 0) {
		return [];
	}

	if (!values.length) {
		return Array.from({ length: targetCount }, () => 0);
	}

	if (values.length === 1) {
		return Array.from({ length: targetCount }, () => values[0]);
	}

	if (targetCount === values.length) {
		return values;
	}

	return Array.from({ length: targetCount }, (_, index) => {
		const position = (index / (targetCount - 1)) * (values.length - 1);
		const lowerIndex = Math.floor(position);
		const upperIndex = Math.ceil(position);

		if (lowerIndex === upperIndex) {
			return values[lowerIndex];
		}

		const ratio = position - lowerIndex;
		return values[lowerIndex] + (values[upperIndex] - values[lowerIndex]) * ratio;
	});
}


function buildSeries(history, metric, rangeKey, ranges) {
	const range = (ranges || DEFAULT_TIME_RANGES).find((item) => item.key === rangeKey) ?? (ranges || DEFAULT_TIME_RANGES)[0];
	const metricHistory = Array.isArray(history)
		? history.map((point) => normalizeMetricValue(metric, point?.[metric.key]))
		: [];
	const source = metricHistory.length > 0 ? metricHistory : [];
	const values = resample(source.slice(-Math.max(source.length, 2)), range.points);

	return values.map((value, index) => ({
		label: range.labels[index] ?? `P${index + 1}`,
		value: Math.round(value),
	}));
}

function getTickValues(maxValue) {
	return Array.from({ length: GRID_STEPS + 1 }, (_, index) => maxValue - (maxValue / GRID_STEPS) * index);
}

function MetricBarChart({ probe, metric, timeRanges = DEFAULT_TIME_RANGES, dateRange }) {
	const isCustomRange = Boolean(dateRange?.start || dateRange?.end);
	const [selectedRange, setSelectedRange] = useState(timeRanges[1]?.key ?? timeRanges[0]?.key ?? '24h');
	const hasHistoryData = Array.isArray(probe?.history)
		&& probe.history.some((point) => Number.isFinite(Number(point?.[metric.key])));

	const series = useMemo(() => {
		if (isCustomRange && hasHistoryData) {
			const source = probe.history;
			const points = Math.min(source.length, 24);
			const values = resample(source.map(p => normalizeMetricValue(metric, p?.[metric.key])), points);
			
			const labelSource = source.map(p => {
				const parts = String(p.timestamp || '').split(' ');
				if (parts.length === 2) {
					const dateParts = parts[0].split('-');
					return `${dateParts[1] || ''}-${dateParts[2] || ''} ${parts[1]}`;
				}
				return p.timestamp || '';
			});
			
			const labels = [];
			for (let i = 0; i < points; i++) {
				if (points === 1) {
					labels.push(labelSource[0]);
				} else if (points === labelSource.length) {
					labels.push(labelSource[i]);
				} else {
					const position = (i / (points - 1)) * (labelSource.length - 1);
					labels.push(labelSource[Math.round(position)]);
				}
			}

			return values.map((value, index) => ({
				label: labels[index] || `P${index+1}`,
				value: Math.round(value)
			}));
		}

		return buildSeries(probe?.history, metric, selectedRange, timeRanges);
	}, [probe?.history, metric, selectedRange, timeRanges, isCustomRange, hasHistoryData]);

	const plotWidth = SVG_WIDTH - MARGIN.left - MARGIN.right;
	const plotHeight = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
	const barGap = 10;
	const barWidth = Math.max(10, (plotWidth - barGap * (series.length - 1)) / series.length);
	const chartMax = metric.maxValue;
	const yTicks = getTickValues(chartMax);
	const chartScale = plotHeight / chartMax;

	return (
		<article className="chart-card chart-card--bar">
			<div className="chart-card__header">
				<div>
					<span className="section-label">History</span>
					<h3>{metric.label}</h3>
				</div>
				<span className="chart-card__unit">{metric.unit}</span>
			</div>

			{isCustomRange ? (
				<div className="chart-toggle-group">
					<span style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', color: 'var(--text-light)', background: '#f0f0f0', borderRadius: '4px' }}>
						Custom Range Active
					</span>
				</div>
			) : (
				<div className="chart-toggle-group" role="tablist" aria-label={`${metric.label} time range`}>
					{timeRanges.map((range) => (
						<button
							key={range.key}
							type="button"
							className={`chart-toggle ${selectedRange === range.key ? 'is-active' : ''}`}
							onClick={() => setSelectedRange(range.key)}
							role="tab"
							aria-selected={selectedRange === range.key}
						>
							{range.label}
						</button>
					))}
				</div>
			)}

			<svg
				className="bar-chart-svg"
				viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
				role="img"
				aria-label={`${metric.label} bar chart for ${selectedRange}`}
			>
				<rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} rx="14" fill="#f7f8f5" />
				{!hasHistoryData && (
					<text
						x={SVG_WIDTH / 2}
						y={SVG_HEIGHT / 2}
						textAnchor="middle"
						dominantBaseline="middle"
						fill="#5d7387"
						fontSize="14"
						fontWeight="600"
					>
						No historical data from API yet
					</text>
				)}

				<g className="bar-chart-grid">
					{yTicks.map((tick) => {
						const y = MARGIN.top + plotHeight - tick * chartScale;
						return (
							<g key={tick}>
								<line
									x1={MARGIN.left}
									y1={y}
									x2={SVG_WIDTH - MARGIN.right}
									y2={y}
									className={tick === 0 ? 'bar-chart-grid__line bar-chart-grid__line--base' : 'bar-chart-grid__line'}
								/>
								<text x={MARGIN.left - 8} y={y + 4} textAnchor="end" className="bar-chart-axis__y-label">
									{Math.round(tick)}
								</text>
							</g>
						);
					})}
				</g>

				<line
					x1={MARGIN.left}
					y1={MARGIN.top}
					x2={MARGIN.left}
					y2={MARGIN.top + plotHeight}
					className="bar-chart-axis__line"
				/>
				<line
					x1={MARGIN.left}
					y1={MARGIN.top + plotHeight}
					x2={SVG_WIDTH - MARGIN.right}
					y2={MARGIN.top + plotHeight}
					className="bar-chart-axis__line"
				/>

				<g className="bar-chart-x-grid">
					{series.map((entry, index) => {
						const x = MARGIN.left + index * (barWidth + barGap) + barWidth / 2;
						return (
							<line
								key={`grid-${metric.key}-${selectedRange}-${entry.label}`}
								x1={x}
								y1={MARGIN.top}
								x2={x}
								y2={MARGIN.top + plotHeight}
								className="bar-chart-grid__vertical"
							/>
						);
					})}
				</g>

				<g className="bar-chart-bars">
					{series.map((entry, index) => {
						const barHeight = entry.value <= 0 ? 0 : Math.max(6, entry.value * chartScale);
						const x = MARGIN.left + index * (barWidth + barGap);
						const y = MARGIN.top + plotHeight - barHeight;

						return (
							<g key={`${metric.key}-${selectedRange}-${entry.label}`}>
								<rect
									x={x}
									y={y}
									width={barWidth}
									height={barHeight}
									rx="3"
									fill={metric.color}
									className="bar-chart-bar"
								/>
								<text
									x={x + barWidth / 2}
									y={SVG_HEIGHT - 24}
									textAnchor="middle"
									transform={`rotate(-45 ${x + barWidth / 2} ${SVG_HEIGHT - 24})`}
									className="bar-chart-axis__x-label"
								>
									{entry.label}
								</text>
							</g>
						);
					})}
				</g>
			</svg>
		</article>
	);
}

export default function AnalyticsCharts({ probe, dateRange }) {
	if (!probe) {
		return (
			<section className="panel-card panel-card--analytics panel-card--empty">
				<div className="panel-card__title-row">
					<div>
						<span className="section-label">Analytics</span>
						<h2 className="panel-card__title">No probe selected</h2>
					</div>
				</div>
				<p className="empty-state">Select a probe to review rainfall and moisture history for 1h, 24h, and 7days.</p>
			</section>
		);
	}

	const [metrics, setMetrics] = useState(DEFAULT_METRICS);
	const [timeRanges, setTimeRanges] = useState(DEFAULT_TIME_RANGES);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const cfg = await getAnalyticsConfig();
				if (!active) return;
				setMetrics(cfg.metrics ?? DEFAULT_METRICS);
				setTimeRanges(cfg.timeRanges ?? DEFAULT_TIME_RANGES);
			} catch (e) {
				// keep defaults
			}
		})();
		return () => { active = false; };
	}, []);

	return (
		<section className="panel-card panel-card--analytics">
			<div className="panel-card__title-row">
				<div>
					<span className="section-label">Historical analytics</span>
					<h2 className="panel-card__title">Rainfall and moisture history for {probe.id}</h2>
				</div>
			</div>

			<div className="charts-grid">
				{metrics.map((metric) => (
					<MetricBarChart key={metric.key} metric={metric} probe={probe} timeRanges={timeRanges} dateRange={dateRange} />
				))}
			</div>
		</section>
	);
}