import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import './Navigation.css';

function Navigation() {
  const { isLoggedIn, username, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <Logo />
          </Link>
        </div>

        <div className="nav-center">
          <div
            className="nav-ornament nav-ornament--left"
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/basketball.png)` }}
          />

          <div className="nav-time-date">
            <div className="nav-time">{formattedTime}</div>
            <div className="nav-date">{formattedDate}</div>
          </div>

          <div
            className="nav-ornament nav-ornament--right"
            style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/football.png)` }}
          />
        </div>

        <div className="nav-right">
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
              <li><button className="nav-action" onClick={handleLogout}>Log Out</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login" className="nav-action" onClick={closeMenu}>Log In</Link></li>
              <li><Link to="/signup" className="nav-cta" onClick={closeMenu}>Sign Up</Link></li>
            </>
          )}
        </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
