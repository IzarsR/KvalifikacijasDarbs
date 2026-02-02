import React, { useState, useEffect } from 'react';
import './Videos.css';

const API_URL = 'http://localhost:5000/api/videos';

function Videos() {
  const [videos, setVideos] = useState([]);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch videos on component mount
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
      setMessage('Error loading videos. Make sure the backend is running.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newVideoTitle.trim()) {
      setMessage('Please enter a video title');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newVideoTitle }),
      });

      if (response.ok) {
        setMessage('Video added successfully!');
        setNewVideoTitle('');
        fetchVideos(); // Refresh the list
      } else {
        setMessage('Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      setMessage('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="videos-page">
      <h2>Video Management</h2>
      
      <div className="add-video-section">
        <h3>Add New Video</h3>
        <form onSubmit={handleSubmit} className="video-form">
          <input
            type="text"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            placeholder="Enter video title"
            className="video-input"
            disabled={loading}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding...' : 'Add Video'}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>

      <div className="videos-list-section">
        <h3>Saved Videos</h3>
        {videos.length === 0 ? (
          <p className="no-videos">No videos yet. Add your first video above!</p>
        ) : (
          <ul className="videos-list">
            {videos.map((video) => (
              <li key={video.id} className="video-item">
                <span className="video-title">{video.title}</span>
                <span className="video-date">
                  {new Date(video.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Videos;
