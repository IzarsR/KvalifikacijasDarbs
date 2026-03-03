import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]       = useState(() => localStorage.getItem('playlytic_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('playlytic_user'));

  const isLoggedIn = !!token;

  function login(newToken, newUsername) {
    localStorage.setItem('playlytic_token', newToken);
    localStorage.setItem('playlytic_user', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  }

  function logout() {
    localStorage.removeItem('playlytic_token');
    localStorage.removeItem('playlytic_user');
    setToken(null);
    setUsername(null);
  }

  async function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, username, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}