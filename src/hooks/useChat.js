import { useState } from 'react';
import api from '../utils/api';

export function useChat(sessionId, setSessionData) {
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message, stateUpdates = null) => {
    if (!sessionId || !message?.trim()) return;
    
    setLoading(true);
    
    try {
      const res = await api.post('/api/chat', {
        sessionId,
        message,
        stateUpdates,
      });
      setSessionData(res.data.session);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
}
