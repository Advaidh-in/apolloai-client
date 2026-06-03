import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

export function useSession() {
  const [sessionId, setSessionId] = useState(localStorage.getItem('apolloSessionId'));
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use a ref for sessionId to avoid callback recreation
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const fetchOrCreateSession = useCallback(async (forceNew = false) => {
    setLoading(true);
    setError(null);
    const currentSessionId = sessionIdRef.current;
    try {
      if (currentSessionId && !forceNew) {
        const res = await api.get(`/api/session/${currentSessionId}`);
        setSessionData(res.data.session);
      } else {
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
        setError(innerErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve(); // avoid synchronous state updates
      if (active) {
        fetchOrCreateSession();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchOrCreateSession]);

  const resetSession = useCallback(async () => {
    localStorage.removeItem('apolloSessionId');
    setSessionId(null);
    await fetchOrCreateSession(true);
  }, [fetchOrCreateSession]);

  return { sessionId, sessionData, setSessionData, loading, resetSession, error };
}

