import React, { useState } from 'react';
import { User, Lock, Bell, Shield, Save } from 'lucide-react';
import axios from 'axios'; // <--- Naya Import asli logic ke liye
import './Settings.css';

const Settings = () => {
  // --- Logic: LocalStorage se user ki info nikalna ---
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'parent';
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '' // Confirm password field ka logic bhi handle karenge
  });

  // --- NAYA ASALI LOGIC: Backend se connectivity ---
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Safety Check: Naya password confirm se match hona chahiye
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Naya password aur Confirm password match nahi ho raha!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/auth/update-password', 
        {
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        }, 
        {
          headers: { Authorization: `Bearer ${token}` } // JWT Token bhej rahe hain
        }
      );

      if (res.data.success) {
        alert("Shabaash! Password successfully update ho gaya. ✅");
        // Form saaf karne ke liye
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Password change fail ho gaya!");
    }
  };

  return (
    <div className="settings-container">
      <h2 className="page-title">Account Settings</h2>

      <div className="settings-grid">
        {/* 1. Profile Section */}
        <div className="settings-card profile-card">
          <h3><User size={20} /> Personal Profile</h3>
          <div className="profile-info-display">
            <div className="info-group">
              <label>Full Name</label>
              <p>{userName}</p>
            </div>
            <div className="info-group">
              <label>Account Role</label>
              <p className="role-tag">{userRole.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* 2. Security Section (Password Change) */}
        <div className="settings-card security-card">
          <h3><Lock size={20} /> Change Password</h3>
          <form onSubmit={handlePasswordUpdate}>
            <input 
              type="password" 
              placeholder="Current Password" 
              className="settings-input"
              value={passwordData.oldPassword} // Controlled component logic
              onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
              required
            />
            <input 
              type="password" 
              placeholder="New Password" 
              className="settings-input"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              required
            />
            {/* Maine Confirm Password input bhi yahan active kar diya hai logic ke liye */}
            <input 
              type="password" 
              placeholder="Confirm New Password" 
              className="settings-input"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              required
            />
            <button type="submit" className="save-btn">
              <Save size={18} /> Update Password
            </button>
          </form>
        </div>

        {/* 3. Role-Based Special Settings (Sirf Admin ko dikhega) */}
        {userRole === 'admin' && (
          <div className="settings-card admin-special">
            <h3><Shield size={20} /> System Controls</h3>
            <p>Admin, aap yahan se system ki maintenance mode on kar sakte hain.</p>
            <button className="admin-btn">Maintenance Mode</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;