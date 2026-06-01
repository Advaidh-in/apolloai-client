import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useSession() {
  const [sessionId, setSessionId] = useState(localStorage.getItem('apolloSessionId'));
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchOrCreateSession(forceNew = false) {
    setLoading(true);
    try {
      if (sessionId && !forceNew) {
        const res = await api.get(`/api/session/${sessionId}`);
        setSessionData(res.data.session);
      } else {
        // Post to /api/session/new (optionally passing force=true to bypass existing active session)
        const url = forceNew ? '/api/session/new?force=true' : '/api/session/new';
        const res = await api.post(url);
        setSessionId(res.data.sessionId);
        setSessionData(res.data.session);
        localStorage.setItem('apolloSessionId', res.data.sessionId);
      }
    } catch (err) {
      console.error("Session fetch/create error, trying force fresh:", err);
      try {
        const res = await api.post('/api/session/new?force=true');
        setSessionId(res.data.sessionId);
        setSessionData(res.data.session);
        localStorage.setItem('apolloSessionId', res.data.sessionId);
      } catch (innerErr) {
        console.error("Failed to initialize fresh session:", innerErr);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Only init if the user is authenticated (which is managed at App.jsx level)
    fetchOrCreateSession();
  }, [sessionId]);

  const resetSession = async () => {
    localStorage.removeItem('apolloSessionId');
    setSessionId(null);
    await fetchOrCreateSession(true);
  };

  return { sessionId, sessionData, setSessionData, loading, resetSession };
}
