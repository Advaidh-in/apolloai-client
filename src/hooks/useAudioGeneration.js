import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useAudioGeneration(sessionId, compositionState = null) {
  const [status, setStatus] = useState('idle'); // idle | generating | success | error
  const [audioData, setAudioData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync with persisted session audio if present
  useEffect(() => {
    if (compositionState?.audioUrl) {
      setAudioData({
        audioUrl: compositionState.audioUrl,
        coverArtUrl: compositionState.coverArtUrl,
        duration: compositionState.duration,
        title: compositionState.trackTitle || compositionState.title,
        promptUsed: compositionState.promptUsed,
        lyrics: compositionState.lyrics,
        validation: compositionState.validation
      });
      setStatus('success');
    } else if (status === 'success' && !compositionState?.audioUrl) {
      // Clear audio details if session composition was reset
      setStatus('idle');
      setAudioData(null);
    }
  }, [compositionState?.audioUrl]);

  const generateTrack = async () => {
    if (!sessionId) return;
    
    setStatus('generating');
    setAudioData(null);
    setErrorMsg('');

    try {
      const response = await api.post('/api/generate', { sessionId });
      setAudioData(response.data);
      setStatus('success');
    } catch (error) {
      console.error("Audio generation error:", error);
      setStatus('error');

      const status = error.response?.status;
      let detail = error.response?.data?.detail;

      if (typeof detail === 'string') {
        detail = detail.replace(/suno\s*api\s*error:\s*/gi, "Audio Engine Error: ");
        detail = detail.replace(/suno/gi, "Audio Engine");
      }

      if (status === 422 && detail?.includes("Session not found")) {
        // Session was wiped (server restart). Prompt a page refresh.
        setErrorMsg("Your session expired — please refresh the page to start a new one.");
      } else if (status === 400) {
        setErrorMsg("Not enough info yet. Keep answering Apollo's questions first!");
      } else if (status === 504 || error.code === 'ECONNABORTED') {
        setErrorMsg("The music generator is taking too long. Please try generating again.");
      } else {
        setErrorMsg(detail || "Failed to generate track. Please try again.");
      }
    }
  };

  const reset = () => {
    setStatus('idle');
    setAudioData(null);
    setErrorMsg('');
  };

  return { generateTrack, status, audioData, errorMsg, reset };
}
