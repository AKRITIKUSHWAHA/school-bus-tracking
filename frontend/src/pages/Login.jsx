import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { useAuth } from '../context/AuthContext';
import { Bus } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (res.data.success) {
        const { token, user } = res.data; 

        // 1. Purana kachra saaf (Admin/Driver/Parent ka purana data clear)
        localStorage.clear(); 

        // 2. Naya Data Save karo
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role); 
        localStorage.setItem('userName', user.name);

        // 3. Sabhi components (Sidebar, App.js) ko Notify karo ki Role change ho gaya hai
        window.dispatchEvent(new Event("storage")); 

        // 4. Auth Context ko update karo
        login({ ...user, token }); 

        setLoading(false);

        // 5. FINAL REDIRECTION (Strict check for each role)
        if (user.role === 'admin') {
          console.log("Welcome Admin! Redirecting...");
          navigate('/admin', { replace: true });
        } else if (user.role === 'driver') {
          console.log("Welcome Driver! Redirecting...");
          navigate('/driver', { replace: true }); 
        } else if (user.role === 'parent') {
          console.log("Welcome Parent! Redirecting...");
          navigate('/parent', { replace: true }); 
        } else {
          navigate('/', { replace: true }); 
        }
      }
    } catch (err) {
      setLoading(false);
      // Backend error message dikhane ke liye
      alert(err.response?.data?.message || "Login fail ho gaya! Details check karein.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-6">
           <Bus size={50} color="#1e3a8a" style={{margin: '0 auto'}} />
           <h2 className="school-title">St. Xavier's</h2>
           <p style={{color: '#64748b', fontWeight: 'bold', letterSpacing: '1px'}}>TRANSPORT LOGIN</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input 
              type="email" 
              required
              className="input-box" 
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              required
              className="input-box" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying Identity..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;