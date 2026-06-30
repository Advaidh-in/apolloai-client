import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import {
  ShieldCheck, Upload, RefreshCw, AlertCircle, Loader2,
  CheckCircle2, AlertTriangle, Cpu, Activity, Clock, Zap
} from 'lucide-react';

// ─── Animated status steps during loading ───────────────────────────────────
const STEPS = [
  { label: 'Scanning embedded metadata watermarks...', duration: 1600 },
  { label: 'Classifying audio origin...', duration: 2200 },
  { label: 'Analysing acoustic features...', duration: 1800 },
  { label: 'Running similarity scan...', duration: 2500 },
  { label: 'Compiling verification report...', duration: 800 },
];

function LoadingSteps({ active }) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    let idx = 0;
    let timeoutId;
    const advance = () => {
      setStepIdx(i => {
        idx = i + 1;
        return i + 1;
      });
      if (idx < STEPS.length) {
        timeoutId = setTimeout(advance, STEPS[idx]?.duration || 1000);
      }
    };
    timeoutId = setTimeout(advance, STEPS[0].duration);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [active]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {STEPS.map((step, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 text-[12px] transition-all duration-300 ${
            i < stepIdx ? 'text-[var(--success)]' : i === stepIdx ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)]'
          }`}
        >
          {i < stepIdx ? (
            <CheckCircle2 size={13} className="text-[var(--success)] shrink-0" />
          ) : i === stepIdx ? (
            <Loader2 size={13} className="animate-spin text-[var(--accent)] shrink-0" />
          ) : (
            <div className="w-[13px] h-[13px] rounded-full border border-[var(--hairline)] shrink-0" />
          )}
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Origin badge ────────────────────────────────────────────────────────────
function OriginBadge({ originType, provider, status }) {
  const configs = {
    AI_GENERATED: {
      label: 'AI Generated',
      cls: 'text-[var(--accent-glow)] bg-[var(--accent-muted)] border-[var(--accent)]',
      icon: <Cpu size={11} />,
    },
    AI_ASSISTED: {
      label: 'AI Assisted',
      cls: 'text-purple-300 bg-purple-950/40 border-purple-500/30',
      icon: <Cpu size={11} />,
    },
    HUMAN_RECORDED: {
      label: 'Human Recorded',
      cls: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
      icon: <CheckCircle2 size={11} />,
    },
    IMPORTED: {
      label: 'Imported / Unknown',
      cls: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
      icon: <AlertTriangle size={11} />,
    },
  };

  const statusCfg = {
    VERIFIED: { label: 'Verified', cls: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' },
    UNVERIFIED: { label: 'Unverified', cls: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
    PENDING: { label: 'Pending', cls: 'text-amber-400 bg-amber-950/40 border-amber-500/30 animate-pulse' },
  };

  const cfg = configs[originType] || configs.IMPORTED;
  const stCfg = statusCfg[status] || statusCfg.PENDING;

  return (
    <div className="flex flex-wrap gap-2">
      <span className={`flex items-center gap-1 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${cfg.cls}`}>
        {cfg.icon}
        {cfg.label}
      </span>
      <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${stCfg.cls}`}>
        {stCfg.label}
      </span>
      {provider && provider !== 'unknown' && provider !== 'none' && (
        <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-secondary)]">
          Apollo AI
        </span>
      )}
    </div>
  );
}

// ─── Confidence bar ──────────────────────────────────────────────────────────
function ConfidenceBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-[var(--accent)]';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[11px]">
        <span className="text-[var(--ink-secondary)] font-medium">Confidence Score</span>
        <span className="font-mono font-bold text-[var(--ink)]">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Acoustic metrics grid ───────────────────────────────────────────────────
function LibrosaGrid({ metrics }) {
  if (!metrics || metrics.error) return null;

  const cells = [
    {
      icon: <Clock size={14} className="text-[var(--accent-glow)]" />,
      label: 'Duration',
      value: metrics.duration != null ? `${metrics.duration.toFixed(1)}s` : '—',
    },
    {
      icon: <Activity size={14} className="text-[var(--wave)]" />,
      label: 'Tempo',
      value: metrics.tempo_bpm != null ? `${metrics.tempo_bpm} BPM` : '—',
    },
    {
      icon: <Zap size={14} className="text-amber-400" />,
      label: 'Spectral Centroid',
      value: metrics.spectral_centroid_hz != null
        ? `${(metrics.spectral_centroid_hz / 1000).toFixed(2)} kHz`
        : '—',
    },
    {
      icon: <Activity size={14} className="text-purple-400" />,
      label: 'Zero Crossing Rate',
      value: metrics.zero_crossing_rate != null
        ? metrics.zero_crossing_rate.toFixed(5)
        : '—',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">
        Acoustic Analysis
      </p>
      <div className="grid grid-cols-2 gap-2">
        {cells.map((cell, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)]"
          >
            <div className="mt-0.5 shrink-0">{cell.icon}</div>
            <div>
              <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--ink-muted)]">
                {cell.label}
              </p>
              <p className="text-[13px] font-mono font-semibold text-[var(--ink)] mt-0.5">
                {cell.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Plagiarism / similarity card ────────────────────────────────────────────
function PlagiarismCard({ plagiarism }) {
  if (!plagiarism || Object.keys(plagiarism).length === 0) return null;

  const { plagiarismScore, validationPassed, sha256, message, matchedTrack } = plagiarism;
  const noScore = plagiarismScore === null || plagiarismScore === undefined;
  const pct = noScore ? null : Math.round(plagiarismScore * 100);

  let badgeCls, badgeLabel, badgeIcon;
  if (validationPassed === null || validationPassed === undefined) {
    badgeCls = 'text-zinc-400 bg-zinc-800 border-zinc-700';
    badgeLabel = 'Unverified';
    badgeIcon = <AlertTriangle size={11} />;
  } else if (validationPassed === false) {
    badgeCls = 'text-red-400 bg-red-950/40 border-red-500/30';
    badgeLabel = 'Match Detected';
    badgeIcon = <AlertCircle size={11} />;
  } else {
    badgeCls = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
    badgeLabel = 'Original';
    badgeIcon = <CheckCircle2 size={11} />;
  }

  const barColor = noScore ? 'bg-zinc-600'
    : pct > 80 ? 'bg-red-500'
    : pct > 40 ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className={`glass-panel rounded-2xl border p-5 flex flex-col gap-4 ${
      validationPassed === false
        ? 'border-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.08)]'
        : validationPassed === true
        ? 'border-emerald-500/20'
        : 'border-[var(--hairline)]'
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">
          Similarity Scan
        </p>
        <span className={`flex items-center gap-1 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${badgeCls}`}>
          {badgeIcon}
          {badgeLabel}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-[var(--ink-secondary)] font-medium">Similarity Score</span>
          <span className="font-mono font-bold text-[var(--ink)]">
            {noScore ? 'N/A' : `${pct}%`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: noScore ? '0%' : `${pct}%` }}
          />
        </div>
      </div>

      {matchedTrack && (
        <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-[var(--canvas)] border border-red-500/20">
          <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--ink-muted)]">Closest Match</p>
          <p className="text-[13px] font-semibold text-[var(--ink)] mt-0.5">{matchedTrack.title}</p>
          <p className="text-[11px] text-[var(--ink-secondary)]">{matchedTrack.artist}</p>
        </div>
      )}

      {message && (
        <p className="text-[11px] text-[var(--ink-muted)] leading-relaxed">{message}</p>
      )}

      {sha256 && (
        <div className="flex flex-col gap-1">
          <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--ink-muted)]">Content Hash</p>
          <p className="text-[9px] font-mono text-[var(--ink-secondary)] break-all leading-relaxed">{sha256}</p>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export default function AudioVerifyPanel() {
  const [file, setFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('audio', file, file.name);
      const res = await api.post('/api/tracks/verify-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });
      setResult(res.data);
    } catch (err) {
      console.error('[AudioVerify] Error:', err);
      setError(err.response?.data?.detail || 'Verification failed. Please try a different file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-full p-4 md:p-8">
      <div className="w-full max-w-[640px] flex flex-col gap-5">

        {/* Header */}
        <div className="text-center animate-message-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-950/40 mb-3 shadow-[0_0_24px_rgba(16,185,129,0.2)] border border-emerald-500/20">
            <ShieldCheck size={24} className="text-emerald-400" />
          </div>
          <h2 className="text-[22px] md:text-[26px] font-bold text-[var(--ink)] font-['Space_Grotesk'] tracking-tight">
            Audio Verification
          </h2>
          <p className="text-[13px] text-[var(--ink-secondary)] mt-1 max-w-[440px] mx-auto leading-relaxed">
            Upload any audio file. Apollo analyses its origin, detects AI watermarks, extracts acoustic signatures, and runs a similarity scan.
          </p>
        </div>

        {/* Drop zone */}
        {!result && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            className={`relative glass-panel rounded-2xl border-2 border-dashed p-8 md:p-10 flex flex-col items-center gap-3 transition-all duration-200 animate-message-in ${
              isDragOver
                ? 'border-emerald-500 shadow-[0_0_32px_rgba(16,185,129,0.2)] bg-emerald-950/10'
                : file
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
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              file ? 'bg-[var(--accent-muted)] text-[var(--accent-glow)]' : 'bg-[var(--surface)] text-[var(--ink-muted)]'
            }`}>
              {file ? <ShieldCheck size={26} /> : <Upload size={26} />}
            </div>

            {file ? (
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[var(--ink)] truncate max-w-[300px]">{file.name}</p>
                <p className="text-[12px] text-[var(--ink-secondary)] mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to verify
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[var(--ink)]">
                  Drop audio file here or <span className="text-[var(--accent-glow)]">browse</span>
                </p>
                <p className="text-[12px] text-[var(--ink-muted)] mt-1">
                  MP3, WAV, OGG, M4A, FLAC — any audio format accepted
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {file && !result && !loading && (
          <div className="flex gap-3 animate-message-in">
            <button
              onClick={handleVerify}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white rounded-xl font-semibold text-[14px] transition-all cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(124,58,237,0.35)] accent-glow-button"
            >
              <ShieldCheck size={16} />
              Run Verification
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="glass-panel rounded-2xl border border-[var(--accent)]/30 p-6 flex flex-col gap-4 animate-message-in">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--ink)] font-['Space_Grotesk']">
                  Verifying audio...
                </p>
                <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                  This may take 20–45 seconds
                </p>
              </div>
            </div>
            <LoadingSteps active={loading} />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="glass-panel rounded-xl border border-[var(--error)]/30 p-4 flex items-start gap-3 text-[var(--error)] animate-message-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold">Verification failed</p>
              <p className="text-[12px] text-[var(--ink-secondary)] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="flex flex-col gap-4 animate-message-in">
            {/* Origin card */}
            <div className={`glass-panel rounded-2xl p-5 border ${
              result.origin_type === 'AI_GENERATED'
                ? 'border-[var(--accent)] shadow-[0_0_32px_rgba(124,58,237,0.15)]'
                : result.origin_type === 'HUMAN_RECORDED'
                ? 'border-emerald-500/30 shadow-[0_0_32px_rgba(16,185,129,0.1)]'
                : 'border-amber-500/30 shadow-[0_0_24px_rgba(245,158,11,0.08)]'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className={
                  result.origin_type === 'AI_GENERATED' ? 'text-[var(--accent-glow)]'
                  : result.origin_type === 'HUMAN_RECORDED' ? 'text-emerald-400'
                  : 'text-amber-400'
                } />
                <span className="text-[11px] uppercase font-bold tracking-widest text-[var(--ink-muted)]">
                  Verification Report
                </span>
              </div>

              <OriginBadge
                originType={result.origin_type}
                provider={result.generation_provider}
                status={result.verification_status}
              />

              <div className="mt-4">
                <ConfidenceBar score={result.confidence_score} />
              </div>
            </div>

            {/* Acoustic metrics */}
            <div className="glass-panel rounded-2xl border border-[var(--hairline)] p-5">
              <LibrosaGrid metrics={result.acousticAnalysis} />
            </div>

            {/* Similarity scan */}
            <PlagiarismCard plagiarism={result.plagiarism} />

            {/* Verify another */}
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 py-3 bg-[var(--surface)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-xl text-[13px] font-medium transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} />
              Verify Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
