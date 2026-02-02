import React, { useState } from 'react';
import './UploadModal.css';

const API_URL = 'http://localhost:5000/api/videos';

function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoTitle.trim()) {
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
        body: JSON.stringify({ title: videoTitle }),
      });

      if (response.ok) {
        setMessage('Video added successfully!');
        setVideoTitle('');
        setTimeout(() => {
          onUploadSuccess();
          onClose();
          setMessage('');
        }, 1000);
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Video</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Video Title</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title"
              className="modal-input"
              disabled={loading}
            />
          </div>
          
          {message && <p className="modal-message">{message}</p>}
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="upload-submit-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadModal;
