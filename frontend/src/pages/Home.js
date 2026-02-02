import React, { useState, useEffect } from 'react';
import './Home.css';
import UploadModal from '../components/UploadModal';

const API_URL = 'http://localhost:5000/api/videos';

function Home() {
  const [videos, setVideos] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleUploadSuccess = () => {
    fetchVideos();
  };

  return (
    <div className="home">
      <div className="sidebar">
        <div className="search-container">
          <input type="text" placeholder="Search your gallery" className="search-bar" />
        </div>
        <div className="upload-buttons">
          {videos.length > 0 ? (
            videos.map((video) => (
              <button key={video.id} className="upload-btn">
                {video.title}
              </button>
            ))
          ) : (
            <p className="no-videos-text">No videos yet</p>
          )}
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

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}

export default Home;
