import { useState, useEffect } from 'react';

export default function Topbar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        n.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' \u00B7 ' +
        n.toLocaleTimeString('en-US', { hour12: false })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </div>
        <div>
          <div className="topbar-title">AeroMind</div>
          <div className="topbar-sub">Boeing AI Predictive Maintenance &middot; LSTM + GBT Model</div>
        </div>
      </div>
      <div className="topbar-right">
        <span className="live-pill">
          <span className="live-dot" />
          LIVE
        </span>
        <span className="topbar-time">{time}</span>
      </div>
    </header>
  );
}
