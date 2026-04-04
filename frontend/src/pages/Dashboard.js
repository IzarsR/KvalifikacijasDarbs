import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const API = 'http://localhost:5000/api/videos';

async function saveVideoToDB(sessionId, url, token) {
  try {
    const response = await fetch(`${API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        session_id: String(sessionId),
        url,
        title: url,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to save video URL.');
    }
    return response.json();
  } catch (e) {
    console.warn('Could not save video to DB:', e);
    throw e;
  }
}

async function uploadVideoToDB(sessionId, file, token) {
  try {
    const payload = new FormData();
    payload.append('session_id', String(sessionId));
    payload.append('title', file.name);
    payload.append('video', file);

    const response = await fetch(`${API}/session/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to upload video.');
    }
    return data;
  } catch (e) {
    console.warn('Could not upload video to DB:', e);
    throw e;
  }
}

async function removeVideoFromDB(sessionId, token) {
  try {
    const response = await fetch(`${API}/session/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to remove video.');
    }
  } catch (e) {
    console.warn('Could not remove video from DB:', e);
    throw e;
  }
}

async function fetchSessionVideoFromDB(sessionId, token) {
  try {
    const response = await fetch(`${API}/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return response.json();
  } catch (e) {
    console.warn('Could not fetch session video from DB:', e);
    return null;
  }
}

async function fetchSessionClipsFromDB(sessionId, token) {
  try {
    const response = await fetch(`${API}/session/${sessionId}/clips`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('Could not fetch clips from DB:', e);
    return [];
  }
}

async function saveClipToDB(sessionId, clip, token) {
  try {
    const response = await fetch(`${API}/session/${sessionId}/clips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        label: clip.label,
        start_time: clip.start,
        end_time: clip.end,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'Failed to save clip.');
    }
    return data;
  } catch (e) {
    console.warn('Could not save clip to DB:', e);
    throw e;
  }
}

async function removeClipFromDB(clipId, token) {
  try {
    const response = await fetch(`${API}/clips/${clipId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error('Failed to remove clip.');
    }
  } catch (e) {
    console.warn('Could not remove clip from DB:', e);
    throw e;
  }
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
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(url.split('?')[0]) || /\/uploads\//i.test(url);
}

function sortClips(a, b) {
  if (a.start !== b.start) return a.start - b.start;
  return a.end - b.end;
}

function formatTime(seconds) {
  const numeric = Number(seconds);
  if (!Number.isFinite(numeric) || numeric < 0) return '00:00';

  const total = Math.floor(numeric);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function normalizeClip(raw, idx) {
  const start = Number(raw?.start);
  const end = Number(raw?.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return {
    id: raw?.id || `local-${Date.now()}-${idx}`,
    dbId: Number.isFinite(Number(raw?.dbId)) ? Number(raw.dbId) : null,
    label: String(raw?.label || `Clip ${idx + 1}`),
    start: Number(start.toFixed(2)),
    end: Number(end.toFixed(2)),
  };
}

function normalizeSession(raw) {
  const clips = Array.isArray(raw?.clips)
    ? raw.clips.map((clip, idx) => normalizeClip(clip, idx)).filter(Boolean).sort(sortClips)
    : [];

  return {
    id: raw?.id,
    name: String(raw?.name || 'Untitled session'),
    videoUrl: String(raw?.videoUrl || ''),
    videoSourceType: raw?.videoSourceType === 'upload' ? 'upload' : 'url',
    clips,
  };
}

function loadSessions(username) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSession)
      .filter((session) => session.id && session.name);
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
    videoSourceType: 'url',
    clips: [],
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
  const [videoStatus, setVideoStatus] = useState('');
  const [videoError, setVideoError] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [clipLabel, setClipLabel] = useState('');
  const [clipStart, setClipStart] = useState('0');
  const [clipEnd, setClipEnd] = useState('');
  const [clipError, setClipError] = useState('');
  const [clipStatus, setClipStatus] = useState('');
  const [savingClip, setSavingClip] = useState(false);
  const [loadingRemoteClips, setLoadingRemoteClips] = useState(false);

  const [videoCurrent, setVideoCurrent] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nameInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => { saveSessions(sessions, username); }, [sessions, username]);

  useEffect(() => {
    if (editingName && nameInputRef.current) nameInputRef.current.focus();
  }, [editingName]);

  const activeSession = sessions.find(s => s.id === activeId) || null;

  const filtered = sessions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function updateActiveSession(updater) {
    setSessions((prev) => prev.map((session) => (
      session.id === activeId ? updater(session) : session
    )));
  }

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
    removeVideoFromDB(id, token).catch(() => {});
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeId === id) setActiveId(updated.length ? updated[0].id : null);
  }

  function handleRename(value) {
    setSessions(sessions.map(s =>
      s.id === activeId ? { ...s, name: value } : s
    ));
  }

  async function handleSaveVideoUrl(e) {
    e.preventDefault();
    const trimmed = videoInput.trim();
    if (!trimmed) {
      setVideoError('Paste a video URL first.');
      return;
    }

    setVideoError('');
    setVideoStatus('Saving video URL...');

    updateActiveSession((session) => ({
      ...session,
      videoUrl: trimmed,
      videoSourceType: 'url',
      clips: [],
    }));

    setShowVideoInput(false);
    setVideoInput('');
    setClipLabel('');
    setClipStart('0');
    setClipEnd('');

    try {
      const response = await saveVideoToDB(activeId, trimmed, token);
      updateActiveSession((session) => ({
        ...session,
        videoUrl: response?.video?.url || trimmed,
        videoSourceType: response?.video?.source_type || 'url',
      }));
      setVideoStatus('Video URL saved.');
    } catch {
      setVideoStatus('Video saved locally. Backend sync failed.');
    }
  }

  async function handleUploadFromDevice(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setVideoError('');
    setVideoStatus('Uploading video file...');
    setUploadingVideo(true);

    try {
      const data = await uploadVideoToDB(activeId, file, token);
      const uploadedUrl = data?.video?.url || '';

      updateActiveSession((session) => ({
        ...session,
        videoUrl: uploadedUrl,
        videoSourceType: 'upload',
        clips: [],
      }));

      setShowVideoInput(false);
      setVideoInput('');
      setClipLabel('');
      setClipStart('0');
      setClipEnd('');
      setVideoStatus('Video uploaded and ready to clip.');
    } catch (error) {
      setVideoError(error.message || 'Upload failed.');
      setVideoStatus('');
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleRemoveVideo() {
    updateActiveSession((session) => ({
      ...session,
      videoUrl: '',
      videoSourceType: 'url',
      clips: [],
    }));

    setClipLabel('');
    setClipStart('0');
    setClipEnd('');
    setClipError('');

    try {
      await removeVideoFromDB(activeId, token);
      setVideoStatus('Video removed.');
      setVideoError('');
    } catch {
      setVideoError('Could not remove the video from backend.');
    }
  }

  function markClipTime(target) {
    if (!videoRef.current) {
      setClipError('Use manual times for embedded videos, or upload a direct file to mark points.');
      return;
    }

    const current = Number(videoRef.current.currentTime.toFixed(2));
    setClipError('');
    if (target === 'start') {
      setClipStart(String(current));
      if (!clipLabel.trim()) {
        setClipLabel(`Clip ${(activeSession?.clips?.length || 0) + 1}`);
      }
      if (!clipEnd || Number(clipEnd) <= current) {
        setClipEnd(String(Number((current + 4).toFixed(2))));
      }
      return;
    }
    setClipEnd(String(current));
  }

  async function handleSaveClip(event) {
    event.preventDefault();

    if (!activeSession?.videoUrl) {
      setClipError('Add a video to this session first.');
      return;
    }

    const start = Number(clipStart);
    const end = Number(clipEnd);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      setClipError('Start and end must be numbers.');
      return;
    }
    if (start < 0 || end <= start) {
      setClipError('End time must be greater than start time.');
      return;
    }

    const nextClip = {
      id: `local-${Date.now()}-${Math.round(Math.random() * 1e5)}`,
      dbId: null,
      label: clipLabel.trim() || `Clip ${(activeSession?.clips?.length || 0) + 1}`,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
    };

    setClipError('');
    setClipStatus('Saving clip...');
    setSavingClip(true);

    updateActiveSession((session) => ({
      ...session,
      clips: [...session.clips, nextClip].sort(sortClips),
    }));

    setClipLabel('');
    setClipStart(String(Number(end.toFixed(2))));
    setClipEnd(String(Number((end + 4).toFixed(2))));

    try {
      const created = await saveClipToDB(activeId, nextClip, token);
      updateActiveSession((session) => ({
        ...session,
        clips: session.clips
          .map((clip) => (
            clip.id === nextClip.id
              ? {
                  ...clip,
                  id: `db-${created.id}`,
                  dbId: created.id,
                  label: created.label,
                  start: Number(created.start_time),
                  end: Number(created.end_time),
                }
              : clip
          ))
          .sort(sortClips),
      }));
      setClipStatus('Clip saved.');
    } catch (error) {
      setClipStatus('Clip saved locally. Backend sync failed.');
      setClipError(error.message || 'Could not sync clip to backend.');
    } finally {
      setSavingClip(false);
    }
  }

  async function handleDeleteClip(clipId, dbId) {
    updateActiveSession((session) => ({
      ...session,
      clips: session.clips.filter((clip) => clip.id !== clipId),
    }));

    if (!dbId) return;

    try {
      await removeClipFromDB(dbId, token);
    } catch {
      setClipError('Clip removed locally, but backend deletion failed.');
    }
  }

  function handleJumpToClip(startSeconds) {
    if (!videoRef.current) {
      setClipError('Jump to clip is available for direct video playback.');
      return;
    }
    videoRef.current.currentTime = startSeconds;
    videoRef.current.play().catch(() => {});
  }

  useEffect(() => {
    setShowVideoInput(false);
    setVideoInput('');
    setVideoStatus('');
    setVideoError('');
    setClipLabel('');
    setClipStart('0');
    setClipEnd('');
    setClipError('');
    setClipStatus('');
    setVideoCurrent(0);
    setVideoDuration(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !token) return;

    let cancelled = false;
    setLoadingRemoteClips(true);

    Promise.all([
      fetchSessionVideoFromDB(activeId, token),
      fetchSessionClipsFromDB(activeId, token),
    ])
      .then(([videoPayload, clipRows]) => {
        if (cancelled) return;

        setSessions((prev) => prev.map((session) => {
          if (session.id !== activeId) return session;

          const merged = { ...session };

          if (!merged.videoUrl && videoPayload?.video?.url) {
            merged.videoUrl = videoPayload.video.url;
            merged.videoSourceType = videoPayload.video.source_type || 'url';
          }

          if (merged.clips.length === 0 && clipRows.length > 0) {
            merged.clips = clipRows
              .map((clip, idx) => normalizeClip({
                id: `db-${clip.id}`,
                dbId: clip.id,
                label: clip.label,
                start: clip.start_time,
                end: clip.end_time,
              }, idx))
              .filter(Boolean)
              .sort(sortClips);
          }

          return merged;
        }));
      })
      .finally(() => {
        if (!cancelled) setLoadingRemoteClips(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, token]);

  const ytEmbed = activeSession?.videoUrl ? toYouTubeEmbed(activeSession.videoUrl) : null;
  const directUrl = (
    activeSession?.videoUrl
    && !ytEmbed
    && (activeSession.videoSourceType === 'upload' || isDirectVideo(activeSession.videoUrl))
  ) ? activeSession.videoUrl : null;
  const hasVideo = Boolean(ytEmbed || directUrl);

  return (
    <div className="dashboard">

      {/* mobile sidebar overlay */}
      {sidebarOpen && <div className="db-mob-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`db-sidebar${sidebarOpen ? ' db-sidebar--open' : ''}`}>
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
            <React.Fragment key={s.id}>
              <li
                className={`db-session-item${activeId === s.id ? ' active' : ''}`}
                onClick={() => { setActiveId(s.id); setEditingName(false); }}
              >
                <span className="db-session-icon">{activeId === s.id ? '📂' : '📁'}</span>
                <span className="db-session-item-name">{s.name}</span>
                <button
                  className="db-delete-btn"
                  onClick={e => handleDelete(s.id, e)}
                  title="Delete session"
                >✕</button>
              </li>
              
              {/* Folder Contents (Clips) */}
              {activeId === s.id && (
                <li className="db-session-folder-contents">
                  {s.clips && s.clips.length > 0 ? (
                    <ul className="db-sidebar-clips-list">
                      {s.clips.map(clip => (
                        <li 
                          key={clip.id} 
                          className="db-sidebar-clip-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJumpToClip(clip.start);
                            if (window.innerWidth <= 760) setSidebarOpen(false);
                          }}
                        >
                          <span className="db-sidebar-clip-icon">🎬</span>
                          <span className="db-sidebar-clip-label">{clip.label}</span>
                          <span className="db-sidebar-clip-time">{formatTime(clip.start)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="db-sidebar-empty-folder">No clips created</div>
                  )}
                </li>
              )}
            </React.Fragment>
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
            <button className="db-mob-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sessions">☰ Sessions</button>
            <span className="db-play-icon"></span>
            <p>Create a new session in the sidebar to get started.</p>
          </div>
        ) : (
          <>
            <div className="db-topbar">
              <button className="db-mob-sidebar-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sessions">☰</button>
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
                        <video
                          ref={videoRef}
                          className="db-video-player"
                          controls
                          src={directUrl}
                          onTimeUpdate={() => {
                            if (!videoRef.current) return;
                            setVideoCurrent(videoRef.current.currentTime || 0);
                          }}
                          onLoadedMetadata={() => {
                            if (!videoRef.current) return;
                            setVideoDuration(videoRef.current.duration || 0);
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="db-video-empty">
                      <span className="db-play-icon"></span>
                      <span className="db-video-add-label">Add a video to start clipping</span>
                      <span className="db-video-sub">Use YouTube/direct URL or upload a downloaded file</span>
                    </div>
                  )}

                  <div className="db-video-toolbar">
                    <button
                      type="button"
                      className="db-ghost-btn"
                      onClick={() => setShowVideoInput((prev) => !prev)}
                    >
                      {showVideoInput ? 'Close URL form' : 'Paste URL'}
                    </button>

                    <label className="db-upload-btn">
                      {uploadingVideo ? 'Uploading...' : 'Upload file'}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleUploadFromDevice}
                        disabled={uploadingVideo}
                      />
                    </label>

                    {hasVideo && (
                      <button
                        type="button"
                        className="db-remove-video"
                        onClick={handleRemoveVideo}
                        title="Remove video"
                      >
                        Remove video
                      </button>
                    )}
                  </div>

                  {showVideoInput && (
                    <div className="db-video-prompt">
                      <form className="db-video-url-form" onSubmit={handleSaveVideoUrl}>
                        <input
                          autoFocus
                          type="text"
                          className="db-video-url-input"
                          placeholder="Paste YouTube or direct video URL..."
                          value={videoInput}
                          onChange={e => setVideoInput(e.target.value)}
                        />
                        <button type="submit" className="db-video-confirm-btn">Save URL</button>
                        <button
                          type="button"
                          className="db-cancel-btn"
                          onClick={() => {
                            setShowVideoInput(false);
                            setVideoInput('');
                            setVideoError('');
                          }}
                        >
                          Cancel
                        </button>
                      </form>
                    </div>
                  )}

                  {videoStatus && <p className="db-video-note">{videoStatus}</p>}
                  {videoError && <p className="db-video-note db-video-note--error">{videoError}</p>}
                </div>

                <aside className="db-clips-sidebar">
                  <div className="db-clips-header">
                    <h3>Clips ({activeSession.clips.length})</h3>
                    {directUrl && <span className="db-time-display">{formatTime(videoCurrent)} / {formatTime(videoDuration)}</span>}
                  </div>

                  <form className="db-clip-form" onSubmit={handleSaveClip}>
                    <div className="db-clip-controls">
                      <button type="button" className="db-control-btn db-mark-start" onClick={() => markClipTime('start')}>
                        <span className="btn-label">Set Start</span>
                        <span className="btn-time">{formatTime(clipStart)}</span>
                      </button>
                      <button type="button" className="db-control-btn db-mark-end" onClick={() => markClipTime('end')}>
                        <span className="btn-label">Set End</span>
                        <span className="btn-time">{clipEnd ? formatTime(clipEnd) : '--:--'}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      className="db-clip-label-input"
                      placeholder="Clip Label..."
                      value={clipLabel}
                      onChange={(e) => setClipLabel(e.target.value)}
                    />

                    <button type="submit" className="db-save-clip-btn" disabled={savingClip}>
                      {savingClip ? 'Saving...' : 'Save Component'}
                    </button>
                  </form>

                  {loadingRemoteClips && <p className="db-status-msg">Syncing...</p>}
                  {clipStatus && <p className="db-status-msg">{clipStatus}</p>}
                  {clipError && <p className="db-status-msg db-error-msg">{clipError}</p>}

                  <div className="db-clips-list">
                    {activeSession.clips.length === 0 ? (
                      <div className="db-clips-empty">No clips created yet.</div>
                    ) : (
                      activeSession.clips.map((clip) => (
                        <div key={clip.id} className="db-clip-card">
                          <div className="db-card-top">
                             <span className="db-card-time">{formatTime(clip.start)} - {formatTime(clip.end)}</span>
                             <div className="db-card-actions">
                                <button type="button" onClick={() => handleJumpToClip(clip.start)}>Jump</button>
                                <button type="button" onClick={() => handleDeleteClip(clip.id, clip.dbId)}>Del</button>
                             </div>
                          </div>
                          <div className="db-card-label">{clip.label}</div>
                        </div>
                      ))
                    )}
                  </div>
                </aside>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

