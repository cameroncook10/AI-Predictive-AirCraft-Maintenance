import { useState, useEffect, useRef } from 'react';

export default function LiveEndoscope() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [stream, setStream] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [snapshots, setSnapshots] = useState([]);

  // Fetch available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
        const devList = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devList.filter(d => d.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        setErrorMsg('Camera access denied or no devices found.');
        console.error(err);
      }
    };
    getDevices();
  }, []);

  // Initialize camera stream when device ID changes
  useEffect(() => {
    if (!selectedDeviceId) return;

    let activeStream = null;

    const startStream = async () => {
      try {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } }
        });
        
        activeStream = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        // Check if torch (light) is supported
        const track = newStream.getVideoTracks()[0];
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.torch !== undefined) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
        setTorchOn(false);
        setErrorMsg('');
      } catch (err) {
        setErrorMsg('Failed to start camera stream.');
        console.error(err);
      }
    };

    startStream();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [selectedDeviceId]);

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }]
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Torch toggle failed', err);
      // Fallback for UI if hardware doesn't comply but API exists
      setErrorMsg('Torch control not supported by this camera hardware.');
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setSnapshots(prev => [{ id: Date.now(), url: dataUrl }, ...prev]);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controls Bar */}
      <div className="camera-status" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="cam-stat-label">Source</span>
          <select 
            className="cam-stat-value"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: '#fff', padding: '5px' }}
            value={selectedDeviceId} 
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId} style={{ background: 'var(--bg)' }}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`cam-btn ${torchSupported ? (torchOn ? 'active' : '') : ''}`} 
            onClick={toggleTorch}
            disabled={!torchSupported}
            style={{ opacity: torchSupported ? 1 : 0.5 }}
          >
            {torchSupported ? (torchOn ? '💡 LIGHT OFF' : '💡 LIGHT ON') : '💡 NO LIGHT CTL'}
          </button>
          <button className="cam-btn active" onClick={takeSnapshot}>
            📷 SNAPSHOT
          </button>
        </div>
      </div>

      {errorMsg && <div className="alert-item critical" style={{ marginBottom: 0 }}>{errorMsg}</div>}

      {/* Video Viewer */}
      <div className="camera-viewer">
        <div className="camera-feed">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div className="camera-crosshair" />
          <div className="camera-overlay">
            <span>LIVE ● ENDOSCOPE FEED</span>
            <span>{torchOn ? 'TORCH: ACTIVE' : 'TORCH: OFF'}</span>
          </div>
          <div className="camera-overlay-right">
            <span>{snapshots.length} Finding{snapshots.length !== 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--blue)' }}>USB UVC</span>
          </div>
        </div>
      </div>
      
      {/* Hidden canvas for snapshots */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Snapshots Gallery */}
      {snapshots.length > 0 && (
        <>
          <div className="section-title">Inspection Findings (Snapshots)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
            {snapshots.map(snap => (
              <div key={snap.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--card-bg)' }}>
                <img src={snap.url} alt="Finding" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '8px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                  {new Date(snap.id).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
