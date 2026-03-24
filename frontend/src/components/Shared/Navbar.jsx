import React from 'react';
import { Bell, UserCircle, Menu } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ onMenuClick }) => {
  const userName = localStorage.getItem('userName') || 'User';
  const userRole = localStorage.getItem('userRole') || 'Guest';

  return (
    <header className="main-navbar">

      {/* Hamburger Button — sirf mobile pe dikhega */}
      <button className="hamburger-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={22} />
      </button>

      {/* Mobile Title */}
      <h1 className="mobile-logo">BusTrack</h1>

      {/* Desktop Welcome Message */}
      <div className="desktop-welcome">
        <span className="welcome-text">
          Welcome back, <span style={{ textTransform: 'capitalize' }}>{userName}</span> ({userRole}) 👋
        </span>
      </div>

      {/* Right Side Actions */}
      <div className="nav-actions">
        <button className="notif-btn" aria-label="Notifications">
          <Bell size={20} />
          <span className="notif-badge"></span>
        </button>

        <div className="nav-divider"></div>

        <div className="profile-link">
          <span className="profile-name" style={{ textTransform: 'capitalize' }}>
            {userName}
          </span>
          <UserCircle size={28} className="profile-icon" />
        </div>
      </div>

    </header>
  );
};

export default Navbar;
