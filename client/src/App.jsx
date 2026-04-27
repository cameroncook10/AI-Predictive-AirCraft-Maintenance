import { useState, useEffect, useCallback } from 'react';
import { fetchFleet, fetchMetrics, fetchAircraft, fetchCamera, fetchInspections, toggleInspectionItem } from './api';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import AIAssistant from './components/AIAssistant';

export default function App() {
  const [fleet, setFleet] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selected, setSelected] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [cameraData, setCameraData] = useState(null);
  const [inspections, setInspections] = useState(null);
  const [exteriorZonePhotos, setExteriorZonePhotos] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);

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
    setExteriorZonePhotos(data.exterior_zone_photos || []);
  }, []);

  useEffect(() => {
    if (selected) {
      loadAircraft(selected);
      loadCamera(selected);
      loadInspections(selected);
    }
  }, [selected, loadAircraft, loadCamera, loadInspections]);

  /** While Exterior capture or Ground Inspection is open, keep camera + zone photos in sync with remote/phone. */
  useEffect(() => {
    if (!selected) return;
    if (activeView !== 'camera' && activeView !== 'inspections') return;

    const LIVE_POLL_MS = 1500;

    const pullZoneData = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void loadCamera(selected);
      void loadInspections(selected);
    };
    pullZoneData();
    const id = setInterval(pullZoneData, LIVE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') pullZoneData();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }
    return () => {
      clearInterval(id);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [selected, activeView, loadCamera, loadInspections]);

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
          exteriorZonePhotos={exteriorZonePhotos}
          onRefresh={refreshAircraft}
          onRefreshAll={refreshAll}
          onToggleInspection={handleToggleInspection}
        />
        <RightPanel aircraft={aircraft} />
      </div>
      <AIAssistant
        aircraft={aircraft}
        isOpen={aiOpen}
        onToggle={() => setAiOpen((o) => !o)}
      />
    </div>
  );
}
