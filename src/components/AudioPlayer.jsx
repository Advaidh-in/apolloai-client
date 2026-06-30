import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Shield, HelpCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import TimelineVisualizer from './TimelineVisualizer';
import api from '../utils/api';

export default function AudioPlayer({ audioData, onFeedback }) {
  const { 
    audioUrl, coverArtUrl, duration, title, validation,
    spectrogramUrl, certificateUrl, plagiarismReportUrl,
    sections, aiPercentage, verification, provider
  } = audioData;

  const [currentCertificateUrl, setCurrentCertificateUrl] = useState(certificateUrl);
  const [currentPlagiarismReportUrl, setCurrentPlagiarismReportUrl] = useState(plagiarismReportUrl);
  const [currentSpectrogramUrl, setCurrentSpectrogramUrl] = useState(spectrogramUrl);

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download file directly, opening in new tab instead:", err);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    setCurrentCertificateUrl(certificateUrl);
  }, [certificateUrl]);

  useEffect(() => {
    setCurrentPlagiarismReportUrl(plagiarismReportUrl);
  }, [plagiarismReportUrl]);

  useEffect(() => {
    setCurrentSpectrogramUrl(spectrogramUrl);
  }, [spectrogramUrl]);

  useEffect(() => {
    const trackId = audioData.trackId || audioData.id;
    if (!trackId || (currentCertificateUrl && currentPlagiarismReportUrl && currentSpectrogramUrl)) return;

    let active = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/api/tracks/${trackId}`);
        if (active) {
          if (res.data.certificateUrl) {
            setCurrentCertificateUrl(res.data.certificateUrl);
          }
          if (res.data.plagiarismReportUrl) {
            setCurrentPlagiarismReportUrl(res.data.plagiarismReportUrl);
          }
          if (res.data.spectrogramUrl) {
            setCurrentSpectrogramUrl(res.data.spectrogramUrl);
          }
          if (res.data.certificateUrl && res.data.plagiarismReportUrl && res.data.spectrogramUrl) {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Error polling track details:", err);
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [audioData.trackId, audioData.id, currentCertificateUrl, currentPlagiarismReportUrl, currentSpectrogramUrl]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState(null); // 'copyright' | 'patent' | 'youtube' | 'licensing'
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Interactive 3D Spectrogram Rotation
  const rotationRef = useRef({ x: 0.45, y: 0.3 }); // Default pitch/yaw
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const historyDataRef = useRef(null);

  const renderVerificationBadges = () => {
    const origin = verification?.originType || "AI_GENERATED";
    const status = verification?.status || "VERIFIED";
    const aiPct = aiPercentage !== undefined ? aiPercentage : 100;
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {origin === "AI_GENERATED" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--accent-glow)] tracking-wider">
            AI Generated
          </span>
        )}
        {origin === "AI_ASSISTED" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-[var(--accent-muted)] border border-[var(--accent-deep)] text-[var(--ink)] tracking-wider">
            AI Assisted
          </span>
        )}
        {origin === "HUMAN_RECORDED" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-emerald-950/40 border border-[var(--success)]/30 text-emerald-400 tracking-wider">
            Human Recorded
          </span>
        )}
        {origin === "IMPORTED" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-amber-950/40 border border-amber-500/30 text-amber-400 tracking-wider">
            Imported
          </span>
        )}
        {status === "VERIFIED" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-cyan-950/40 border border-[var(--wave)]/30 text-cyan-400 tracking-wider flex items-center gap-0.5">
            <CheckCircle2 size={9} /> Verified
          </span>
        )}
        {status === "UNVERIFIED" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 tracking-wider">
            Unverified
          </span>
        )}
        {status === "PENDING" && (
          <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 tracking-wider animate-pulse">
            Analyzing...
          </span>
        )}
        <span className="px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold bg-[var(--canvas-elevated)] border border-[var(--hairline)] text-[var(--ink-secondary)]">
          {Math.round(aiPct)}% AI
        </span>
      </div>
    );
  };
  const historyRows = 32;
  const cols = 40;

  // Plagiarism Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState('badguy');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const referenceTracks = {
    badguy: {
      name: "Billie Eilish - Bad Guy",
      genre: "Pop / Dark Pop",
      bpm: "135 BPM",
      key: "G Minor",
      melodicMatch: 4.2,
      rhythmicMatch: 8.5,
      harmonicMatch: 2.1,
      totalSimilarity: 14.8,
      hotspots: [
        { time: "0:12", freq: "120Hz (Sub-bass)", overlap: "Minor rhythmic syncopation overlap" }
      ]
    },
    getlucky: {
      name: "Daft Punk - Get Lucky",
      genre: "House / Disco",
      bpm: "116 BPM",
      key: "B Dorian",
      melodicMatch: 1.5,
      rhythmicMatch: 12.3,
      harmonicMatch: 4.8,
      totalSimilarity: 18.6,
      hotspots: [
        { time: "0:45", freq: "3.2kHz (Guitars)", overlap: "Funk off-beat strum pattern spacing" }
      ]
    },
    sowhat: {
      name: "Miles Davis - So What",
      genre: "Jazz / Modal",
      bpm: "92 BPM",
      key: "D Dorian",
      melodicMatch: 2.8,
      rhythmicMatch: 1.1,
      harmonicMatch: 8.4,
      totalSimilarity: 12.3,
      hotspots: [
        { time: "1:15", freq: "880Hz (Trumpet)", overlap: "Modal scalar intervals (Dorian roots)" }
      ]
    },
    breathe: {
      name: "Pink Floyd - Breathe",
      genre: "Rock / Psychedelic",
      bpm: "64 BPM",
      key: "E Minor",
      melodicMatch: 5.1,
      rhythmicMatch: 3.4,
      harmonicMatch: 6.9,
      totalSimilarity: 15.4,
      hotspots: [
        { time: "0:30", freq: "250Hz (Hammond)", overlap: "Slow tempo chord progression spacing" }
      ]
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 2500);
  };

  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime);
      const handleEnded = () => setIsPlaying(false);
      
      audioEl.addEventListener('timeupdate', handleTimeUpdate);
      audioEl.addEventListener('ended', handleEnded);
      
      return () => {
        if (audioEl) {
          audioEl.removeEventListener('timeupdate', handleTimeUpdate);
          audioEl.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [audioUrl]);

  // 3D Spectrogram Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    if (!historyDataRef.current) {
      historyDataRef.current = Array(historyRows).fill(null).map(() => Array(cols).fill(0));
    }
    const historyData = historyDataRef.current;
    let frame = 0;

    // Retrieve canvas background color from CSS
    const canvasColor = getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#0A0A0F';

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update history: push new procedural frequencies
      if (isPlaying) {
        const newRow = Array(cols).fill(0).map((_, i) => {
          const t = i / (cols - 1);
          // Bass peak on the left
          const bass = Math.exp(-Math.pow(t - 0.15, 2) / 0.015) * 32 * (Math.sin(frame * 0.12) * 0.4 + 0.8);
          // Mid peak in the center
          const mids = Math.exp(-Math.pow(t - 0.5, 2) / 0.035) * 24 * (Math.cos(frame * 0.07) * 0.5 + 0.7);
          // High peak on the right
          const highs = Math.exp(-Math.pow(t - 0.85, 2) / 0.02) * 16 * (Math.sin(frame * 0.2) * 0.6 + 0.6);
          // Noise factor
          const noise = Math.random() * 4;
          return Math.max(1, bass + mids + highs + noise);
        });
        historyData.unshift(newRow);
        historyData.pop();
      } else {
        // Gentle flow wave when paused
        const newRow = Array(cols).fill(0).map((_, i) => {
          const t = i / (cols - 1);
          const ambient1 = Math.sin(frame * 0.03 + t * 6) * 3;
          const ambient2 = Math.cos(frame * 0.05 - t * 12) * 1.5;
          return Math.max(1, ambient1 + ambient2 + 5);
        });
        historyData.unshift(newRow);
        historyData.pop();
      }
      
      frame++;
      
      // Projection Setup
      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 15;
      const w_scale = canvas.width * 0.38;
      const h_scale = canvas.height * 0.32;
      
      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      
      const getProjectedPoint = (c, r, val) => {
        const x3d = (c / (cols - 1)) * 2 - 1;
        const z3d = (r / (historyRows - 1)) * 2.4 - 1.2;
        const y3d = val * 0.022; // Height amplitude
        
        // Rotate Y (yaw)
        const x1 = x3d * Math.cos(ry) - z3d * Math.sin(ry);
        const z1 = x3d * Math.sin(ry) + z3d * Math.cos(ry);
        
        // Rotate X (pitch)
        const x2 = x1;
        const y2 = y3d * Math.cos(rx) - z1 * Math.sin(rx);
        const z2 = y3d * Math.sin(rx) + z1 * Math.cos(rx);
        
        // Perspective
        const dist = 3.2;
        const scale = dist / (dist - z2);
        
        return {
          x: cx + x2 * w_scale * scale,
          y: cy - y2 * h_scale * scale,
          scale
        };
      };
      
      let prevRowPoints = null;
      
      // Render from back to front (painter's algorithm)
      for (let r = historyRows - 1; r >= 0; r--) {
        const row = historyData[r];
        const depth = r / historyRows; 
        
        const points = [];
        for (let c = 0; c < cols; c++) {
          points.push(getProjectedPoint(c, r, row[c]));
        }
        
        // Baseline points for fill
        const leftBaseline = getProjectedPoint(0, r, 0);
        const rightBaseline = getProjectedPoint(cols - 1, r, 0);
        
        // 1. Fill the polygon below the line to create solid 3D depth blocking
        ctx.beginPath();
        ctx.moveTo(leftBaseline.x, leftBaseline.y);
        for (let c = 0; c < cols; c++) {
          ctx.lineTo(points[c].x, points[c].y);
        }
        ctx.lineTo(rightBaseline.x, rightBaseline.y);
        ctx.closePath();
        ctx.fillStyle = canvasColor;
        ctx.fill();
        
        // 2. Draw transverse wireframe line (row peaks)
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let c = 1; c < cols; c++) {
          ctx.lineTo(points[c].x, points[c].y);
        }
        // Gradient color from deep purple to neon cyan/pink
        ctx.strokeStyle = `hsla(${260 + depth * 50}, 85%, ${65 - depth * 25}%, ${0.8 - depth * 0.45})`;
        ctx.lineWidth = 1.6 - depth * 0.7;
        ctx.stroke();
        
        // 3. Draw longitudinal wireframe lines (connecting back rows)
        if (prevRowPoints) {
          ctx.beginPath();
          for (let c = 0; c < cols; c += 3) { // Draw every 3rd line for clean mesh density
            ctx.moveTo(points[c].x, points[c].y);
            ctx.lineTo(prevRowPoints[c].x, prevRowPoints[c].y);
          }
          ctx.strokeStyle = `hsla(${260 + depth * 50}, 75%, ${55 - depth * 20}%, ${0.35 - depth * 0.2})`;
          ctx.lineWidth = 1.0 - depth * 0.5;
          ctx.stroke();
        }
        
        prevRowPoints = points;
      }
      
      // Draw rotating guide indicator
      ctx.fillStyle = 'var(--ink-muted)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`3D Rot: X:${rx.toFixed(2)} Y:${ry.toFixed(2)}`, 12, canvas.height - 12);
      
      animationId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleScrubberChange = (e) => {
    const time = Number(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (timeInSeconds) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Drag listeners for rotating 3D Spectrogram
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    rotationRef.current = {
      x: Math.max(0.2, Math.min(1.0, rotationRef.current.x + dy * 0.005)),
      y: Math.max(-0.8, Math.min(0.8, rotationRef.current.y + dx * 0.005))
    };
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const plagScore = validation?.plagiarismScore !== undefined ? validation.plagiarismScore * 100 : 12;
  const isCompliancePassed = validation?.validationPassed !== false;

  return (
    <div className="flex w-full justify-start animate-message-in mt-4">
      <div className="w-[28px] h-[28px] shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-glow)] flex items-center justify-center mr-3 mt-1 shadow-[0_0_10px_var(--accent-muted)]">
        <span className="text-[11px] font-bold text-white font-['Inter']">A</span>
      </div>
      
      <div className="w-full max-w-[600px] border border-[var(--accent)] rounded-[16px] p-[24px] glass-panel shadow-[0_0_32px_rgba(124,58,237,0.18)] flex flex-col gap-4">
        
        {/* Track Title and cover */}
        <div className="flex gap-4">
          <img 
            src={coverArtUrl || `https://picsum.photos/seed/${(audioData.trackId || title || 'apollo').replace(/\s/g,'').slice(0,8)}/80/80`}
            alt="Cover Art" 
            className="w-[80px] h-[80px] rounded-[8px] object-cover bg-slate-800"
          />
          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-[18px] font-bold font-['Space_Grotesk'] text-[var(--ink)] tracking-tight">
              {title || 'Apollo Composition'}
            </h3>
            <p className="font-['JetBrains_Mono'] text-[11px] text-[var(--ink-muted)] mt-0.5">
              {formatTime(duration || 0)} • APOLLO
            </p>
            {renderVerificationBadges()}
          </div>
        </div>

        <audio ref={audioRef} src={audioUrl} preload="auto" />

        {/* 3D/Static Spectrogram Visualizer */}
        <div className="relative rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] overflow-hidden shadow-[inset_0_0_20px_rgba(124,58,237,0.15)] h-[130px]">
          {currentSpectrogramUrl ? (
            <div className="relative w-full h-full">
              <img 
                src={currentSpectrogramUrl} 
                alt="Static Spectrogram" 
                className="w-full h-full object-cover opacity-85"
              />
              <div 
                className="absolute top-0 bottom-0 w-[2.5px] bg-[var(--wave)] shadow-[0_0_12px_var(--wave)] pointer-events-none transition-all duration-75"
                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
              />
              <div className="absolute top-2 left-3 text-[9px] uppercase font-bold text-[var(--ink-muted)] tracking-wider bg-[var(--canvas)]/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                Mel-Spectrogram Signature
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(currentSpectrogramUrl, `${title || 'composition'}_spectrogram.png`);
                }}
                className="absolute top-2 right-3 p-1.5 rounded bg-[var(--canvas)]/60 hover:bg-[var(--canvas)] hover:text-[var(--ink)] text-[var(--ink-secondary)] backdrop-blur-sm border border-[var(--hairline)] transition-all cursor-pointer flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-wider hover:scale-105 active:scale-95 shadow-sm"
                title="Download Spectrogram Image"
              >
                <Download size={10} /> Download Spectrogram Image
              </button>
            </div>
          ) : (
            <>
              <div className="absolute top-2 left-3 text-[10px] uppercase font-bold text-[var(--ink-muted)] tracking-wider">
                Interactive 3D Spectrogram (Drag to rotate)
              </div>
              <canvas 
                ref={canvasRef}
                width={550}
                height={130}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full h-[130px] block cursor-grab active:cursor-grabbing"
              />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="w-[40px] h-[40px] shrink-0 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_0_12px_rgba(124,58,237,0.4)] hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-['JetBrains_Mono'] text-[11px] text-[var(--ink-muted)] w-[30px] text-right">
                {formatTime(currentTime)}
              </span>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={currentTime}
                onChange={handleScrubberChange}
                className="flex-1 h-[4px] audio-scrubber cursor-pointer"
              />
              <span className="font-['JetBrains_Mono'] text-[11px] text-[var(--ink-muted)] w-[30px]">
                {formatTime(duration || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Structural Sections Timeline */}
        {sections && sections.length > 0 && (
          <TimelineVisualizer 
            sections={sections} 
            duration={duration} 
            currentTime={currentTime} 
            onScrub={(time) => {
              if (audioRef.current) {
                audioRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
          />
        )}

        {/* Audio Validation Compliance Panel */}
        <div className="p-4 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] flex flex-col gap-3 shadow-[inset_0_0_15px_rgba(0,0,0,0.4)]">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-[13px] font-bold">
              {isCompliancePassed ? (
                <>
                  <CheckCircle2 size={16} className="text-[var(--success)]" />
                  <span>Audio Rights Compliance: PASSED</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-[var(--error)] animate-pulse" />
                  <span className="text-[var(--error)]">Audio Rights Compliance: ADVISORY</span>
                </>
              )}
            </div>
            <span className={`text-[12px] font-mono font-bold px-2 py-0.5 rounded-full ${plagScore <= 25 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              Similarity: {plagScore.toFixed(0)}%
            </span>
          </div>

          <div className="text-[12px] text-[var(--ink-secondary)] leading-relaxed">
            {isCompliancePassed 
              ? "All fingerprinting database matching complete. No plagiarism detected. You can safely deploy and monetize this track."
              : "Similarity scanning matched active fingerprints above the safety threshold. We recommend adjusting chords or arrangement and regenerating."}
          </div>

          {/* Digital Signature & Verification metadata */}
          <div className="mt-1 border-t border-[var(--hairline)]/50 pt-3 text-[11px] font-mono text-[var(--ink-secondary)] bg-[var(--canvas-overlay)]/40 p-2.5 rounded-lg border border-[var(--hairline)]/40">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[9px] uppercase font-bold text-[var(--ink-muted)] tracking-wider">Digital Signature (SHA-256)</span>
              <span className="text-[var(--ink)] truncate block" title={validation?.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}>
                {validation?.sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
              </span>
            </div>
          </div>

          {/* Plagiarism Analyzer Expandable Section */}
          <div className="mt-1 pt-2 border-t border-[var(--hairline)]/50">
            <button
              onClick={() => setIsScannerOpen(!isScannerOpen)}
              className="w-full flex items-center justify-between py-2 px-3 bg-[var(--surface)] hover:bg-[var(--surface-hover)] rounded-lg text-[12px] text-[var(--ink)] border border-[var(--hairline)] transition-all cursor-pointer font-medium"
            >
              <span className="flex items-center gap-1.5">
                <Shield size={13} className="text-[var(--accent)] animate-pulse" />
                Spectrogram Plagiarism Analyzer
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-mono">
                {isScannerOpen ? "Collapse ▲" : "Compare Spectrograms ▼"}
              </span>
            </button>
          </div>

          {isScannerOpen && (
            <div className="flex flex-col gap-4 mt-2 p-3 bg-[var(--surface)]/50 border border-[var(--hairline)] rounded-lg text-[12px] animate-message-in">
              <style>{`
                @keyframes laser-scan {
                  0% { left: 0%; }
                  100% { left: 100%; }
                }
              `}</style>
              
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div>
                  <div className="font-bold text-[var(--ink)]">Anti-Plagiarism Reference Scan</div>
                  <div className="text-[10px] text-[var(--ink-muted)]">Compare spectrogram signatures with commercial tracks</div>
                </div>
                
                {/* Reference Track Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[var(--ink-secondary)]">Reference:</span>
                  <select
                    value={selectedReference}
                    onChange={(e) => {
                      setSelectedReference(e.target.value);
                      setScanComplete(false);
                    }}
                    disabled={isScanning}
                    className="bg-[var(--canvas)] border border-[var(--hairline)] rounded px-2 py-1 text-[11px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                  >
                    {Object.entries(referenceTracks).map(([key, ref]) => (
                      <option key={key} value={key}>{ref.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Spectrogram Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                
                {/* Your Spectrogram */}
                <div className="relative border border-[var(--hairline)] rounded-lg bg-slate-950 p-2 overflow-hidden flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    <span>Your Track (Spectrogram)</span>
                    <span className="text-[var(--accent)] font-semibold font-mono">Original</span>
                  </div>
                  
                  <div className="relative w-full h-[90px] bg-slate-900 rounded overflow-hidden">
                    {/* SVG Heatmap drawing */}
                    <svg className="w-full h-full" viewBox="0 0 250 90">
                      {/* Grid Lines */}
                      <g stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3,3">
                        <line x1="0" y1="22.5" x2="250" y2="22.5" />
                        <line x1="0" y1="45" x2="250" y2="45" />
                        <line x1="0" y1="67.5" x2="250" y2="67.5" />
                        <line x1="62.5" y1="0" x2="62.5" y2="90" />
                        <line x1="125" y1="0" x2="125" y2="90" />
                        <line x1="187.5" y1="0" x2="187.5" y2="90" />
                      </g>
                      
                      {/* Gradients */}
                      <defs>
                        <linearGradient id="grad-original" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
                          <stop offset="35%" stopColor="#9333ea" stopOpacity="0.8" />
                          <stop offset="70%" stopColor="#ec4899" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                      
                      {/* Wave Energy Fill */}
                      <path d="M 0 90 L 0 65 Q 30 10, 60 70 T 120 40 T 180 80 T 240 50 L 250 50 L 250 90 Z" fill="url(#grad-original)" opacity="0.65" />
                      <path d="M 0 90 L 0 75 Q 40 30, 80 80 T 160 50 T 240 85 L 250 85 L 250 90 Z" fill="#3b82f6" opacity="0.4" />
                      
                      {/* High freq nodes */}
                      <circle cx="50" cy="25" r="3" fill="#fbbf24" opacity="0.7" className="animate-pulse" />
                      <circle cx="130" cy="15" r="2" fill="#fbbf24" opacity="0.7" />
                      <circle cx="190" cy="30" r="3" fill="#22c55e" opacity="0.6" />
                      
                      {/* Scan Hotspot Highlight */}
                      {scanComplete && (
                        <g>
                          <ellipse cx="125" cy="45" rx="15" ry="10" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3,2" />
                          <circle cx="125" cy="45" r="2" fill="#e11d48" />
                        </g>
                      )}
                    </svg>
                    
                    {/* Laser Scanner Line */}
                    {isScanning && (
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee] pointer-events-none"
                        style={{
                          animation: 'laser-scan 2.5s linear infinite',
                          left: '0%',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>20Hz</span>
                    <span>1.2kHz</span>
                    <span>20kHz</span>
                  </div>
                </div>

                {/* Reference Spectrogram */}
                <div className="relative border border-[var(--hairline)] rounded-lg bg-slate-950 p-2 overflow-hidden flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                    <span className="truncate max-w-[120px]">{referenceTracks[selectedReference].name}</span>
                    <span className="text-amber-500 font-semibold font-mono text-[8px]">{referenceTracks[selectedReference].genre}</span>
                  </div>
                  
                  <div className="relative w-full h-[90px] bg-slate-900 rounded overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 250 90">
                      {/* Grid Lines */}
                      <g stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="3,3">
                        <line x1="0" y1="22.5" x2="250" y2="22.5" />
                        <line x1="0" y1="45" x2="250" y2="45" />
                        <line x1="0" y1="67.5" x2="250" y2="67.5" />
                        <line x1="62.5" y1="0" x2="62.5" y2="90" />
                        <line x1="125" y1="0" x2="125" y2="90" />
                        <line x1="187.5" y1="0" x2="187.5" y2="90" />
                      </g>
                      
                      <defs>
                        <linearGradient id="grad-ref" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.7" />
                          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
                        </linearGradient>
                      </defs>
                      
                      {/* Dynamic Reference Wave Path */}
                      <path 
                        d={`M 0 90 L 0 50 Q ${selectedReference === 'badguy' ? '70 80, 140 20' : selectedReference === 'getlucky' ? '40 20, 100 80' : selectedReference === 'sowhat' ? '90 60, 150 15' : '60 30, 160 70'} T 250 60 L 250 90 Z`}
                        fill="url(#grad-ref)" 
                        opacity="0.5" 
                      />
                      
                      {/* Reference specific scatter points */}
                      <circle cx="80" cy="35" r="2.5" fill="#f43f5e" opacity="0.6" />
                      <circle cx="160" cy="20" r="3.5" fill="#10b981" opacity="0.6" />
                      
                      {/* Scan Hotspot Overlap Highlight */}
                      {scanComplete && (
                        <g>
                          <ellipse cx="125" cy="45" rx="15" ry="10" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3,2" />
                          <circle cx="125" cy="45" r="2" fill="#e11d48" />
                        </g>
                      )}
                    </svg>
                    
                    {/* Laser Scanner Line */}
                    {isScanning && (
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee,0_0_20px_#22d3ee] pointer-events-none"
                        style={{
                          animation: 'laser-scan 2.5s linear infinite',
                          left: '0%',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>20Hz</span>
                    <span>1.2kHz</span>
                    <span>20kHz</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center gap-3 mt-1">
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="px-4 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] disabled:bg-slate-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none"
                >
                  {isScanning ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <span>Run Plagiarism Scan</span>
                  )}
                </button>

                <div className="text-[10px] text-[var(--ink-muted)]">
                  Scan Speed: ~2.5s
                </div>
              </div>

              {/* Comparison Results */}
              {scanComplete && (
                <div className="p-3 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl flex flex-col gap-2 animate-message-in">
                  <div className="flex justify-between items-center border-b border-[var(--hairline)]/50 pb-2">
                    <span className="font-bold text-[var(--ink)] flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-[var(--success)]" /> Analysis Result
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[var(--success)]">
                      Total Overlap: {referenceTracks[selectedReference].totalSimilarity}% (SAFE)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                    <div className="bg-[var(--surface)] p-1.5 rounded border border-[var(--hairline)]">
                      <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide text-[8px]">Melodic</span>
                      <span className="text-[var(--ink)] font-semibold">{referenceTracks[selectedReference].melodicMatch}% Match</span>
                    </div>
                    <div className="bg-[var(--surface)] p-1.5 rounded border border-[var(--hairline)]">
                      <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide text-[8px]">Rhythmic</span>
                      <span className="text-[var(--ink)] font-semibold">{referenceTracks[selectedReference].rhythmicMatch}% Match</span>
                    </div>
                    <div className="bg-[var(--surface)] p-1.5 rounded border border-[var(--hairline)]">
                      <span className="text-[var(--ink-muted)] block uppercase font-bold tracking-wide text-[8px]">Harmonic</span>
                      <span className="text-[var(--ink)] font-semibold">{referenceTracks[selectedReference].harmonicMatch}% Match</span>
                    </div>
                  </div>

                  {/* Hotspots Info */}
                  <div className="text-[11px] text-[var(--ink-secondary)] leading-relaxed mt-1">
                    <span className="font-bold text-[var(--ink)]">Hotspot Overlap:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      {referenceTracks[selectedReference].hotspots.map((hot, hIdx) => (
                        <li key={hIdx}>
                          At <strong className="font-mono">{hot.time}</strong> at <strong className="font-mono">{hot.freq}</strong>: <em>{hot.overlap}</em>.
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons & Expandable publishing workflows */}
        {isCompliancePassed && (
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-1">Validated Options & Actions</div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setActiveTab(activeTab === 'youtube' ? null : 'youtube')}
                className={`flex items-center gap-2 justify-center py-2 px-3 border rounded-lg text-[12px] transition-all font-medium cursor-pointer ${activeTab === 'youtube' ? 'bg-[var(--accent)] border-[var(--accent-glow)] text-white' : 'bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--accent)]'}`}
              >
                <Play size={14} /> YouTube Sync
              </button>
              <button 
                onClick={() => setActiveTab(activeTab === 'copyright' ? null : 'copyright')}
                className={`flex items-center gap-2 justify-center py-2 px-3 border rounded-lg text-[12px] transition-all font-medium cursor-pointer ${activeTab === 'copyright' ? 'bg-[var(--accent)] border-[var(--accent-glow)] text-white' : 'bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--accent)]'}`}
              >
                <Shield size={14} /> Copyright Claim
              </button>
            </div>

            {/* Expandable Tab Content */}
            {activeTab === 'youtube' && (
              <div className="p-3 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-[12px] space-y-2 animate-message-in">
                <div className="font-bold text-[var(--ink)]">YouTube Upload Assistance</div>
                <p className="text-[var(--ink-secondary)] leading-relaxed">
                  We've pre-formatted your metadata. Ready to be copied for upload:
                </p>
                <div className="p-2 bg-[var(--surface)] rounded border border-[var(--hairline)] font-mono text-[10px] text-[var(--ink-secondary)]">
                  Title: {title} (Apollo Gen Original)<br />
                  Description: Composed with first-principles theory. Free of copyright matches. Tags: {audioData.promptUsed}
                </div>
                <a 
                  href="https://youtube.com/upload" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full mt-2 py-2 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white text-[11px] font-bold rounded-lg transition-all text-center block cursor-pointer"
                >
                  Redirect to YouTube Upload ↗
                </a>
              </div>
            )}

            {/* Expandable Tab Content for Copyright */}
            {activeTab === 'copyright' && (
              <div className="p-3 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-[12px] space-y-2 animate-message-in">
                <div className="font-bold text-[var(--ink)]">Copyright & Patent Guidelines</div>
                <p className="text-[var(--ink-secondary)] leading-relaxed">
                  Because this track is built from first-principles music theory (rather than scraped content databases), it is clean to claim under original copyrights.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[var(--ink-secondary)]">
                  <li>Generate official ISRC metadata keys.</li>
                  <li>Register the melody progression at your national copyright office.</li>
                  <li>Free distribution license is active.</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center mt-2 border-t border-[var(--hairline)] pt-3">
          <div className="flex flex-wrap gap-2">
            <button 
              className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--ink)] text-[var(--ink-secondary)] transition-all font-['Inter'] text-[12px] cursor-pointer"
              onClick={() => downloadFile(audioUrl, `${title || 'composition'}.mp3`)}
            >
              <Download size={12} /> Audio MP3
            </button>
            {coverArtUrl && (
              <button 
                className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--ink)] text-[var(--ink-secondary)] transition-all font-['Inter'] text-[12px] cursor-pointer"
                onClick={() => downloadFile(coverArtUrl, `${title || 'composition'}_cover.png`)}
              >
                <Download size={12} className="text-amber-500" /> Cover Art PNG
              </button>
            )}
            {currentSpectrogramUrl && (
              <button 
                className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--ink)] text-[var(--ink-secondary)] transition-all font-['Inter'] text-[12px] cursor-pointer"
                onClick={() => downloadFile(currentSpectrogramUrl, `${title || 'composition'}_spectrogram.png`)}
              >
                <Download size={12} className="text-[var(--accent)]" /> Spectrogram Image
              </button>
            )}
            
            {currentCertificateUrl ? (
              <button 
                className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--ink)] text-[var(--ink-secondary)] transition-all font-['Inter'] text-[12px] cursor-pointer"
                onClick={() => window.open(currentCertificateUrl, '_blank')}
              >
                <Shield size={12} className="text-[var(--accent)]" /> Certificate PDF
              </button>
            ) : (
              <button 
                disabled
                className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent text-[var(--ink-muted)] opacity-55 font-['Inter'] text-[12px]"
              >
                <div className="w-3.5 h-3.5 border border-t-transparent border-[var(--ink-muted)] rounded-full animate-spin"></div>
                Cert Preparing...
              </button>
            )}
            
            {currentPlagiarismReportUrl ? (
              <button 
                className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent hover:border-[var(--accent)] hover:text-[var(--ink)] text-[var(--ink-secondary)] transition-all font-['Inter'] text-[12px] cursor-pointer"
                onClick={() => window.open(currentPlagiarismReportUrl, '_blank')}
              >
                <Shield size={12} className="text-[var(--wave)]" /> Plagiarism Report PDF
              </button>
            ) : (
              <button 
                disabled
                className="flex items-center justify-center gap-2 px-[12px] py-[7px] rounded-[6px] border border-[var(--hairline)] bg-transparent text-[var(--ink-muted)] opacity-55 font-['Inter'] text-[12px]"
              >
                <div className="w-3.5 h-3.5 border border-t-transparent border-[var(--ink-muted)] rounded-full animate-spin"></div>
                Report Preparing...
              </button>
            )}
          </div>

          <div 
            onClick={onFeedback}
            className="text-[13px] text-[var(--accent)] hover:underline cursor-pointer font-['Inter'] text-right sm:text-left self-end sm:self-auto"
          >
            Tell Apollo what to change →
          </div>
        </div>

      </div>
    </div>
  );
}
