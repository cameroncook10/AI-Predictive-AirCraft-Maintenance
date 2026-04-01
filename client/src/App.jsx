import { useState, useEffect, useCallback } from 'react';
import { fetchFleet, fetchMetrics, fetchAircraft } from './api';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  const [fleet, setFleet] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [aircraft, setAircraft] = useState(null);

  useEffect(() => {
    Promise.all([fetchFleet(), fetchMetrics()]).then(([f, m]) => {
      setFleet(f);
      setMetrics(m);
      if (f.length > 0) setSelected(f[0].tailNumber);
    });
  }, []);

  const loadAircraft = useCallback(async (tail) => {
    const data = await fetchAircraft(tail);
    setAircraft(data);
  }, []);

  useEffect(() => {
    if (selected) loadAircraft(selected);
  }, [selected, loadAircraft]);

  const handleSelect = (tail) => setSelected(tail);

  const refreshAircraft = () => {
    if (selected) loadAircraft(selected);
  };

  const refreshAll = async () => {
    const [f, m] = await Promise.all([fetchFleet(), fetchMetrics()]);
    setFleet(f);
    setMetrics(m);
    if (selected) loadAircraft(selected);
  };

  return (
    <div className="shell">
      <Topbar />
      <div className="main">
        <Sidebar
          fleet={fleet}
          metrics={metrics}
          selected={selected}
          onSelect={handleSelect}
        />
        <CenterPanel
          aircraft={aircraft}
          onRefresh={refreshAircraft}
          onRefreshAll={refreshAll}
        />
        <RightPanel aircraft={aircraft} />
      </div>
    </div>
  );
}
