import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export function useAudioGeneration(sessionId, compositionState = null, setSessionData = null) {
  const [localStatus, setLocalStatus] = useState('idle'); // idle | generating | success | error
  const [localAudioData, setLocalAudioData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const hasServerAudio = !!compositionState?.audioUrl;

  const status = hasServerAudio ? 'success' : localStatus;

  const audioData = hasServerAudio
    ? {
        audioUrl: compositionState.audioUrl,
        coverArtUrl: compositionState.coverArtUrl,
        duration: compositionState.duration,
        title: compositionState.trackTitle || compositionState.title,
        promptUsed: compositionState.promptUsed,
        lyrics: compositionState.lyrics,
        validation: compositionState.validation,
        certificateUrl: compositionState.certificateUrl,
        plagiarismReportUrl: compositionState.plagiarismReportUrl,
        trackId: compositionState.trackId,
        spectrogramUrl: compositionState.spectrogramUrl,
        spectrogramThumbUrl: compositionState.spectrogramThumbUrl
      }
    : localAudioData;

  useEffect(() => {
    if (!compositionState?.audioUrl && localStatus === 'success') {
      reset();
    }
  }, [compositionState?.audioUrl, localStatus]);

  // Wrapped in useCallback so the function reference is stable across renders.
  // Without this, generateTrack is recreated every render, causing the useEffect
  // in App.jsx (which lists it as a dependency) to re-fire — making duplicate API calls.
  const generateTrack = useCallback(async () => {
    if (!sessionId) return;

    setLocalStatus('generating');
    setLocalAudioData(null);
    setErrorMsg('');

    try {
      const response = await api.post('/api/generate', { sessionId });
      setLocalAudioData(response.data);
      setLocalStatus('success');
      if (setSessionData) {
        setSessionData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            compositionState: {
              ...prev.compositionState,
              audioUrl: response.data.audioUrl,
              coverArtUrl: response.data.coverArtUrl,
              duration: response.data.duration,
              trackTitle: response.data.title,
              promptUsed: response.data.promptUsed,
              lyrics: response.data.lyrics,
              validation: response.data.validation,
              trackId: response.data.trackId
            }
          };
        });
      }
    } catch (error) {
      console.error("Audio generation error:", error);
      setLocalStatus('error');

      const httpStatus = error.response?.status;
      let detail = error.response?.data?.detail;

      if (typeof detail === 'string') {
        detail = detail.replace(/(suno|udio|replicate)\s*api\s*error:\s*/gi, "Audio Engine Error: ");
        detail = detail.replace(/(suno|udio|replicate)/gi, "Audio Engine");
      }

      if (httpStatus === 422 && detail?.includes("Session not found")) {
        setErrorMsg("Your session expired — please refresh the page to start a new one.");
      } else if (httpStatus === 400) {
        setErrorMsg("Not enough info yet. Keep answering Apollo's questions first!");
      } else if (httpStatus === 504 || error.code === 'ECONNABORTED') {
        setErrorMsg("The music generator is taking too long. Please try generating again.");
      } else if (httpStatus === 500 || detail?.includes("Generation failed") || detail?.includes("credits") || detail?.includes("insufficient")) {
        setErrorMsg("We are experiencing high generation demand. Please try again in a few moments.");
      } else {
        setErrorMsg(detail || "Failed to generate track. Please try again.");
      }
    }
  }, [sessionId, setSessionData]);

  const reset = useCallback(() => {
    setLocalStatus('idle');
    setLocalAudioData(null);
    setErrorMsg('');
  }, []);

  return { generateTrack, status, audioData, errorMsg, reset };
}
