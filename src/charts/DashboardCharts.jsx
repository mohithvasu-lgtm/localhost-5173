import { Pie, Bar, Line } from 'react-chartjs-2'
import { baseChartOptions, chartPalette } from './chartConfig'

export function GoalDistributionChart({ data }) {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((item, index) => item.color || chartPalette[index % chartPalette.length]),
        borderWidth: 0,
      },
    ],
  }

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
        },
      },
    },
  }

  return <Pie data={chartData} options={options} />
}

export function TeamTaskBarChart({ data }) {
  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: 'Tasks',
        data: data.map((item) => item.value),
        backgroundColor: '#01696f',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  }

  return <Bar data={chartData} options={options} />
}

export function WeeklyTrendLineChart({ labels, values }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Tasks Logged',
        data: values,
        borderColor: '#01696f',
        backgroundColor: 'rgba(1, 105, 111, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
    ],
  }

  const options = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  }

  return <Line data={chartData} options={options} />
}