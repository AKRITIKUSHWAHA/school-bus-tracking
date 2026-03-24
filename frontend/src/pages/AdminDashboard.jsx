import React, { useState, useEffect } from 'react';
import { Bus, MapPin, AlertCircle, Plus, X, Map as MapIcon, Navigation, GraduationCap, Route, Pencil, Trash2, Users } from 'lucide-react'; 
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import './AdminDashboard.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createStopIcon = (number) => L.divIcon({
  className: '',
  html: `<div style="background:linear-gradient(135deg,#3d0a4f,#6b0f1a);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${number}</div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

const AdminDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fleet'); // fleet | students

  const [showModal, setShowModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  const [selectedBus, setSelectedBus] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [stopData, setStopData] = useState({ stop_name: '', stop_lat: '', stop_lng: '', stop_order: 1 });
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'driver' });
  const [studentData, setStudentData] = useState({ name: '', parent_id: '', bus_id: '', stop_id: '' });
  const [stops, setStops] = useState([]);
  const [editStops, setEditStops] = useState([]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const stats = [
    { label: 'Total Buses', value: buses.length || '0', icon: <Bus size={20}/>, color: 'stat-blue' },
    { label: 'Active Trips', value: buses.filter(b => b.status === 'On Trip').length || '0', icon: <MapPin size={20}/>, color: 'stat-green' },
    { label: 'Students', value: students.length || '0', icon: <GraduationCap size={20}/>, color: 'stat-purple' },
    { label: 'Alerts', value: '02', icon: <AlertCircle size={20}/>, color: 'stat-red' },
  ];

  // ── Data Fetch ─────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [busRes, userRes, studentRes] = await Promise.all([
        axios.get('http://localhost:5000/api/buses', { headers }),
        axios.get('http://localhost:5000/api/auth/all-users', { headers }),
        axios.get('http://localhost:5000/api/attendance/students', { headers }),
      ]);
      setBuses(busRes.data);
      setUsers(userRes.data);
      setStudents(studentRes.data.students || []);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchStopsForBus = async (busId, setterFn) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/stops/bus/${busId}`, { headers });
      setterFn(res.data);
    } catch (err) { setterFn([]); }
  };

  // ── Route Modal ────────────────────────────────────────────────
  const openRouteModal = async (bus) => {
    setSelectedBus(bus);
    setShowRouteModal(true);
    setRouteLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/stops/bus/${bus.id}`, { headers });
      setRouteStops(res.data);
    } catch (err) { setRouteStops([]); }
    finally { setRouteLoading(false); }
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = formData.role === 'driver' ? '/auth/register-driver' : '/auth/register';
      const res = await axios.post(`http://localhost:5000/api${endpoint}`, formData, { headers });
      alert(res.data.msg);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'driver' });
      fetchAll();
    } catch (err) { alert(err.response?.data?.msg || "Error"); }
  };

  const handleStopSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/stops/add-stop',
        { ...stopData, bus_id: selectedBus.id }, { headers });
      alert("📍 Stop Added!");
      setStopData({ stop_name: '', stop_lat: '', stop_lng: '', stop_order: stopData.stop_order + 1 });
    } catch (err) { alert("Error adding stop"); }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/add-student', studentData, { headers });
      alert(res.data.msg);
      setShowStudentModal(false);
      setStudentData({ name: '', parent_id: '', bus_id: '', stop_id: '' });
      setStops([]);
      fetchAll();
    } catch (err) { alert(err.response?.data?.msg || "Error adding student"); }
  };

  // ── Edit Student ───────────────────────────────────────────────
  const openEditStudent = async (student) => {
    setEditingStudent({ ...student });
    setShowEditStudentModal(true);
    if (student.bus_id) {
      await fetchStopsForBus(student.bus_id, setEditStops);
    }
  };

  const handleEditStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/attendance/update-student/${editingStudent.id}`,
        {
          name: editingStudent.name,
          parent_id: editingStudent.parent_id,
          bus_id: editingStudent.bus_id,
          stop_id: editingStudent.stop_id,
        }, { headers });
      alert("✅ Student updated!");
      setShowEditStudentModal(false);
      fetchAll();
    } catch (err) { alert(err.response?.data?.msg || "Error updating student"); }
  };

  // ── Delete Student ─────────────────────────────────────────────
  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`"${studentName}" ko delete karna chahte ho?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/attendance/delete-student/${studentId}`, { headers });
      alert("🗑️ Student deleted!");
      fetchAll();
    } catch (err) { alert("Error deleting student"); }
  };

  const parents = users.filter(u => u.role === 'parent');
  const routeCenter = routeStops.length > 0
    ? [parseFloat(routeStops[0].stop_lat), parseFloat(routeStops[0].stop_lng)]
    : [28.6139, 77.2090];
  const routePolyline = routeStops.map(s => [parseFloat(s.stop_lat), parseFloat(s.stop_lng)]);

  return (
    <div className="dashboard-container">

      {/* ── HEADER ─────────────────────────────── */}
      <div className="dashboard-header-new">
        <div>
          <h1 className="dash-title">Transport Overview</h1>
          <p className="dash-sub">Real-time fleet & route management</p>
        </div>
        <div className="header-btn-group">
          <button onClick={() => setShowStudentModal(true)} className="add-btn-secondary">
            <GraduationCap size={16} /> Add Student
          </button>
          <button onClick={() => setShowModal(true)} className="add-btn-main">
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* ── STATS ──────────────────────────────── */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className={`stat-card-new ${stat.color}`}>
            <div className="stat-icon-new">{stat.icon}</div>
            <div>
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ───────────────────────────────── */}
      <div className="tabs-row">
        <button className={`tab-btn ${activeTab === 'fleet' ? 'tab-active' : ''}`} onClick={() => setActiveTab('fleet')}>
          <Bus size={16} /> Fleet Management
        </button>
        <button className={`tab-btn ${activeTab === 'students' ? 'tab-active' : ''}`} onClick={() => setActiveTab('students')}>
          <Users size={16} /> Students ({students.length})
        </button>
      </div>

      {/* ── FLEET TABLE ────────────────────────── */}
      {activeTab === 'fleet' && (
        <div className="table-container">
          <div className="table-header">
            <h3>Fleet Status & Route Control</h3>
          </div>
          <div className="table-scroll-wrapper">
            <table className="custom-table">
              <thead className="thead-bg">
                <tr>
                  <th>Bus No.</th>
                  <th>Driver</th>
                  <th>Current Stop</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="row-font">
                {loading ? (
                  <tr><td colSpan="5" className="loading-row">Loading...</td></tr>
                ) : buses.map((bus) => (
                  <tr key={bus.id}>
                    <td className="bus-no">{bus.busNumber}</td>
                    <td>{bus.driverName || 'Not Assigned'}</td>
                    <td className="stop-cell">{bus.current_stop || 'Depot'}</td>
                    <td>
                      <span className={`badge ${bus.status === 'On Trip' ? 'badge-green' : 'badge-slate'}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td className="action-btns">
                      <button onClick={() => openRouteModal(bus)} className="route-btn">
                        <Route size={13} /> View Route
                      </button>
                      <button onClick={() => { setSelectedBus(bus); setShowStopModal(true); }} className="manage-btn">
                        <MapPin size={13} /> Add Stop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STUDENTS TABLE ─────────────────────── */}
      {activeTab === 'students' && (
        <div className="table-container">
          <div className="table-header">
            <h3>Students Management</h3>
            <button onClick={() => setShowStudentModal(true)} className="add-btn-main" style={{fontSize:'0.8rem', padding:'0.4rem 0.8rem'}}>
              <Plus size={14} /> Add Student
            </button>
          </div>
          <div className="table-scroll-wrapper">
            <table className="custom-table">
              <thead className="thead-bg">
                <tr>
                  <th>Student Name</th>
                  <th>Parent</th>
                  <th>Bus</th>
                  <th>Stop</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="row-font">
                {loading ? (
                  <tr><td colSpan="5" className="loading-row">Loading...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state-row">Koi student nahi mila. Add Student karo!</td></tr>
                ) : students.map((student) => (
                  <tr key={student.id}>
                    <td className="bus-no">🎒 {student.name}</td>
                    <td>{student.parent_name || <span style={{color:'#94a3b8'}}>Not assigned</span>}</td>
                    <td>{student.busNumber || <span style={{color:'#94a3b8'}}>Not assigned</span>}</td>
                    <td className="stop-cell">{student.stop_name || <span style={{color:'#94a3b8', fontWeight:400}}>Not assigned</span>}</td>
                    <td className="action-btns">
                      <button onClick={() => openEditStudent(student)} className="edit-btn">
                        <Pencil size={13} /> Edit
                      </button>
                      <button onClick={() => handleDeleteStudent(student.id, student.name)} className="delete-btn">
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ROUTE MAP MODAL ────────────────────── */}
      {showRouteModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-wide">
            <div className="modal-header">
              <h2>🗺️ Route Map — Bus {selectedBus?.busNumber}</h2>
              <X className="close-icon" onClick={() => setShowRouteModal(false)} />
            </div>
            {routeLoading ? (
              <p style={{textAlign:'center',padding:'2rem',color:'#94a3b8'}}>Loading route...</p>
            ) : routeStops.length === 0 ? (
              <div className="no-stops-msg">
                <MapPin size={40} color="#cbd5e1" />
                <p>Koi stop add nahi kiya gaya.</p>
                <span>Pehle "Add Stop" se stops add karo.</span>
              </div>
            ) : (
              <>
                <div className="route-map-wrapper">
                  <MapContainer center={routeCenter} zoom={13} style={{height:'100%',width:'100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {routeStops.map((stop, i) => (
                      <Marker key={stop.id} position={[parseFloat(stop.stop_lat), parseFloat(stop.stop_lng)]} icon={createStopIcon(i+1)}>
                        <Popup><strong>#{i+1} {stop.stop_name}</strong></Popup>
                      </Marker>
                    ))}
                    {routePolyline.length > 1 && <Polyline positions={routePolyline} color="#6b0f1a" weight={3} dashArray="8,4" />}
                  </MapContainer>
                </div>
                <div className="stops-list">
                  {routeStops.map((stop, i) => (
                    <div key={stop.id} className="stop-list-item">
                      <div className="stop-num">{i+1}</div>
                      <span className="stop-list-name">{stop.stop_name}</span>
                      <span className="stop-list-coords">{parseFloat(stop.stop_lat).toFixed(4)}, {parseFloat(stop.stop_lng).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ADD STOP MODAL ─────────────────────── */}
      {showStopModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>📍 Add Stop — {selectedBus?.busNumber}</h2>
              <X className="close-icon" onClick={() => setShowStopModal(false)} />
            </div>
            <form onSubmit={handleStopSubmit}>
              <div className="form-group">
                <label>Stop Name</label>
                <input type="text" required value={stopData.stop_name}
                  onChange={(e) => setStopData({...stopData, stop_name: e.target.value})}
                  placeholder="e.g. Main Chowk" />
              </div>
              <div className="lat-lng-grid">
                <div className="form-group">
                  <label>Latitude</label>
                  <input type="number" step="any" required value={stopData.stop_lat}
                    onChange={(e) => setStopData({...stopData, stop_lat: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input type="number" step="any" required value={stopData.stop_lng}
                    onChange={(e) => setStopData({...stopData, stop_lng: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Stop Order</label>
                <input type="number" required value={stopData.stop_order}
                  onChange={(e) => setStopData({...stopData, stop_order: parseInt(e.target.value)})} />
              </div>
              <button type="submit" className="submit-btn submit-btn-green">Add Stop ➕</button>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD STUDENT MODAL ──────────────────── */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🎒 Add New Student</h2>
              <X className="close-icon" onClick={() => setShowStudentModal(false)} />
            </div>
            <form onSubmit={handleStudentSubmit}>
              <div className="form-group">
                <label>Student Name</label>
                <input type="text" required placeholder="e.g. Rahul Sharma"
                  value={studentData.name}
                  onChange={(e) => setStudentData({...studentData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Parent</label>
                <select required value={studentData.parent_id}
                  onChange={(e) => setStudentData({...studentData, parent_id: e.target.value})}>
                  <option value="">-- Parent choose karo --</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Bus</label>
                <select required value={studentData.bus_id}
                  onChange={(e) => {
                    setStudentData({...studentData, bus_id: e.target.value, stop_id: ''});
                    fetchStopsForBus(e.target.value, setStops);
                  }}>
                  <option value="">-- Bus choose karo --</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber} — {b.route}</option>)}
                </select>
              </div>
              {stops.length > 0 && (
                <div className="form-group">
                  <label>Stop</label>
                  <select value={studentData.stop_id}
                    onChange={(e) => setStudentData({...studentData, stop_id: e.target.value})}>
                    <option value="">-- Stop choose karo --</option>
                    {stops.map(s => <option key={s.id} value={s.id}>{s.stop_name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="submit-btn submit-btn-green">Add Student 🎒</button>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT STUDENT MODAL ─────────────────── */}
      {showEditStudentModal && editingStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✏️ Edit Student</h2>
              <X className="close-icon" onClick={() => setShowEditStudentModal(false)} />
            </div>
            <form onSubmit={handleEditStudentSubmit}>
              <div className="form-group">
                <label>Student Name</label>
                <input type="text" required value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Parent</label>
                <select required value={editingStudent.parent_id || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, parent_id: e.target.value})}>
                  <option value="">-- Parent choose karo --</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Bus</label>
                <select required value={editingStudent.bus_id || ''}
                  onChange={(e) => {
                    setEditingStudent({...editingStudent, bus_id: e.target.value, stop_id: ''});
                    fetchStopsForBus(e.target.value, setEditStops);
                  }}>
                  <option value="">-- Bus choose karo --</option>
                  {buses.map(b => <option key={b.id} value={b.id}>{b.busNumber} — {b.route}</option>)}
                </select>
              </div>
              {editStops.length > 0 && (
                <div className="form-group">
                  <label>Stop</label>
                  <select value={editingStudent.stop_id || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, stop_id: e.target.value})}>
                    <option value="">-- Stop choose karo --</option>
                    {editStops.map(s => <option key={s.id} value={s.id}>{s.stop_name}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="submit-btn">Save Changes ✅</button>
            </form>
          </div>
        </div>
      )}

      {/* ── REGISTER USER MODAL ────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Register New User</h2>
              <X className="close-icon" onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" required value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@school.com" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" required value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Set password" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                  <option value="driver">Driver</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">Register User</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
