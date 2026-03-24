import React, { useState } from 'react';
import api from '../api/axiosInstance'; 
import './AddBus.css';

const AddBus = () => {
  const [busData, setBusData] = useState({
    busNumber: '',   
    driver_id: '',   
    route: '',       
    status: 'Parked' 
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setBusData({ ...busData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ FIX 1: URL match kiya (Server.js ka '/api/buses' + Routes ka '/register')
      // ✅ FIX 2: Backend 'msg' bhej raha hai, isliye alert mein 'res.data.msg' use kiya
      const res = await api.post('/buses/register', busData);
      
      if (res.status === 201 || res.data.msg) {
        alert(`✅ ${res.data.msg}`); 
        setBusData({ busNumber: '', driver_id: '', route: '', status: 'Parked' });
      }
    } catch (err) {
      console.error("Error details:", err.response);
      // Backend agar 'msg' bhej raha hai toh wahi dikhayega
      alert(err.response?.data?.msg || "❌ Error adding bus (Check if Driver ID exists)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-bus-container">
      <div className="form-header">
        <h2>Register New Bus</h2>
        <p>Fill in the details to add a bus to the fleet</p>
      </div>

      <form onSubmit={handleSubmit} className="add-bus-form">
        <div className="input-group">
          <label>Bus Number / Plate</label>
          <input 
            type="text" 
            name="busNumber" 
            placeholder="e.g. DL-1CB-1234" 
            value={busData.busNumber} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="input-group">
          <label>Route Description</label>
          <input 
            type="text" 
            name="route" 
            placeholder="e.g. Sector 15 to Model Town" 
            value={busData.route} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Assign Driver ID</label>
            <input 
              type="number" 
              name="driver_id" 
              placeholder="Driver User ID" 
              value={busData.driver_id} 
              onChange={handleChange} 
              required
            />
          </div>

          <div className="input-group">
            <label>Initial Status</label>
            <select name="status" value={busData.status} onChange={handleChange}>
              <option value="Parked">Parked</option>
              <option value="On Route">On Route</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Adding...' : 'Add Bus'}
        </button>
      </form>
    </div>
  );
};

export default AddBus;