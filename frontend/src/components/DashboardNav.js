import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './DashboardNav.css';

function DashboardNav() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="dashboard-nav">
      <div className="dash-nav-container">
        <Link to="/dashboard" className="dash-nav-logo">
          <Logo />
        </Link>

        <div className="dash-nav-right">
          <span className="dash-nav-username">{username}</span>
          <button className="dash-nav-logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default DashboardNav;
