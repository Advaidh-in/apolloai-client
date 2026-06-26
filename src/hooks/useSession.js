import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrCreateSession = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const storedId = localStorage.getItem('apollo_session_id');
      if (storedId && !force) {
        try {
          const res = await api.get(`/api/session/${storedId}`);
          setSessionId(storedId);
          setSessionData(res.data.session);
          setLoading(false);
          return;
        } catch (err) {
          console.warn("Stored session not found or invalid, creating new one:", err);
          localStorage.removeItem('apollo_session_id');
        }
      }

      const res = await api.post(`/api/session/new${force ? '?force=true' : ''}`);
      localStorage.setItem('apollo_session_id', res.data.sessionId);
      setSessionId(res.data.sessionId);
      setSessionData(res.data.session);
    } catch (err) {
      console.error("Failed to initialize session:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve(); // avoid synchronous state updates
      if (active) {
        fetchOrCreateSession(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, [fetchOrCreateSession]);

  const resetSession = useCallback(async () => {
    localStorage.removeItem('apollo_session_id');
    setSessionId(null);
    setSessionData(null);
    await fetchOrCreateSession(true);
  }, [fetchOrCreateSession]);

  return { sessionId, sessionData, setSessionData, loading, resetSession, error };
}

