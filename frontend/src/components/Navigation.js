import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const { isLoggedIn, username, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo">Play<span>lytic</span></Link>
        <ul className="nav-links">
          {isLoggedIn ? (
            <>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><span className="nav-username">{username}</span></li>
              <li><button className="nav-btn-outline nav-logout-btn" onClick={handleLogout}>Log Out</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login"  className="nav-btn-outline">Log In</Link></li>
              <li><Link to="/signup" className="nav-btn-primary">Sign Up</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
