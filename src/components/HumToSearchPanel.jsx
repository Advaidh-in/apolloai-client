import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import {
  Mic, Upload, Square, Play, Pause, RefreshCw,
  Music2, CheckCircle2, AlertCircle, Loader2, ChevronDown
} from 'lucide-react';

// ─── Animated laser-scan overlay for spectrograms ───────────────────────────
function SpectrogramPanel({ url, label, sublabel }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col gap-1.5 flex-1 min-w-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="text-[var(--ink-secondary)]">{label}</span>
        <span className="text-[var(--accent-glow)] font-mono">{sublabel}</span>
      </div>
      <div className="relative rounded-xl overflow-hidden bg-[var(--canvas)] border border-[var(--hairline)] h-[90px] md:h-[120px] shadow-[inset_0_0_20px_rgba(124,58,237,0.12)]">
        {url ? (
          <>
            <img
              src={url}
              alt={label}
              className="w-full h-full object-cover opacity-90"
            />
            {/* Laser scan on hover */}
            {hovered && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-[var(--wave)] shadow-[0_0_10px_var(--wave),0_0_20px_var(--wave)] pointer-events-none"
                style={{ animation: 'laser-scan 1.8s linear infinite', left: '0%' }}
              />
            )}
            <div className="absolute bottom-1.5 left-2 text-[8px] font-mono uppercase tracking-wider text-[var(--ink-muted)] bg-[var(--canvas)]/70 px-1.5 py-0.5 rounded backdrop-blur-sm">
              Mel-Spectrogram
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2 text-[var(--ink-muted)]">
              <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
              <span className="text-[10px]">Generating...</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between text-[8px] text-[var(--ink-muted)] font-mono px-0.5">
        <span>20Hz</span><span>1kHz</span><span>8kHz</span>
      </div>
    </div>
  );
}

// ─── Mini audio player for the 30s preview ──────────────────────────────────
function PreviewPlayer({ url }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onLoaded = () => setDuration(el.duration || 30);
    const onEnd = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('ended', onEnd);
    };
  }, [url]);

  const toggle = () => {
    if (playing) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setPlaying(!playing);
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)]">
      <audio ref={audioRef} src={url} preload="metadata" crossOrigin="anonymous" />
      <button
        onClick={toggle}
        className="w-8 h-8 shrink-0 rounded-full bg-[var(--wave)] hover:bg-[var(--wave-muted)] flex items-center justify-center text-white transition-all cursor-pointer active:scale-95"
      >
        {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max={duration}
          value={time}
          onChange={e => { audioRef.current.currentTime = Number(e.target.value); setTime(Number(e.target.value)); }}
          className="w-full h-[3px] audio-scrubber cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-mono text-[var(--ink-muted)]">
          <span>{fmt(time)}</span>
          <span className="text-[var(--wave)] font-semibold">30s Preview</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Confidence badge ────────────────────────────────────────────────────────
function ConfidenceBadge({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 85 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
    : pct >= 65 ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
    : 'text-[var(--ink-secondary)] bg-[var(--surface)] border-[var(--hairline)]';
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% match
    </span>
  );
}

// ─── Source badge ────────────────────────────────────────────────────────────
function SourceBadge({ source }) {
  const map = {
    acrcloud: { label: 'ACRCloud', cls: 'text-[var(--accent-glow)] bg-[var(--accent-muted)] border-[var(--accent)]' },
    audd: { label: 'AudD', cls: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' },
    itunes_search: { label: 'iTunes Search', cls: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' },
  };
  const info = map[source] || { label: source, cls: 'text-[var(--ink-secondary)] bg-[var(--surface)] border-[var(--hairline)]' };
  return (
    <span className={`text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${info.cls}`}>
      {info.label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export default function HumToSearchPanel() {
  const [tab, setTab] = useState('record'); // 'record' | 'upload' | 'search'

  // Recording state
  const [recState, setRecState] = useState('idle'); // 'idle' | 'recording' | 'stopped'
  const [recSeconds, setRecSeconds] = useState(0);
  const [recBlob, setRecBlob] = useState(null);
  const recTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Search by name state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Request state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Recording handlers ────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecBlob(blob);
        setRecState('stopped');
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecState('recording');
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions and try again.');
    }
  };

  const stopRecording = () => {
    clearInterval(recTimerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const resetRecording = () => {
    setRecBlob(null);
    setRecState('idle');
    setRecSeconds(0);
    setResult(null);
    setError('');
  };

  // ── Upload handlers ───────────────────────────────────────────────────────
  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setUploadFile(file); setResult(null); setError(''); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setUploadFile(file); setResult(null); setError(''); }
  };

  const resetUpload = () => {
    setUploadFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Submit Humming/Upload ──────────────────────────────────────────────────
  const handleIdentify = async () => {
    const audioSource = tab === 'record' ? recBlob : uploadFile;
    if (!audioSource) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      if (tab === 'record') {
        formData.append('audio', recBlob, 'hum_recording.webm');
      } else {
        formData.append('audio', uploadFile, uploadFile.name);
      }

      const res = await api.post('/api/tracks/search-melody', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      setResult(res.data);
    } catch (err) {
      console.error('[HumToSearch] Error:', err);
      setError(err.response?.data?.detail || 'Melody identification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit Text Search By Name ─────────────────────────────────────────────
  const handleSearchByName = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError('');
    try {
      const res = await api.post('/api/tracks/search-by-name', { query: searchQuery.trim() });
      
      // Preserve the hum spectrogram if we hummed/uploaded previously
      const finalHumSpec = result && result.hum_spectrogram_url ? result.hum_spectrogram_url : null;
      const finalHumThumb = result && result.hum_spectrogram_thumb_url ? result.hum_spectrogram_thumb_url : null;

      setResult({
        match_found: true,
        title: res.data.title,
        artist: res.data.artist,
        album: res.data.album,
        confidence: res.data.confidence,
        preview_url: res.data.preview_url,
        source: res.data.source,
        hum_spectrogram_url: finalHumSpec,
        hum_spectrogram_thumb_url: finalHumThumb,
        reference_spectrogram_url: res.data.reference_spectrogram_url,
        reference_spectrogram_thumb_url: res.data.reference_spectrogram_thumb_url
      });
    } catch (err) {
      console.error('[SearchByName] Error:', err);
      setError(err.response?.data?.detail || 'Search failed. Check your query or spelling and try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTryAnother = () => {
    setResult(null);
    setError('');
    setSearchQuery('');
    if (tab === 'record') resetRecording();
    else if (tab === 'upload') resetUpload();
  };

  const fmtSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      {/* Laser scan keyframe */}
      <style>{`
        @keyframes laser-scan {
          0% { left: 0%; }
          100% { left: 100%; }
        }
        @keyframes rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div className="flex flex-col items-center min-h-full p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-[760px] flex flex-col gap-5">

          {/* Header */}
          <div className="text-center animate-message-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--wave-muted)] mb-3 shadow-[0_0_24px_rgba(6,182,212,0.25)]">
              <Mic size={24} className="text-[var(--wave)]" />
            </div>
            <h2 className="text-[22px] md:text-[26px] font-bold text-[var(--ink)] font-['Space_Grotesk'] tracking-tight">
              Hum to Search
            </h2>
            <p className="text-[13px] text-[var(--ink-secondary)] mt-1 max-w-[460px] mx-auto leading-relaxed">
              Hum or sing a melody, upload an audio clip, or search directly by name. Apollo matches using real APIs with no mocks.
            </p>
          </div>

          {/* Tab switcher */}
          {!result && (
            <div className="flex gap-2 p-1 bg-[var(--surface)] rounded-xl border border-[var(--hairline)] self-center animate-message-in">
              {['record', 'upload', 'search'].map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all cursor-pointer capitalize ${
                    tab === t
                      ? 'bg-[var(--canvas)] text-[var(--ink)] shadow-sm border border-[var(--hairline)]'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                  }`}
                >
                  {t === 'record' ? <Mic size={14} /> : t === 'upload' ? <Upload size={14} /> : <Music2 size={14} />}
                  {t === 'record' ? 'Record' : t === 'upload' ? 'Upload' : 'Search by Name'}
                </button>
              ))}
            </div>
          )}

          {/* ── RECORD TAB ── */}
          {tab === 'record' && !result && (
            <div className="glass-panel rounded-2xl border border-[var(--hairline)] p-6 flex flex-col items-center gap-5 animate-message-in">
              {/* Visualiser ring */}
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                recState === 'recording'
                  ? 'bg-red-950/30 border-2 border-red-500 shadow-[0_0_32px_rgba(239,68,68,0.4)]'
                  : recState === 'stopped'
                  ? 'bg-[var(--accent-muted)] border-2 border-[var(--accent)] shadow-[0_0_24px_rgba(124,58,237,0.3)]'
                  : 'bg-[var(--surface)] border-2 border-[var(--hairline)]'
              }`}>
                {recState === 'recording' && (
                  <span
                    className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500"
                    style={{ animation: 'rec-pulse 1s ease-in-out infinite' }}
                  />
                )}
                <Mic size={32} className={
                  recState === 'recording' ? 'text-red-400'
                  : recState === 'stopped' ? 'text-[var(--accent-glow)]'
                  : 'text-[var(--ink-muted)]'
                } />
              </div>

              {/* Timer */}
              {recState === 'recording' && (
                <div className="font-mono text-[28px] font-bold text-red-400 tracking-widest">
                  {fmtSec(recSeconds)}
                </div>
              )}
              {recState === 'stopped' && (
                <div className="text-[13px] text-[var(--ink-secondary)] font-mono">
                  Recorded {fmtSec(recSeconds)} — ready to identify
                </div>
              )}
              {recState === 'idle' && (
                <p className="text-[13px] text-[var(--ink-muted)] text-center max-w-[280px]">
                  Click <strong>Record</strong> and hum or sing any melody for 5–15 seconds, then stop.
                </p>
              )}

              {/* Recorded audio preview */}
              {recState === 'stopped' && recBlob && (
                <div className="w-full">
                  <audio
                    src={URL.createObjectURL(recBlob)}
                    controls
                    className="w-full h-8 rounded-lg opacity-70"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {recState === 'idle' && (
                  <button
                    onClick={startRecording}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold text-[14px] transition-all cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(239,68,68,0.3)]"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    Record
                  </button>
                )}
                {recState === 'recording' && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--surface)] border border-[var(--hairline)] hover:border-red-500/40 text-[var(--ink)] rounded-xl font-semibold text-[14px] transition-all cursor-pointer active:scale-95"
                  >
                    <Square size={14} fill="currentColor" />
                    Stop
                  </button>
                )}
                {recState === 'stopped' && (
                  <>
                    <button
                      onClick={handleIdentify}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] disabled:opacity-50 text-white rounded-xl font-semibold text-[14px] transition-all cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(124,58,237,0.35)] accent-glow-button"
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <Music2 size={15} />}
                      {loading ? 'Identifying...' : 'Identify Song'}
                    </button>
                    <button
                      onClick={resetRecording}
                      className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--hairline)] hover:border-[var(--hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-xl text-[14px] transition-all cursor-pointer active:scale-95"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </>
                )}
              </div>

              {recState === 'idle' && (
                <p className="text-[10px] text-[var(--ink-muted)] text-center">
                  Requires microphone permission (HTTPS or localhost)
                </p>
              )}
            </div>
          )}

          {/* ── UPLOAD TAB ── */}
          {tab === 'upload' && !result && (
            <div className="animate-message-in flex flex-col gap-4">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => !uploadFile && fileInputRef.current?.click()}
                className={`relative glass-panel rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-all duration-200 ${
                  isDragOver
                    ? 'border-[var(--wave)] shadow-[0_0_32px_rgba(6,182,212,0.2)] bg-[var(--wave-muted)]/10'
                    : uploadFile
                    ? 'border-[var(--accent)] shadow-[0_0_24px_rgba(124,58,237,0.15)]'
                    : 'border-[var(--hairline)] hover:border-[var(--accent)]/40 cursor-pointer'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,.m4a,.flac,.webm"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  uploadFile ? 'bg-[var(--accent-muted)] text-[var(--accent-glow)]' : 'bg-[var(--surface)] text-[var(--ink-muted)]'
                }`}>
                  <Upload size={22} />
                </div>
                {uploadFile ? (
                  <>
                    <p className="text-[14px] font-semibold text-[var(--ink)] text-center truncate max-w-full">
                      {uploadFile.name}
                    </p>
                    <p className="text-[12px] text-[var(--ink-secondary)]">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] font-semibold text-[var(--ink)]">
                      Drop audio here or <span className="text-[var(--accent-glow)]">browse</span>
                    </p>
                    <p className="text-[12px] text-[var(--ink-muted)]">
                      MP3, WAV, OGG, M4A, FLAC — any song snippet works
                    </p>
                  </>
                )}
              </div>

              {uploadFile && (
                <div className="flex gap-3">
                  <button
                    onClick={handleIdentify}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] hover:bg-[var(--accent-glow)] disabled:opacity-50 text-white rounded-xl font-semibold text-[14px] transition-all cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(124,58,237,0.35)] accent-glow-button"
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Music2 size={15} />}
                    {loading ? 'Identifying...' : 'Identify Song'}
                  </button>
                  <button
                    onClick={resetUpload}
                    className="px-4 py-3 bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── SEARCH BY NAME TAB ── */}
          {tab === 'search' && !result && (
            <div className="glass-panel rounded-2xl border border-[var(--hairline)] p-6 flex flex-col gap-4 animate-message-in">
              <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">
                Directly search for any song globally to hear its preview and render its real Mel-Spectrogram.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">
                  Song Title / Artist Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Daft Punk Get Lucky"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSearchByName(); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] focus:border-[var(--accent)] text-[13px] text-[var(--ink)] focus:outline-none transition-all"
                  />
                  <button
                    onClick={handleSearchByName}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white rounded-xl text-[13px] font-semibold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-[0_4px_16px_rgba(124,58,237,0.3)] disabled:opacity-50"
                  >
                    {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <Music2 size={14} />}
                    Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── LOADING STATE ── */}
          {loading && (
            <div className="glass-panel rounded-2xl border border-[var(--accent)]/30 p-6 flex flex-col items-center gap-4 animate-message-in">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20" />
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                <div className="absolute inset-[10px] rounded-full border-2 border-[var(--wave)]/30" />
                <div className="absolute inset-[10px] rounded-full border-2 border-[var(--wave)] border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:0.7s]" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[var(--ink)] font-['Space_Grotesk']">
                  Analysing audio...
                </p>
                <p className="text-[12px] text-[var(--ink-secondary)] mt-1">
                  Converting format → generating spectrogram → recognising melody → fetching preview
                </p>
              </div>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {error && !loading && !searchLoading && (
            <div className="glass-panel rounded-xl border border-red-500/30 p-4 flex items-start gap-3 text-red-400 animate-message-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold">Search / Identification failed</p>
                <p className="text-[12px] text-[var(--ink-secondary)] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* ── RESULTS (AUTO-MATCH FAILURE) ── */}
          {result && !result.match_found && !loading && (
            <div className="flex flex-col gap-4 animate-message-in">
              <div className="glass-panel rounded-2xl border border-red-500/30 p-5 flex flex-col gap-4 shadow-[0_0_32px_rgba(239,68,68,0.08)] bg-red-950/5">
                <div className="flex items-start gap-3 text-red-400">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[14px] font-semibold">No Automated Match</h4>
                    <p className="text-[12px] text-[var(--ink-secondary)] mt-0.5">
                      {result.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-[var(--hairline)] pt-4 mt-2">
                  <label className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">
                    Type Song Name to Search & Compare anyway
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Billie Eilish Bad Guy"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSearchByName(); }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] focus:border-[var(--accent)] text-[13px] text-[var(--ink)] focus:outline-none transition-all"
                    />
                    <button
                      onClick={handleSearchByName}
                      disabled={searchLoading || !searchQuery.trim()}
                      className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white rounded-xl text-[13px] font-semibold transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-[0_4px_16px_rgba(124,58,237,0.3)] disabled:opacity-50"
                    >
                      {searchLoading ? <Loader2 size={14} className="animate-spin" /> : <Music2 size={14} />}
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Render the hum spectrogram alone so they can see their input! */}
              {result.hum_spectrogram_url && (
                <div className="glass-panel rounded-2xl border border-[var(--hairline)] p-5">
                  <p className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)] mb-3">
                    Your Hum Spectrogram
                  </p>
                  <div className="max-w-[350px]">
                    <SpectrogramPanel
                      url={result.hum_spectrogram_url}
                      label="Your Hum / Upload"
                      sublabel="Input"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleTryAnother}
                className="flex items-center justify-center gap-2 py-3 bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-xl text-[13px] font-medium transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} />
                Try Another Song
              </button>
            </div>
          )}

          {/* ── RESULTS (SUCCESSFUL MATCH OR SEARCH MATCH) ── */}
          {result && result.match_found && !loading && (
            <div className="flex flex-col gap-4 animate-message-in">
              {/* Match card */}
              <div className="glass-panel rounded-2xl border border-[var(--accent)] p-5 shadow-[0_0_32px_rgba(124,58,237,0.15)]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <CheckCircle2 size={16} className="text-[var(--success)] shrink-0" />
                      <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">
                        Song Identified
                      </span>
                      <SourceBadge source={result.source} />
                    </div>
                    <h3 className="text-[20px] font-bold text-[var(--ink)] font-['Space_Grotesk'] tracking-tight leading-tight">
                      {result.title}
                    </h3>
                    <p className="text-[14px] text-[var(--ink-secondary)] mt-0.5">
                      {result.artist}
                    </p>
                    {result.album && (
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 font-mono">
                        {result.album}
                      </p>
                    )}
                  </div>
                  <ConfidenceBadge score={result.confidence} />
                </div>

                {/* Preview player */}
                {result.preview_url && (
                  <PreviewPlayer url={result.preview_url} />
                )}
              </div>

              {/* Side-by-side spectrograms */}
              <div className="glass-panel rounded-2xl border border-[var(--hairline)] p-4 md:p-5">
                <p className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)] mb-3">
                  Mel-Spectrogram Comparison
                </p>
                <div className="flex gap-3 md:gap-4 flex-wrap md:flex-nowrap">
                  {result.hum_spectrogram_url ? (
                    <>
                      <SpectrogramPanel
                        url={result.hum_spectrogram_url}
                        label="Your Hum / Upload"
                        sublabel="Input"
                      />
                      <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                        <div className="w-px h-full bg-[var(--hairline)] hidden md:block" />
                        <span className="text-[9px] font-mono text-[var(--ink-muted)] bg-[var(--canvas)] px-1 py-0.5 rounded">vs</span>
                        <div className="w-px h-full bg-[var(--hairline)] hidden md:block" />
                      </div>
                    </>
                  ) : null}
                  <SpectrogramPanel
                    url={result.reference_spectrogram_url}
                    label="Reference Song"
                    sublabel="Match"
                  />
                </div>
                <p className="text-[10px] text-[var(--ink-muted)] mt-3 text-center">
                  Hover over a spectrogram to scan it. Reference audio sourced via iTunes Search API.
                </p>
              </div>

              {/* Try another */}
              <button
                onClick={handleTryAnother}
                className="flex items-center justify-center gap-2 py-3 bg-[var(--surface)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-xl text-[13px] font-medium transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} />
                Try Another Song
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
