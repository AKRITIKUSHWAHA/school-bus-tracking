/**
 * Haversine Formula: Do coordinates (lat/lng) ke beech ka distance (KM mein) nikalne ke liye.
 * Ye kaam aayega jab parents ko dikhana ho ki bus kitni door hai.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2); // Returns distance in KM
};

/**
 * Last Seen Formatter: "Just now", "5 mins ago" wagera dikhane ke liye.
 */
export const formatLastSeen = (timestamp) => {
  if (!timestamp) return "Never";
  const now = new Date();
  const updated = new Date(timestamp);
  const diffInSeconds = Math.floor((now - updated) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  return updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Storage Helpers: JWT token handle karne ke liye.
 */
export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');
export const removeToken = () => localStorage.removeItem('token');

/**
 * Validation: Email sahi hai ya nahi check karne ke liye.
 */
export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};