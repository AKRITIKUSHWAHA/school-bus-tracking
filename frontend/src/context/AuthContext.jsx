import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Jab page refresh ho, toh check karo storage mein kya hai
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');

    if (token && role) {
      setUser({ token, role, name });
    } else {
      setUser(null);
    }
  }, []);

  const login = (userData) => {
    // 1. Pehle state set karo
    setUser(userData);
    // 2. Phir storage mein confirm karo
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userName', userData.name);
    
    // 3. Poore browser ko batao ki storage badal gaya hai
    window.dispatchEvent(new Event("storage"));
  };

  const logout = () => {
    localStorage.clear(); // Saara purana kachra saaf
    setUser(null);        // State zero
    window.location.href = '/login'; // Hard reload taaki pichli memory delete ho jaye
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);