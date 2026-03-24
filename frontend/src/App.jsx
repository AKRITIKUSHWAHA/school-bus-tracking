import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import AdminDashboard from './pages/AdminDashboard';
import ParentView from './pages/ParentView';
import DriverView from './pages/DriverView';
import Login from './pages/Login';
import Settings from './pages/Settings'; 
import UsersList from './pages/UsersList';
import AddBus from './pages/AddBus'; // Naya page import kiya
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth(); 
  const location = useLocation();
  
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('userRole');
  
  // Asli role wahi hai jo Context mein hai, fallback storage hai
  const currentUserRole = user?.role || storedRole;

  if (!token) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  if (allowedRole === 'all') return children;

  // Agar role mismatch hai toh uske apne dashboard pe bhejo
  if (currentUserRole !== allowedRole) {
    return <Navigate replace to={`/${currentUserRole}`} />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* --- 1. ADMIN ZONE --- */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <MainLayout><AdminDashboard /></MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRole="admin">
            <MainLayout><UsersList /></MainLayout>
          </ProtectedRoute>
        } />
        {/* Naya Add Bus Route - Strictly for Admin */}
        <Route path="/admin/add-bus" element={
          <ProtectedRoute allowedRole="admin">
            <MainLayout><AddBus /></MainLayout>
          </ProtectedRoute>
        } />

        {/* --- 2. PARENT ZONE --- */}
        <Route path="/parent" element={
          <ProtectedRoute allowedRole="parent">
            <MainLayout><ParentView /></MainLayout>
          </ProtectedRoute>
        } />

        {/* --- 3. DRIVER ZONE --- */}
        <Route path="/driver" element={
          <ProtectedRoute allowedRole="driver">
            <MainLayout><DriverView /></MainLayout>
          </ProtectedRoute>
        } />

        {/* --- COMMON ZONE --- */}
        <Route path="/settings" element={
          <ProtectedRoute allowedRole="all">
            <MainLayout><Settings /></MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Default Redirects */}
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;