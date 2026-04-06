import { useState, useEffect, useCallback } from 'react';
import { fetchFleet, fetchMetrics, fetchAircraft, fetchCamera, fetchInspections, toggleInspectionItem } from './api';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  const [fleet, setFleet] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [cameraData, setCameraData] = useState(null);
  const [inspections, setInspections] = useState(null);

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

  const loadCamera = useCallback(async (tail) => {
    const data = await fetchCamera(tail);
    setCameraData(data);
  }, []);

  const loadInspections = useCallback(async (tail) => {
    const data = await fetchInspections(tail);
    setInspections(data.checklist);
  }, []);

  useEffect(() => {
    if (selected) {
      loadAircraft(selected);
      loadCamera(selected);
      loadInspections(selected);
    }
  }, [selected, loadAircraft, loadCamera, loadInspections]);

  const handleSelect = (tail) => setSelected(tail);

  const refreshAircraft = () => {
    if (selected) {
      loadAircraft(selected);
      loadCamera(selected);
      loadInspections(selected);
    }
  };

  const refreshAll = async () => {
    const [f, m] = await Promise.all([fetchFleet(), fetchMetrics()]);
    setFleet(f);
    setMetrics(m);
    if (selected) refreshAircraft();
  };

  const handleToggleInspection = async (itemId) => {
    if (!selected) return;
    await toggleInspectionItem(selected, itemId);
    loadInspections(selected);
  };

  return (
    <div className="shell">
      <Topbar aircraft={aircraft} />
      <div className="main">
        <Sidebar
          fleet={fleet}
          metrics={metrics}
          selected={selected}
          onSelect={handleSelect}
          activeView={activeView}
          onViewChange={setActiveView}
        />
        <CenterPanel
          aircraft={aircraft}
          activeView={activeView}
          cameraData={cameraData}
          inspections={inspections}
          onRefresh={refreshAircraft}
          onRefreshAll={refreshAll}
          onToggleInspection={handleToggleInspection}
        />
        <RightPanel aircraft={aircraft} />
      </div>
    </div>
  );
}
