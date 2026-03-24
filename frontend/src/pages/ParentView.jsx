import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { useSocket } from '../context/SocketContext';
import ParentAttendance from '../components/Attendance/ParentAttendance';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ParentView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = L.divIcon({
  className: '',
  html: `<div style="background:linear-gradient(135deg,#1a0533,#6b0f1a);color:white;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.4);">🚌</div>`,
  iconSize: [38, 38], iconAnchor: [19, 19],
});

const stopIcon = (num, isCurrent, isDone) => L.divIcon({
  className: '',
  html: `<div style="background:${isDone ? '#22c55e' : isCurrent ? '#f59e0b' : '#7c3aed'};color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${isDone ? '✓' : num}</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13],
});

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => { map.setView(position, map.getZoom()); }, [position, map]);
  return null;
};

const ParentView = () => {
  const [busLocation, setBusLocation] = useState([28.6139, 77.2090]);
  const [busStatus, setBusStatus] = useState('Waiting...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stops, setStops] = useState([]);
  const [stopInfo, setStopInfo] = useState(null); // current/next stop
  const [showStops, setShowStops] = useState(true);
  const socket = useSocket();

  const busId = 'BUS_01';
  const busDbId = 3;

  // Stops fetch
  useEffect(() => {
    const fetchStops = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/stops/bus/${busDbId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStops(res.data);
      } catch (err) { console.error('Stops fetch error:', err); }
    };
    fetchStops();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('getLastLocation', { busId });

    socket.on('locationUpdate', (data) => {
      if (data.busId === busId) {
        setBusLocation([data.lat, data.lng]);
        setLastUpdated(new Date().toLocaleTimeString());
        setBusStatus('Live');
      }
    });

    socket.on('busStatusUpdate', (data) => {
      if (data.busId === busId) setBusStatus(data.status);
    });

    // ← Naya: Stop updates suno
    socket.on('stopUpdate', (data) => {
      if (data.busId === busId) setStopInfo(data);
    });

    return () => {
      socket.off('locationUpdate');
      socket.off('busStatusUpdate');
      socket.off('stopUpdate');
    };
  }, [socket]);

  const routePolyline = stops.map(s => [parseFloat(s.stop_lat), parseFloat(s.stop_lng)]);

  return (
    <div className="parent-view-container">

      {/* Header */}
      <div className="parent-header-new">
        <div>
          <h2 className="parent-title">Bus Live Tracking</h2>
          <p className="parent-subtitle">Real-time location of your child's bus</p>
        </div>
        <div className="header-right">
          <div className="bus-info-pill">Bus: <strong>{busId}</strong></div>
          <button className={`toggle-stops-btn ${showStops ? 'active' : ''}`} onClick={() => setShowStops(!showStops)}>
            {showStops ? '🗺️ Hide Stops' : '📍 Show Stops'}
          </button>
        </div>
      </div>

      {/* ── Stop Status Banner ─────────────────── */}
      {stopInfo && stopInfo.totalStops > 0 && (
        <div className="stop-status-banner">
          <div className="stop-status-current">
            <span className="stop-status-label">📍 Bus is at</span>
            <span className="stop-status-name">{stopInfo.currentStop}</span>
          </div>
          {stopInfo.nextStop && (
            <>
              <div className="stop-status-arrow">→</div>
              <div className="stop-status-next">
                <span className="stop-status-label">⏭️ Coming to</span>
                <span className="stop-status-name next">{stopInfo.nextStop}</span>
              </div>
            </>
          )}
          {!stopInfo.nextStop && (
            <div className="stop-status-done">🏁 Last stop reached!</div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="parent-map-container">
        <div className="map-status-badge">
          <div className={`live-dot ${busStatus === 'Live' ? 'dot-live' : 'dot-idle'}`}></div>
          <span className="status-text-bold">{busStatus === 'Live' ? 'LIVE' : busStatus.toUpperCase()}</span>
        </div>
        {lastUpdated && <div className="last-updated-badge">🕐 {lastUpdated}</div>}

        <MapContainer center={busLocation} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={busLocation} icon={busIcon}>
            <Popup>🚌 Bus {busId}</Popup>
          </Marker>

          {showStops && stops.map((stop, i) => {
            const isCurrent = stopInfo?.currentStop === stop.stop_name;
            const isDone = stopInfo ? i < stopInfo.currentStopIndex : false;
            return (
              <Marker
                key={stop.id}
                position={[parseFloat(stop.stop_lat), parseFloat(stop.stop_lng)]}
                icon={stopIcon(i + 1, isCurrent, isDone)}
              >
                <Popup>
                  <strong>#{i+1} {stop.stop_name}</strong>
                  {isCurrent && <span style={{color:'#f59e0b',fontWeight:700}}> ← Bus Here</span>}
                </Popup>
              </Marker>
            );
          })}

          {showStops && routePolyline.length > 1 && (
            <Polyline positions={routePolyline} color="#7c3aed" weight={2} dashArray="6,4" opacity={0.6} />
          )}

          <RecenterMap position={busLocation} />
        </MapContainer>
      </div>

      {/* Stops Timeline */}
      {showStops && stops.length > 0 && (
        <div className="stops-timeline-card">
          <p className="stops-timeline-title">🗺️ Route Timeline</p>
          <div className="stops-timeline-row">
            {stops.map((stop, i) => {
              const isCurrent = stopInfo?.currentStop === stop.stop_name;
              const isDone = stopInfo ? i < stopInfo.currentStopIndex : false;
              return (
                <React.Fragment key={stop.id}>
                  <div className={`timeline-item ${isDone ? 'tl-done' : isCurrent ? 'tl-current' : 'tl-upcoming'}`}>
                    <div className="tl-dot">{isDone ? '✓' : i + 1}</div>
                    <span className="tl-name">{stop.stop_name}</span>
                  </div>
                  {i < stops.length - 1 && <div className={`tl-line ${isDone ? 'tl-line-done' : ''}`}></div>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* ETA + Attendance */}
      <ParentAttendance busId={busDbId} />

    </div>
  );
};

export default ParentView;
