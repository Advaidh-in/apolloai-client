import { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChoiceChips from './ChoiceChips';
import InputBar from './InputBar';
import ProgressBar from './ProgressBar';
import TypingIndicator from './TypingIndicator';
import GeneratingTrack from './GeneratingTrack';
import AudioPlayer from './AudioPlayer';
import HumToSearchPanel from './HumToSearchPanel';
import AudioVerifyPanel from './AudioVerifyPanel';
import { Info, Sparkles, AlertTriangle, Music2, Mic, ShieldCheck } from 'lucide-react';

// ────────────────────────────────────────────────────────────
// Mode Landing Dashboard — shown when mode === 'menu'
// ────────────────────────────────────────────────────────────
function ModeDashboard({ setMode, onStartComposition }) {
  const cards = [
    {
      id: 'composition',
      icon: <Music2 size={28} />,
      title: 'Guided Composition',
      subtitle: '24-step AI music wizard',
      description: 'Answer Apollo\'s questions to craft a fully personalized track — genre, mood, tempo, instruments, and more.',
      accentClass: 'border-[var(--accent)] shadow-[0_0_32px_rgba(124,58,237,0.18)] hover:shadow-[0_0_48px_rgba(124,58,237,0.35)]',
      iconBg: 'bg-[var(--accent-muted)] text-[var(--accent-glow)]',
      badge: 'Most Popular',
      badgeClass: 'bg-[var(--accent-muted)] text-[var(--accent-glow)] border-[var(--accent)]',
    },
    {
      id: 'hum-to-search',
      icon: <Mic size={28} />,
      title: 'Hum to Search',
      subtitle: 'Identify any melody',
      description: 'Hum, sing, or upload a short clip. Apollo analyses it, identifies the song, and shows side-by-side spectrograms.',
      accentClass: 'border-[var(--wave)] shadow-[0_0_32px_rgba(6,182,212,0.12)] hover:shadow-[0_0_48px_rgba(6,182,212,0.28)]',
      iconBg: 'bg-[var(--wave-muted)] text-[var(--wave)]',
      badge: 'BETA',
      badgeClass: 'bg-[var(--wave-muted)] text-[var(--wave)] border-[var(--wave)]/40',
    },
    {
      id: 'verify',
      icon: <ShieldCheck size={28} />,
      title: 'Audio Verification',
      subtitle: 'Instant origin analysis',
      description: 'Upload any audio file. Apollo analyses origin, detects AI watermarks, and extracts acoustic signatures.',
      accentClass: 'border-emerald-500/30 shadow-[0_0_32px_rgba(16,185,129,0.08)] hover:shadow-[0_0_48px_rgba(16,185,129,0.22)]',
      iconBg: 'bg-emerald-950/40 text-emerald-400',
      badge: null,
      badgeClass: '',
    },
  ];

  const handleCardClick = (id) => {
    if (id === 'composition') {
      onStartComposition();
    } else {
      setMode(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar min-h-0">
      {/* Hero */}
      <div className="text-center mb-8 md:mb-10 animate-message-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] shadow-[0_0_40px_rgba(124,58,237,0.45)] mb-5">
          <Sparkles size={32} className="text-white" />
        </div>
        <h2 className="text-[28px] md:text-[34px] font-bold tracking-tight text-[var(--ink)] font-['Space_Grotesk'] mb-2">
          What would you like to do?
        </h2>
        <p className="text-[14px] text-[var(--ink-secondary)] max-w-[420px] mx-auto leading-relaxed">
          Apollo is your AI music studio. Choose a mode to get started.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[900px]">
        {cards.map((card, i) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`group relative text-left glass-panel rounded-2xl p-6 border transition-all duration-300 cursor-pointer active:scale-[0.98] animate-message-in ${card.accentClass}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Badge */}
            {card.badge && (
              <span className={`absolute top-4 right-4 text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${card.badgeClass}`}>
                {card.badge}
              </span>
            )}

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${card.iconBg}`}>
              {card.icon}
            </div>

            {/* Text */}
            <h3 className="text-[17px] font-bold text-[var(--ink)] font-['Space_Grotesk'] tracking-tight mb-0.5">
              {card.title}
            </h3>
            <p className="text-[11px] font-mono text-[var(--ink-muted)] uppercase tracking-wider mb-3">
              {card.subtitle}
            </p>
            <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">
              {card.description}
            </p>

            {/* Arrow indicator */}
            <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-secondary)] group-hover:text-[var(--ink)] transition-colors">
              <span>Get started</span>
              <span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="mt-8 text-[11px] text-[var(--ink-muted)] text-center">
        All modes require a valid session. Your data is secured with Apollo AI.
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Composition Chat View — existing flow
// ────────────────────────────────────────────────────────────
function CompositionView({
  sessionData, onSendMessage, onBack, loading,
  audioStatus, audioData, audioError, onGenerateRetry
}) {
  const scrollContainerRef = useRef(null);
  const history = sessionData?.conversationHistory || [];
  const assistantMessages = history.filter(msg => msg.role === 'assistant');
  const rawStep = Math.min(12, Math.max(1, assistantMessages.length));
  const displayedStep = audioStatus === 'success' ? 12 : rawStep;
  const handleSend = (text) => {
    onSendMessage(text);
  };

  const handleChoice = (optionText) => {
    onSendMessage(optionText);
  };

  const extractChoices = (msg) => {
    if (!msg || msg.role !== 'assistant') return [];
    const lines = msg.content.split('\n');
    return lines
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'))
      .map(l => l.replace(/^[-*]\s*/, '').trim())
      .filter(l => l.length > 0);
  };

  const lastMsg = history[history.length - 1];
  const parsedChoices = extractChoices(lastMsg);
  const isAssistantTurn = lastMsg?.role === 'assistant';
  const hasQuestion = isAssistantTurn && lastMsg?.content?.includes('?');
  const fallbackChoices = (parsedChoices.length === 0 && hasQuestion && !loading && audioStatus !== 'generating' && audioStatus !== 'success')
    ? ['Yes, proceed', 'Tell me more', 'Ask about other options']
    : [];

  const choices = parsedChoices.length > 0 ? parsedChoices : fallbackChoices;
  const isFallback = parsedChoices.length === 0 && fallbackChoices.length > 0;

  useEffect(() => {
    if (scrollContainerRef.current) {
      const isAssistant = lastMsg?.role === 'assistant';
      const hasChips = !loading && audioStatus !== 'generating' && audioStatus !== 'success' && choices.length > 0;
      if (isAssistant && hasChips) {
        const bubbles = scrollContainerRef.current.querySelectorAll('.animate-message-in');
        const lastBubble = bubbles[bubbles.length - 1];
        const userBubble = bubbles.length >= 2 ? bubbles[bubbles.length - 2] : null;
        const targetBubble = userBubble || lastBubble;
        if (targetBubble) {
          const containerRect = scrollContainerRef.current.getBoundingClientRect();
          const bubbleRect = targetBubble.getBoundingClientRect();
          const relativeTop = bubbleRect.top - containerRect.top;
          const targetScrollTop = scrollContainerRef.current.scrollTop + relativeTop - 16;
          scrollContainerRef.current.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
          return;
        }
      }
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [sessionData?.conversationHistory, loading, audioStatus, choices, lastMsg]);

  const handleChipsInfo = (e) => {
    if (e) e.stopPropagation();
    if (lastMsg) {
      const event = new CustomEvent('open-theory-concept', { detail: { content: lastMsg.content } });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-[var(--canvas)] relative min-h-0">
      <ProgressBar currentStep={displayedStep} />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 md:p-6 custom-scrollbar min-h-0">
        <div className="max-w-[720px] w-full mx-auto space-y-4 flex flex-col">
          {history.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-[var(--ink-muted)] my-auto max-w-[420px] mx-auto p-8 rounded-2xl border border-[var(--hairline)] bg-[var(--canvas-elevated)] shadow-[0_0_24px_rgba(124,58,237,0.03)] animate-message-in">
              <div className="bg-[var(--accent)] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_28px_rgba(124,58,237,0.35)] mb-4 animate-pulse">
                <Sparkles size={28} className="text-white" />
              </div>
              <h2 className="text-[22px] font-bold text-[var(--ink)] mb-2 font-['Space_Grotesk'] tracking-tight">
                Begin Composition
              </h2>
              <p className="text-[13px] text-[var(--ink-secondary)] leading-relaxed">
                Apollo will guide you through a 24-step musical orchestration questionnaire. Answer using choice chips or type custom responses.
              </p>
            </div>
          )}
          {history.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          {audioStatus === 'generating' && <GeneratingTrack />}
          {audioStatus === 'error' && (
            <div className="flex justify-start mb-4">
              <div className="bg-red-950/10 text-[var(--error)] p-5 rounded-[16px] border border-[var(--error)] max-w-[600px] text-[13px] font-['Inter'] shadow-[0_0_20px_rgba(239,68,68,0.08)]">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertTriangle size={16} className="text-[var(--error)] shrink-0" />
                  <span>Audio Engine Advisory</span>
                </div>
                <p className="text-[var(--ink-secondary)] mb-4 leading-relaxed">{audioError}</p>
                <button onClick={onGenerateRetry} className="px-[16px] py-[8px] bg-[var(--surface)] border border-[var(--hairline)] hover:border-[var(--accent)] rounded-[8px] text-[var(--ink)] hover:text-white transition-all cursor-pointer font-medium active:scale-95">
                  Regenerate Track
                </button>
              </div>
            </div>
          )}
          {audioStatus === 'success' && audioData && (
            <AudioPlayer audioData={audioData} onFeedback={() => { const input = document.querySelector('input[type="text"]'); if (input) input.focus(); }} />
          )}
          {!loading && audioStatus !== 'generating' && audioStatus !== 'success' && choices.length > 0 && lastMsg?.role === 'assistant' && (
            <div className="ml-0 sm:ml-[40px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[var(--ink-muted)] font-medium">
                  {isFallback ? 'Quick replies — or type your own response' : 'Choose an option or type your own'}
                </span>
                {!isFallback && (
                  <button onClick={handleChipsInfo} className="flex items-center gap-1 px-[8px] py-[3px] rounded-full border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-glow)] hover:bg-[var(--canvas-elevated)] transition-all text-[11px] cursor-pointer" title="Learn about this music concept">
                    <Info size={11} />
                    <span>What does this mean?</span>
                  </button>
                )}
              </div>
              <ChoiceChips options={choices} onSelect={handleChoice} />
            </div>
          )}
        </div>
      </div>
      <InputBar
        onSend={handleSend}
        onBack={sessionData?.step > 1 ? onBack : null}
        onSkip={choices.length > 0 && audioStatus !== 'success' ? () => handleChoice(choices[0]) : null}
        disabled={loading || audioStatus === 'generating'}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Root ChatWindow — mode router
// ────────────────────────────────────────────────────────────
export default function ChatWindow({
  sessionData,
  onSendMessage,
  onBack,
  loading,
  audioStatus,
  audioData,
  audioError,
  onGenerateRetry,
  mode,
  setMode,
  onStartComposition,
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStartComposition = () => {
    if (onStartComposition) {
      onStartComposition();
    } else {
      setMode('composition');
    }
  };

  if (mode === 'menu') {
    return (
      <div className="flex flex-col flex-1 bg-[var(--canvas)] relative min-h-0">
        <ModeDashboard setMode={setMode} onStartComposition={handleStartComposition} />
      </div>
    );
  }

  if (mode === 'hum-to-search') {
    return (
      <div className="flex flex-col flex-1 bg-[var(--canvas)] relative min-h-0 overflow-y-auto custom-scrollbar">
        <HumToSearchPanel />
      </div>
    );
  }

  if (mode === 'verify') {
    return (
      <div className="flex flex-col flex-1 bg-[var(--canvas)] relative min-h-0 overflow-y-auto custom-scrollbar">
        <AudioVerifyPanel />
      </div>
    );
  }

  // mode === 'composition' — original chat flow
  return (
    <CompositionView
      sessionData={sessionData}
      onSendMessage={onSendMessage}
      onBack={onBack}
      loading={loading}
      audioStatus={audioStatus}
      audioData={audioData}
      audioError={audioError}
      onGenerateRetry={onGenerateRetry}
    />
  );
}
