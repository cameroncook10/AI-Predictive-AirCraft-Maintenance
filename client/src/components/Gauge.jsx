export default function Gauge({ value }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const arc = (value / 100) * circ;
  const col = value < 60 ? '#e84040' : value < 80 ? '#f5a623' : '#22c87a';

  return (
    <svg width="46" height="46" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3.5" />
      <circle
        cx="23" cy="23" r={r}
        fill="none" stroke={col} strokeWidth="3.5"
        strokeDasharray={`${arc.toFixed(1)} ${circ.toFixed(1)}`}
        strokeLinecap="round"
        transform="rotate(-90 23 23)"
      />
      <text
        x="23" y="27"
        textAnchor="middle"
        fontSize="10" fontWeight="600"
        fill={col}
        fontFamily="'IBM Plex Mono',monospace"
      >
        {value}
      </text>
    </svg>
  );
}
