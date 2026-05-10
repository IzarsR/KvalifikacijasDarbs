import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import DashboardNav from './components/DashboardNav';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

import { useAuth } from './context/AuthContext';

function AuthLanding() {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) return <Navigate to="/dashboard" replace />;
  return <Home />;
}

function NavWrapper() {
  const location = useLocation();
  if (location.pathname === '/dashboard') {
    return <DashboardNav />;
  }
  return <Navigation />;
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <NavWrapper />
          <div className="container">
            <Routes>
              <Route path="/" element={<AuthLanding />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
