import React from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-logo">Playlytic</div>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><a href="#login">Login</a></li>
          <li><a href="#signup">Sign Up</a></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
