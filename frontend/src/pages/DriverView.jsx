import React, { useState, useEffect } from 'react';
import useLocation from '../hooks/useLocation';
import { useSocket } from '../context/SocketContext';
import DriverAttendance from '../components/Attendance/DriverAttendance';
import axios from 'axios';
import './DriverView.css';

const DriverView = () => {
  const [isTripStarted, setIsTripStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tripInfo, setTripInfo] = useState(null); // current/next stop info
  const { location, error } = useLocation(isTripStarted);
  const socket = useSocket();

  const busId = localStorage.getItem('busId') || 'BUS_01';
  const busDbId = 3; // MySQL buses table ka id

  // Stop updates suno
  useEffect(() => {
    if (!socket) return;
    socket.on('stopUpdate', (data) => {
      if (data.busId === busId) {
        setTripInfo(data);
      }
    });
    return () => socket.off('stopUpdate');
  }, [socket]);

  const toggleTrip = async () => {
    setLoading(true);
    const newStatus = !isTripStarted ? 'On Trip' : 'Parked';
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/buses/update-status',
        { busId, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!isTripStarted) {
        // busDbId bhi bhejo — route simulation ke liye
        socket?.emit('tripStarted', {
          busId,
          busDbId,
          lat: location.lat,
          lng: location.lng,
        });
        setTripInfo(null);
      } else {
        socket?.emit('tripStopped', { busId });
        setTripInfo(null);
      }

      setIsTripStarted(!isTripStarted);
    } catch (err) {
      alert('Status update fail! Check internet.');
    } finally {
      setLoading(false);
    }
  };

  // Real GPS location update
  useEffect(() => {
    if (isTripStarted && location.lat && location.lng && socket) {
      socket.emit('updateLocation', { busId, lat: location.lat, lng: location.lng });
    }
  }, [location, isTripStarted, socket, busId]);

  const progressPercent = tripInfo
    ? Math.round(((tripInfo.currentStopIndex + 1) / tripInfo.totalStops) * 100)
    : 0;

  return (
    <div className="driver-page-wrapper">

      {/* ── Trip Card ───────────────────────────── */}
      <div className="driver-container">
        <div className="driver-header">
          <h2 className="driver-title">Driver Dashboard</h2>
          <div className="bus-badge">Bus: {busId}</div>
        </div>

        <div className={`status-indicator ${isTripStarted ? 'status-active' : 'status-idle'}`}>
          <span className={`status-dot ${isTripStarted ? 'dot-green' : 'dot-gray'}`}></span>
          {isTripStarted ? 'Trip Active — Broadcasting Location' : 'Idle — Trip not started'}
        </div>

        <button
          onClick={toggleTrip}
          disabled={loading}
          className={`trip-button ${isTripStarted ? 'btn-stop' : 'btn-start'} ${loading ? 'btn-loading' : ''}`}
        >
          {loading ? '⏳ Please wait...' : isTripStarted ? '🛑 Stop Trip' : '🚌 Start Trip'}
        </button>

        {/* ── Route Progress ────────────────────── */}
        {isTripStarted && tripInfo && tripInfo.totalStops > 0 && (
          <div className="route-progress-card">
            {/* Progress Bar */}
            <div className="progress-header">
              <span className="progress-label">Route Progress</span>
              <span className="progress-percent">{progressPercent}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>

            {/* Current / Next Stop */}
            <div className="stops-info">
              <div className="stop-info-item current-stop-info">
                <span className="stop-info-label">📍 Current Stop</span>
                <span className="stop-info-name">{tripInfo.currentStop}</span>
              </div>
              {tripInfo.nextStop && (
                <div className="stop-arrow">→</div>
              )}
              {tripInfo.nextStop && (
                <div className="stop-info-item next-stop-info">
                  <span className="stop-info-label">⏭️ Next Stop</span>
                  <span className="stop-info-name">{tripInfo.nextStop}</span>
                </div>
              )}
            </div>

            {/* All Stops Timeline */}
            <div className="stops-timeline">
              {tripInfo.allStops?.map((stop, i) => (
                <div key={i} className={`timeline-stop ${
                  i < tripInfo.currentStopIndex ? 'stop-done' :
                  i === tripInfo.currentStopIndex ? 'stop-current' : 'stop-upcoming'
                }`}>
                  <div className="timeline-dot"></div>
                  <span className="timeline-name">{stop}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isTripStarted && (
          <div className="tracking-active">
            <p className="tracking-status">
              <span className="live-pulse"></span>
              Tracking Live...
            </p>
            {location.lat ? (
              <div className="coord-display">
                <div className="coord-item">
                  <span className="coord-label">Latitude</span>
                  <span className="coord-value">{location.lat.toFixed(6)}</span>
                </div>
                <div className="coord-item">
                  <span className="coord-label">Longitude</span>
                  <span className="coord-value">{location.lng.toFixed(6)}</span>
                </div>
              </div>
            ) : (
              <p className="gps-waiting">📡 GPS signal dhundh raha hai...</p>
            )}
          </div>
        )}

        {error && <p className="error-msg">⚠️ {error}</p>}

        <p className="driver-tip">
          {isTripStarted
            ? '✅ Route simulation chal rahi hai — phone band ho toh bhi location update hoti rahegi!'
            : 'Start Trip dabao — backend automatically route simulate karega.'}
        </p>
      </div>

      {/* ── Attendance ──────────────────────────── */}
      <DriverAttendance busId={busDbId} />

    </div>
  );
};

export default DriverView;
