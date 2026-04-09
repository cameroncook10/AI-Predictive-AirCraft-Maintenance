import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function PredictionChart({ predictions }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!predictions || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const datasets = predictions.datasets.map((d) => ({
      label: d.label,
      data: d.data,
      borderColor: d.color,
      backgroundColor: 'transparent',
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: d.color,
      pointBorderColor: 'transparent',
      pointHoverRadius: 5,
      pointHoverBackgroundColor: d.color,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 1,
      tension: 0.35,
    }));

    datasets.push({
      label: 'Threshold',
      data: Array(predictions.labels.length).fill(85),
      borderColor: '#3a3c48',
      borderDash: [5, 4],
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: predictions.labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeInOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16171f',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            titleColor: '#e4e5ec',
            bodyColor: '#6b6e7e',
            titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
            cornerRadius: 8,
            callbacks: {
              label: (c) => `${c.dataset.label}: ${c.raw}%`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: '#6b6e7e',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
              callback: (v) => v + '%',
            },
            grid: { color: 'rgba(255,255,255,0.03)' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
          x: {
            ticks: {
              color: '#6b6e7e',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
            },
            grid: { color: 'rgba(255,255,255,0.03)' },
            border: { color: 'rgba(255,255,255,0.06)' },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [predictions]);

  if (!predictions) return null;

  return (
    <div className="fade-in">
      <div className="chart-legend">
        {predictions.datasets.map((d, i) => (
          <div className="leg-item" key={i}>
            <div className="leg-line" style={{ background: d.color }} />
            {d.label}
          </div>
        ))}
        <div className="leg-item">
          <div
            className="leg-line"
            style={{
              background: 'none',
              borderTop: '1.5px dashed #3a3c48',
              height: 0,
            }}
          />
          Threshold
        </div>
      </div>
      <div style={{ position: 'relative', height: 280 }}>
        <canvas ref={canvasRef} />
      </div>
      <div className="chart-note">
        Dashed line = 85% mandatory maintenance threshold · AI model trained on 2.1M sensor points
      </div>
    </div>
  );
}
