import React from 'react';
import {
  AreaChart,
  Area,
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
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`colorMoisture-${probe.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id={`colorRainfall-${probe.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id={`colorVibration-${probe.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="moisture" 
            name="Soil Moisture (%)"
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#colorMoisture-${probe.id})`} 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
          />
          <Area 
            type="monotone" 
            dataKey="rainfall" 
            name="Rainfall (mm)"
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#colorRainfall-${probe.id})`} 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
          />
          <Area 
            type="monotone" 
            dataKey="vibration" 
            name="Vibration Mag"
            stroke="#f59e0b" 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#colorVibration-${probe.id})`} 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
