import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';
import UploadModal from './UploadModal';

function Navigation() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-logo">Playlytic</div>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><button onClick={() => setIsUploadModalOpen(true)} className="nav-btn">Upload</button></li>
            <li><a href="#login">Login</a></li>
            <li><a href="#signup">Sign Up</a></li>
          </ul>
        </div>
      </nav>
      
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => window.location.reload()}
      />
    </>
  );
}

export default Navigation;
