import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Trash2, Mail, Shield, User as UserIcon, Filter } from 'lucide-react';
import './UsersList.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NAYA STATE: Filter ke liye ---
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users", err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Kya aap sach mein is user ko hatana chahte hain?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/auth/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(users.filter(user => user.id !== id));
        alert("User deleted successfully!");
      } catch (err) {
        alert("Nahi hata paye!");
      }
    }
  };

  // --- NAYA LOGIC: Data filter karna ---
  const filteredUsers = users.filter(user => 
    filterRole === 'all' ? true : user.role === filterRole
  );

  return (
    <div className="users-list-container">
      <div className="users-header">
        <div>
          <h1><Users size={28} /> Registered Users</h1>
          <p>Manage all Drivers and Parents from here</p>
        </div>
        
        {/* Filter UI - Naya add kiya */}
        <div className="header-actions">
          <div className="filter-group">
            <Filter size={18} className="filter-icon" />
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="role-filter-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="driver">Drivers Only</option>
              <option value="parent">Parents Only</option>
            </select>
          </div>
          <div className="user-stats-pill">
            Showing: {filteredUsers.length}
          </div>
        </div>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User Details</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="loading-text">Fetching users from MySQL...</td></tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info-cell">
                      <div className={`avatar-circle ${user.role}`}>
                        {user.role === 'admin' ? <Shield size={16} /> : <UserIcon size={16} />}
                      </div>
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="email-cell"><Mail size={14} /> {user.email}</div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {user.role !== 'admin' && (
                      <button className="delete-user-btn" onClick={() => handleDelete(user.id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="loading-text">No users found for this role.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;