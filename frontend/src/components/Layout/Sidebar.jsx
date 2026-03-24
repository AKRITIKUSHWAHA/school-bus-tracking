import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  MapPin, 
  Bus, 
  Settings, 
  LogOut, 
  ShieldCheck,
  User,
  Users 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ role: initialRole, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  
  const [userRole, setUserRole] = useState(initialRole || localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || 'User');

  useEffect(() => {
    const freshRole = localStorage.getItem('userRole');
    const freshName = localStorage.getItem('userName');
    setUserRole(freshRole);
    setUserName(freshName || 'User');
  }, [location, initialRole]);

  const allMenuItems = [
    { name: 'Dashboard',     path: '/admin',          icon: <LayoutDashboard size={22} />, role: 'admin' },
    { name: 'All Users',     path: '/admin/users',    icon: <Users size={22} />,           role: 'admin' },
    { name: 'Add Bus',       path: '/admin/add-bus',  icon: <Bus size={22} />,             role: 'admin' },
    { name: 'Live Tracking', path: '/parent',         icon: <MapPin size={22} />,          role: 'parent' },
    { name: 'Driver Panel',  path: '/driver',         icon: <Bus size={22} />,             role: 'driver' },
    { name: 'Settings',      path: '/settings',       icon: <Settings size={22} />,        role: 'all' },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item.role === 'all') return true;
    return item.role === userRole;
  });

  const handleLogout = () => {
    localStorage.clear();
    logout();
    navigate('/login');
    window.location.reload();
  };

  if (!userRole) return null;

  return (
    <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo-section">
        <div className="logo-icon-bg">
          <Bus size={24} color="#0f172a" />
        </div>
        <span className="logo-text">
          BusTrack <span className="pro-tag">Pro</span>
        </span>
      </div>

      {/* Nav Links */}
      <nav className="sidebar-nav">
        <p className="menu-label">
          {userRole === 'admin' ? 'Admin Control' : userRole === 'driver' ? 'Driver Menu' : 'Parent Portal'}
        </p>
        
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/parent' || item.path === '/driver'}
            className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            onClick={onClose} /* Mobile pe link click hone pe sidebar band */
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {userRole === 'admin' ? (
              <ShieldCheck size={20} color="#facc15" />
            ) : (
              <User size={20} color="#2563eb" />
            )}
          </div>
          <div className="user-info">
            <p className="u-name">{userName}</p>
            <p className="u-role">
              {userRole === 'admin' ? 'System Admin' : userRole === 'driver' ? 'Bus Driver' : 'Parent'}
            </p>
          </div>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
