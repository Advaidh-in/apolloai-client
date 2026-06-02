import { useState, useEffect, useRef } from 'react';
import { Play, Square, Loader2, Volume2 } from 'lucide-react';

export default function SoundPreview() {
  const [player, setPlayer] = useState(null);
  const [model, setModel] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const mmRef = useRef(null);

  useEffect(() => {
    let active = true;
    let p = null;

    const init = async () => {
      const mm = await import('@magenta/music/es6');
      if (!active) return;
      mmRef.current = mm;

      p = new mm.Player();

      // Initialize the MusicRNN model
      const m = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
      
      await m.initialize();
      if (active) {
        setPlayer(p);
        setModel(m);
      }
    };
    init();

    return () => {
      active = false;
      if (p && p.isPlaying()) p.stop();
    };
  }, []);

  const generateAndPlay = async () => {
    if (!model || !player || !mmRef.current) return;

    setLoading(true);
    setIsPlaying(true);

    try {
      const mm = mmRef.current;
      // Create a basic seed
      const STEPS_PER_QUARTER = 4;
      const seed = {
        notes: [
          { pitch: 60, startTime: 0, endTime: 0.5 },
          { pitch: 62, startTime: 0.5, endTime: 1.0 },
          { pitch: 64, startTime: 1.0, endTime: 1.5 },
        ],
        totalTime: 1.5,
      };

      const qns = mm.sequences.quantizeNoteSequence(seed, STEPS_PER_QUARTER);
      const rnnSteps = 32; // 2 bars
      const rnnTemperature = 1.1;
      
      const result = await model.continueSequence(qns, rnnSteps, rnnTemperature);
      
      // Play it
      player.start(result);
      
      // Stop playing state after sequence ends
      const totalTime = result.totalTime;
      setTimeout(() => setIsPlaying(false), totalTime * 1000 + 500);

    } catch (err) {
      console.error("Magenta error:", err);
      setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const stopPlayback = () => {
    if (player) {
      player.stop();
      setIsPlaying(false);
    }
  };

  if (!model) return (
    <div className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)] mt-4 italic font-['Inter']">
      <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
      Syncing sound engine...
    </div>
  );

  return (
    <div className="mt-4 p-[16px] bg-[var(--surface)] rounded-[12px] border border-[var(--hairline)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase font-bold text-[var(--ink-secondary)] tracking-[0.1em] flex items-center gap-1.5 font-['Inter']">
          <Volume2 size={12} className="text-[var(--accent)]" />
          AI Pattern Jam
        </span>
        <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-muted)] px-2 py-0.5 rounded-full border border-[var(--accent-deep)]">
          Live Preview
        </span>
      </div>
      
      <div className="flex gap-2">
        {isPlaying ? (
          <button 
            onClick={stopPlayback}
            className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-[var(--error)] py-[10px] rounded-[8px] text-[12px] font-medium transition-all flex items-center justify-center gap-2 border border-red-900/50 group"
          >
            <Square size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" /> 
            Stop Jam
          </button>
        ) : (
          <button 
            onClick={generateAndPlay}
            disabled={loading}
            className="flex-1 bg-[var(--canvas-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--ink)] py-[10px] rounded-[8px] text-[12px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 group active:scale-95"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" className="group-hover:translate-x-0.5 transition-transform text-[var(--accent)]" />
            )}
            Preview Concept
          </button>
        )}
      </div>
      
      <p className="text-[11px] text-[var(--ink-muted)] mt-3 leading-relaxed text-center px-2 font-['Inter']">
        Apollo is using its "Music RNN" brain to improvise a melody based on your choices.
      </p>
    </div>
  );
}
