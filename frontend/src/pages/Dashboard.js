import React from 'react';
import './Dashboard.css';

function Dashboard() {

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="search-container">
          <input type="text" placeholder="Search your gallery" className="search-bar" />
        </div>
        <button className="settings-btn">Settings</button>
      </div>
      
      <div className="main-content">
        <div className="tagline">Analyze. Improve. Win.</div>
        
        <div className="video-section">
          <h1 className="video-title">Video</h1>
        </div>
        
        <div className="video-render">
          <p>Video Full Render</p>
        </div>
        
        <div className="clips-section">
          <h2>Clips</h2>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
