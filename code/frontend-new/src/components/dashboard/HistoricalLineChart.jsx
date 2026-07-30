import React from 'react';
import {
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function HistoricalLineChart({ probe }) {
  if (!probe || !probe.history || probe.history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
        No historical data available for {probe?.id || 'this probe'}.
      </div>
    );
  }

  // Reverse history so oldest is on the left, newest on the right
  const chartData = [...probe.history].reverse();

  return (
    <div className="historical-chart-container" style={{ width: '100%', height: 320, marginTop: '1rem', padding: '1rem 0' }}>
      <ResponsiveContainer>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis 
            dataKey="label" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              backdropFilter: 'blur(8px)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              color: '#1e293b',
              fontWeight: 500,
              padding: '12px'
            }}
            itemStyle={{
              padding: '4px 0',
              fontWeight: 600
            }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }}/>
          <Scatter 
            dataKey="moisture" 
            name="Soil Moisture (%)"
            fill="#3b82f6" 
          />
          <Scatter 
            dataKey="rainfall" 
            name="Rainfall (mm)"
            fill="#10b981" 
          />
          <Scatter 
            dataKey="vibration" 
            name="Vibration Mag"
            fill="#f59e0b" 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
