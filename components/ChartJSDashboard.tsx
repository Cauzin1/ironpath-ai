// components/ChartJSDashboard.tsx
import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const ChartJSDashboard = ({ data }) => {
  const strengthChartData = {
    labels: data.strengthData.map(d => d.week),
    datasets: [
      {
        label: 'Agachamento',
        data: data.strengthData.map(d => d.squat),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
      },
      {
        label: 'Supino',
        data: data.strengthData.map(d => d.bench),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
      {
        label: 'Lev. Terra',
        data: data.strengthData.map(d => d.deadlift),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
      }
    ]
  };

  return (
    <div className="p-4">
      <Line data={strengthChartData} options={{ responsive: true }} />
    </div>
  );
};