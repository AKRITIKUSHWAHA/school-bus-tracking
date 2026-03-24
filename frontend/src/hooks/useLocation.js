// hooks/useLocation.js — Browser ka GPS use karta hai

import { useState, useEffect, useRef } from 'react';

const useLocation = (isTracking) => {
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    // Tracking band ho toh GPS band karo
    if (!isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setLocation({ lat: null, lng: null });
      }
      return;
    }

    // Browser GPS support check
    if (!navigator.geolocation) {
      setError('Aapka browser GPS support nahi karta');
      return;
    }

    // GPS start karo — har location change pe update hoga
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('GPS permission denied. Browser settings mein allow karo.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('GPS signal nahi mil raha.');
            break;
          case err.TIMEOUT:
            setError('GPS timeout. Retry ho raha hai...');
            break;
          default:
            setError('GPS error aa gaya.');
        }
      },
      {
        enableHighAccuracy: true,  // Best accuracy
        maximumAge: 5000,          // 5 sec purani location use kar sakta hai
        timeout: 15000             // 15 sec mein nahi aaya toh error
      }
    );

    // Cleanup: component unmount pe GPS band
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking]);

  return { location, error };
};

export default useLocation;