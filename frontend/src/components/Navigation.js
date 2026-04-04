import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const { isLoggedIn, username, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>Play<span>lytic</span></Link>

        {/* hamburger button — only visible on mobile */}
        <button
          className={`nav-hamburger${menuOpen ? ' nav-hamburger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        {/* overlay to close menu on tap outside */}
        {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}

        <ul className={`nav-links${menuOpen ? ' nav-links--open' : ''}`}>
          {isLoggedIn ? (
            <>
              <li><Link to="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
              <li><span className="nav-username">{username}</span></li>
              <li><button className="nav-btn-outline nav-logout-btn" onClick={handleLogout}>Log Out</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login"  className="nav-btn-outline" onClick={closeMenu}>Log In</Link></li>
              <li><Link to="/signup" className="nav-btn-primary" onClick={closeMenu}>Sign Up</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
