// components/Attendance/ParentAttendance.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, MapPin, RefreshCw } from 'lucide-react';
import './ParentAttendance.css';

const ParentAttendance = ({ busId }) => {
    const [eta, setEta] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [etaLoading, setEtaLoading] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    // Attendance history fetch
    const fetchAttendance = async () => {
        try {
            const res = await axios.get(
                'http://localhost:5000/api/attendance/my-child',
                { headers }
            );
            setAttendance(res.data.records);
        } catch (err) {
            console.error('Attendance fetch error:', err);
        }
    };

    // ETA fetch
    const fetchETA = async () => {
        if (!busId) return;
        setEtaLoading(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/attendance/eta/${busId}`,
                { headers }
            );
            setEta(res.data);
        } catch (err) {
            console.error('ETA fetch error:', err);
        } finally {
            setEtaLoading(false);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            await Promise.all([fetchAttendance(), fetchETA()]);
            setLoading(false);
        };
        loadAll();

        // Har 30 seconds mein ETA refresh karo
        const interval = setInterval(fetchETA, 30000);
        return () => clearInterval(interval);
    }, [busId]);

    return (
        <div className="parent-att-container">

            {/* ── ETA CARD ─────────────────────────────── */}
            <div className="eta-card">
                <div className="eta-card-header">
                    <h3><Clock size={18} /> Bus Arrival ETA</h3>
                    <button className="refresh-btn" onClick={fetchETA} disabled={etaLoading}>
                        <RefreshCw size={14} className={etaLoading ? 'spinning' : ''} />
                    </button>
                </div>

                {etaLoading ? (
                    <p className="eta-loading">Calculating...</p>
                ) : eta?.nearest_stop ? (
                    <div className="eta-content">
                        {/* Main ETA display */}
                        <div className="eta-main">
                            <div className="eta-minutes">
                                {eta.nearest_stop.eta_minutes <= 1
                                    ? '🎉'
                                    : eta.nearest_stop.eta_minutes}
                            </div>
                            <div className="eta-label">
                                {eta.nearest_stop.eta_text}
                            </div>
                        </div>

                        {/* Stop info */}
                        <div className="eta-stop-info">
                            <MapPin size={14} />
                            <span>Next: <strong>{eta.nearest_stop.stop_name}</strong></span>
                            <span className="eta-distance">
                                ({eta.nearest_stop.distance_km} km)
                            </span>
                        </div>

                        {/* All stops ETA */}
                        <div className="all-stops-eta">
                            <p className="stops-label">All Stops:</p>
                            {eta.all_stops_eta?.map(stop => (
                                <div key={stop.stop_id} className="stop-eta-row">
                                    <span className="stop-order">#{stop.stop_order}</span>
                                    <span className="stop-name">{stop.stop_name}</span>
                                    <span className={`stop-time ${stop.eta_minutes <= 2 ? 'time-soon' : ''}`}>
                                        {stop.eta_text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="eta-offline">
                        <p>🚌 Bus abhi trip pe nahi hai</p>
                        <span>{eta?.msg}</span>
                    </div>
                )}
            </div>

            {/* ── ATTENDANCE HISTORY ────────────────────── */}
            <div className="att-history-card">
                <h3 className="att-history-title">
                    <CheckCircle size={18} /> Bachhe ki Attendance (Last 30 days)
                </h3>

                {loading ? (
                    <p className="eta-loading">Loading...</p>
                ) : attendance.length === 0 ? (
                    <p className="eta-loading">Koi attendance record nahi mila.</p>
                ) : (
                    <div className="att-history-list">
                        {attendance.map((record, i) => (
                            <div key={i} className="att-history-row">
                                <div className="att-date">
                                    {new Date(record.trip_date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short'
                                    })}
                                </div>
                                <div className="att-student">{record.student_name}</div>
                                <div className={`att-status ${record.is_present ? 'present' : 'absent'}`}>
                                    {record.is_present
                                        ? <><CheckCircle size={14} /> Present</>
                                        : <><XCircle size={14} /> Absent</>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default ParentAttendance;
