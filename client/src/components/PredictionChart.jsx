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
      tension: 0.35,
    }));

    datasets.push({
      label: 'Threshold',
      data: Array(predictions.labels.length).fill(85),
      borderColor: '#6b6e7a',
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
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1b1f',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#e8e9ee',
            bodyColor: '#6b6e7a',
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
              color: '#6b6e7a',
              font: { size: 10, family: "'IBM Plex Mono',monospace" },
              callback: (v) => v + '%',
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' },
          },
          x: {
            ticks: {
              color: '#6b6e7a',
              font: { size: 10, family: "'IBM Plex Mono',monospace" },
            },
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { color: 'rgba(255,255,255,0.08)' },
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
    <>
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
              borderTop: '1.5px dashed #6b6e7a',
              height: 0,
            }}
          />
          Threshold
        </div>
      </div>
      <div style={{ position: 'relative', height: 260 }}>
        <canvas ref={canvasRef} />
      </div>
      <div className="chart-note">
        Dashed line = 85% mandatory maintenance threshold &middot; AI model trained on 2.1M sensor points
      </div>
    </>
  );
}
