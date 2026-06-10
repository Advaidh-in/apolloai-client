import { Shield } from 'lucide-react';

export default function TimelineVisualizer({ sections, duration, currentTime, onScrub }) {
  if (!sections || sections.length === 0) return null;
  
  const formatTime = (timeInSeconds) => {
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Get color configurations based on section name
  const getSectionStyles = (name, isActive) => {
    const nameLower = name.toLowerCase();
    
    let baseStyles = "";
    if (nameLower.includes("intro")) {
      baseStyles = isActive 
        ? "bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent-glow)] shadow-[0_0_12px_rgba(124,58,237,0.3)]" 
        : "bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--accent-muted)]";
    } else if (nameLower.includes("chorus")) {
      baseStyles = isActive 
        ? "bg-[rgba(6,182,212,0.18)] border-[var(--wave)] text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]" 
        : "bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--wave-muted)]";
    } else if (nameLower.includes("outro")) {
      baseStyles = isActive 
        ? "bg-[rgba(14,79,92,0.3)] border-[var(--wave-muted)] text-[var(--wave)] shadow-[0_0_8px_rgba(14,79,92,0.2)]" 
        : "bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--hairline)]";
    } else {
      // Verse or Bridge
      baseStyles = isActive 
        ? "bg-[var(--accent-muted)] border-[var(--accent-deep)] text-[var(--ink)] shadow-[0_0_8px_rgba(124,58,237,0.2)]" 
        : "bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--accent-deep)]";
    }

    return `border text-center rounded-[6px] py-2 px-1 text-[11px] font-mono cursor-pointer transition-all duration-200 select-none truncate ${baseStyles}`;
  };

  // Find currently active section index
  const activeSectionIdx = sections.findIndex(sec => currentTime >= sec.start && currentTime < sec.end);

  return (
    <div className="w-full flex flex-col gap-3 p-4 rounded-xl bg-[var(--canvas)] border border-[var(--hairline)] shadow-[inset_0_0_15px_rgba(0,0,0,0.3)]">
      <div className="flex justify-between items-center">
        <div className="text-[12px] font-bold text-[var(--ink)] font-['Space_Grotesk'] flex items-center gap-1.5">
          <Shield size={14} className="text-[var(--accent)]" />
          <span>Composition Structure (Interactive Sections)</span>
        </div>
        <div className="text-[10px] text-[var(--ink-muted)] font-mono">
          Click section to seek
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="relative w-full h-[10px] rounded-[5px] bg-[var(--surface)] border border-[var(--hairline)] overflow-hidden flex">
        {sections.map((sec, idx) => {
          const secDuration = sec.end - sec.start;
          const pctWidth = (secDuration / (duration || 1)) * 100;
          const isActive = idx === activeSectionIdx;
          
          let colorClass = "bg-[var(--ink-muted)]";
          if (sec.name.toLowerCase().includes("intro")) {
            colorClass = isActive ? "bg-[var(--accent)]" : "bg-[var(--accent-muted)] opacity-60";
          } else if (sec.name.toLowerCase().includes("chorus")) {
            colorClass = isActive ? "bg-[var(--wave)]" : "bg-[var(--wave-muted)] opacity-60";
          } else if (sec.name.toLowerCase().includes("outro")) {
            colorClass = isActive ? "bg-[var(--wave-muted)]" : "bg-slate-700 opacity-60";
          } else {
            colorClass = isActive ? "bg-[var(--accent-glow)]" : "bg-[var(--surface-hover)] opacity-60";
          }

          return (
            <div
              key={idx}
              className={`h-full cursor-pointer transition-colors ${colorClass}`}
              style={{ width: `${pctWidth}%` }}
              onClick={() => onScrub(sec.start)}
              title={`${sec.name} (${formatTime(sec.start)} - ${formatTime(sec.end)}) - ${sec.type}`}
            />
          );
        })}
      </div>

      {/* Grid view of Section Cards (Responsive / Scrollable) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sections.map((sec, idx) => {
          const isActive = idx === activeSectionIdx;
          return (
            <div
              key={idx}
              onClick={() => onScrub(sec.start)}
              className={getSectionStyles(sec.name, isActive)}
              title={`Jump to ${sec.name}`}
            >
              <div className="font-bold">{sec.name}</div>
              <div className="text-[9px] text-[var(--ink-muted)] font-mono mt-0.5">
                {formatTime(sec.start)} - {formatTime(sec.end)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
