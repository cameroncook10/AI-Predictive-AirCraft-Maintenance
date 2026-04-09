export default function Gauge({ value }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const arc = (value / 100) * circ;
  const col = value < 60 ? '#ff4757' : value < 80 ? '#ffb020' : '#00d68f';

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
      <circle
        cx="24" cy="24" r={r}
        fill="none" stroke={col} strokeWidth="3.5"
        strokeDasharray={`${arc.toFixed(1)} ${circ.toFixed(1)}`}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        style={{ filter: `drop-shadow(0 0 4px ${col}40)`, transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x="24" y="28"
        textAnchor="middle"
        fontSize="11" fontWeight="700"
        fill={col}
        fontFamily="'JetBrains Mono',monospace"
      >
        {value}
      </text>
    </svg>
  );
}
