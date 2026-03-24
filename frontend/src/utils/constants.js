// Backend Base URLs (Environment variables se connect)
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const ENDPOINTS = {
  LOGIN: '/auth/login',
  GET_BUSES: '/bus/all',
  UPDATE_LOCATION: '/bus/update-location',
  BUS_DETAILS: (id) => `/bus/${id}`,
  GET_HISTORY: (id) => `/bus/history/${id}`,
};

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
  PARENT: 'parent',
};

// Map Settings
export const MAP_CONFIG = {
  DEFAULT_CENTER: [28.6139, 77.2090], // Delhi coords
  DEFAULT_ZOOM: 14,
  TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};

// Refresh Intervals (Driver location kitni der mein bhejni hai)
export const TRACKING_INTERVAL = 5000; // 5 seconds