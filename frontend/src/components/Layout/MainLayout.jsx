import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';
import Navbar from '../Shared/Navbar';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const [role, setRole] = useState(localStorage.getItem('userRole'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const currentRole = localStorage.getItem('userRole');
    setRole(currentRole);
  }, [location]);

  // Route change hone pe sidebar band ho jaye (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-container">

      {/* Mobile Overlay — sidebar ke peeche dark background */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay active"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — mobile pe open/close hoga */}
      <Sidebar
        key={role}
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="content-wrapper">
        {/* Navbar mein hamburger button pass karo */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="main-viewport">
          <div className="content-constrain">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
