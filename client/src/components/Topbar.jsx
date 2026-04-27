import { useState, useEffect } from 'react';

export default function Topbar({ aircraft }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        n.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' · ' +
        n.toLocaleTimeString('en-US', { hour12: false })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const getShift = () => {
    const h = new Date().getHours();
    if (h >= 6 && h < 14) return 'DAY SHIFT';
    if (h >= 14 && h < 22) return 'SWING SHIFT';
    return 'NIGHT SHIFT';
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <div>
          <div className="topbar-title">AeroMind Ground Ops</div>
          <div className="topbar-sub">Maintenance Engineering Platform</div>
        </div>
      </div>

      <div className="topbar-center">
        {aircraft && (
          <>
            <span className="topbar-bay">
              <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>
              {aircraft.bayLocation}
            </span>
            <span className="topbar-mechanic">
              <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              {aircraft.assignedMechanic}
            </span>
          </>
        )}
      </div>

      <div className="topbar-right">
        <span className="topbar-shift">{getShift()}</span>
        <span className="live-pill">
          <span className="live-dot" />
          LIVE
        </span>
        <span className="topbar-time">{time}</span>
      </div>
    </header>
  );
}
