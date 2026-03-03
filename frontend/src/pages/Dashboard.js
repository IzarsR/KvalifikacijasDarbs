import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const API = 'http://localhost:5000/api/videos';

async function saveVideoToDB(sessionId, url, token) {
  try {
    await fetch(`${API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ session_id: String(sessionId), url, title: url }),
    });
  } catch (e) { console.warn('Could not save video to DB:', e); }
}

async function removeVideoFromDB(sessionId, token) {
  try {
    await fetch(`${API}/session/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (e) { console.warn('Could not remove video from DB:', e); }
}

const STORAGE_KEY = (username) => `playlytic_sessions_${username}`;

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
  } catch {}
  return null;
}

function isDirectVideo(url) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url.split('?')[0]);
}

function loadSessions(username) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions, username) {
  localStorage.setItem(STORAGE_KEY(username), JSON.stringify(sessions));
}

function emptySession(name) {
  return {
    id: Date.now(),
    name,
    videoUrl: '',
  };
}

function Dashboard() {
  const { token, username } = useAuth();
  const [sessions, setSessions]       = useState(() => loadSessions(username));
  const [activeId, setActiveId]       = useState(null);
  const [search, setSearch]           = useState('');
  const [addingSession, setAdding]    = useState(false);
  const [newName, setNewName]         = useState('');
  const [editingName, setEditingName] = useState(false);
  const [videoInput, setVideoInput]         = useState('');
  const [showVideoInput, setShowVideoInput]   = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => { saveSessions(sessions, username); }, [sessions, username]);

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus();
  }, [editingName]);

  const activeSession = sessions.find(s => s.id === activeId) || null;

  const filtered = sessions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleAddSession(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const session = emptySession(trimmed);
    const updated = [...sessions, session];
    setSessions(updated);
    setActiveId(session.id);
    setNewName('');
    setAdding(false);
  }

  function handleDelete(id, e) {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeId === id) setActiveId(updated.length ? updated[0].id : null);
  }

  function handleRename(value) {
    setSessions(sessions.map(s =>
      s.id === activeId ? { ...s, name: value } : s
    ));
  }

  function handleSaveVideoUrl(e) {
    e.preventDefault();
    const trimmed = videoInput.trim();
    if (!trimmed) return;
    setSessions(sessions.map(s =>
      s.id === activeId ? { ...s, videoUrl: trimmed } : s
    ));
    saveVideoToDB(activeId, trimmed, token);
    setShowVideoInput(false);
    setVideoInput('');
  }

  function handleRemoveVideo() {
    setSessions(sessions.map(s =>
      s.id === activeId ? { ...s, videoUrl: '' } : s
    ));
    removeVideoFromDB(activeId, token);
  }

  useEffect(() => {
    setShowVideoInput(false);
    setVideoInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const ytEmbed   = activeSession?.videoUrl ? toYouTubeEmbed(activeSession.videoUrl) : null;
  const directUrl = activeSession?.videoUrl && isDirectVideo(activeSession.videoUrl) ? activeSession.videoUrl : null;
  const hasVideo  = ytEmbed || directUrl;

  return (
    <div className="dashboard">

      <aside className="db-sidebar">
        <div className="db-sidebar-header">
          <span className="db-sidebar-title">My Sessions</span>
        </div>

        <div className="db-search-wrap">
          <input
            type="text"
            placeholder="Search sessions..."
            className="db-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <ul className="db-session-list">
          {filtered.length === 0 && (
            <li className="db-empty-msg">No sessions yet</li>
          )}
          {filtered.map(s => (
            <li
              key={s.id}
              className={`db-session-item${activeId === s.id ? ' active' : ''}`}
              onClick={() => { setActiveId(s.id); setEditingName(false); }}
            >
              <span className="db-session-icon"></span>
              <span className="db-session-item-name">{s.name}</span>
              <button
                className="db-delete-btn"
                onClick={e => handleDelete(s.id, e)}
                title="Delete session"
              ></button>
            </li>
          ))}
        </ul>

        <div className="db-sidebar-footer">
          {addingSession ? (
            <form onSubmit={handleAddSession} className="db-new-session-form">
              <input
                autoFocus
                type="text"
                className="db-search"
                placeholder="Session name..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <div className="db-new-session-btns">
                <button type="submit" className="db-add-btn">Add</button>
                <button type="button" className="db-cancel-btn" onClick={() => { setAdding(false); setNewName(''); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="db-add-btn" onClick={() => setAdding(true)}>+ New Session</button>
          )}
        </div>
      </aside>

      <div className="db-main">
        {!activeSession ? (
          <div className="db-empty-state">
            <span className="db-play-icon"></span>
            <p>Create a new session in the sidebar to get started.</p>
          </div>
        ) : (
          <>
            <div className="db-topbar">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  className="db-session-name-input"
                  value={activeSession.name}
                  onChange={e => handleRename(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                />
              ) : (
                <span
                  className="db-session-name"
                  title="Click to rename"
                  onClick={() => setEditingName(true)}
                >
                  {activeSession.name} <span className="db-rename-hint"></span>
                </span>
              )}
            </div>

            <div className="db-content-row">

              <div className="db-left-col">

                <div className="db-video-area">
                  {hasVideo ? (
                    <>
                      {ytEmbed && (
                        <iframe
                          className="db-video-player"
                          src={ytEmbed}
                          title="Video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                      {directUrl && (
                        <video className="db-video-player" controls src={directUrl} />
                      )}
                      <button className="db-remove-video" onClick={handleRemoveVideo} title="Remove video"> Remove video</button>
                    </>
                  ) : showVideoInput ? (
                    <div className="db-video-prompt">
                      <form className="db-video-url-form" onSubmit={handleSaveVideoUrl}>
                        <input
                          autoFocus
                          type="text"
                          className="db-video-url-input"
                          placeholder="Paste YouTube or video URL..."
                          value={videoInput}
                          onChange={e => setVideoInput(e.target.value)}
                        />
                        <button type="submit" className="db-video-confirm-btn">Add</button>
                        <button type="button" className="db-cancel-btn" onClick={() => { setShowVideoInput(false); setVideoInput(''); }}>Cancel</button>
                      </form>
                    </div>
                  ) : (
                    <div className="db-video-empty" onClick={() => setShowVideoInput(true)}>
                      <span className="db-play-icon"></span>
                      <span className="db-video-add-label">Click to add a video</span>
                      <span className="db-video-sub">YouTube link or direct video URL</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

