import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;
const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;
const AuthContext = createContext(null);

// Setup axios interceptor to always send token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('kuxtal_token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }
    const subJson = sub.toJSON();
    await axios.post(`${API}/api/push/subscribe`, {
      endpoint: subJson.endpoint,
      keys: subJson.keys
    }, { withCredentials: true });
  } catch (e) { console.log('Push subscribe error:', e); }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/auth/me`, { withCredentials: true });
      setUser(data);
      subscribePush(); // Auto-subscribe on every auth check
    } catch {
      localStorage.removeItem('kuxtal_token');
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const loginAdmin = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password }, { withCredentials: true });
    localStorage.setItem('kuxtal_token', data.token);
    setUser(data);
    subscribePush();
    return data;
  };

  const loginMember = async (contract_number, dpi) => {
    const { data } = await axios.post(`${API}/api/auth/member-login`, { contract_number, dpi }, { withCredentials: true });
    localStorage.setItem('kuxtal_token', data.token);
    setUser(data);
    subscribePush();
    return data;
  };

  const logout = async () => {
    try { await axios.post(`${API}/api/auth/logout`, {}, { withCredentials: true }); } catch {}
    localStorage.removeItem('kuxtal_token');
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAdmin, loginMember, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
