import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChoiceChips from './ChoiceChips';
import InputBar from './InputBar';
import ProgressBar from './ProgressBar';
import TypingIndicator from './TypingIndicator';
import GeneratingTrack from './GeneratingTrack';
import AudioPlayer from './AudioPlayer';
import { Info, Sparkles, AlertTriangle } from 'lucide-react';

export default function ChatWindow({ 
  sessionData, 
  onSendMessage, 
  onBack,
  loading, 
  audioStatus, 
  audioData, 
  audioError, 
  onGenerateRetry 
}) {
  const scrollContainerRef = useRef(null);
  const [chipsInfoVisible, setChipsInfoVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [sessionData?.conversationHistory, loading, audioStatus]);

  const history = sessionData?.conversationHistory || [];
  
  const handleSend = (text) => {
    onSendMessage(text);
    setChipsInfoVisible(false);
  };

  const handleChoice = (optionText) => {
    onSendMessage(optionText);
    setChipsInfoVisible(false);
  };

  const extractChoices = (msg) => {
    if (!msg || msg.role !== 'assistant') return [];
    const lines = msg.content.split('\n');
    return lines
      .filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'))
      .map(l => l.replace(/^[-*]\s*/, '').trim());
  };

  const lastMsg = history[history.length - 1];
  const choices = extractChoices(lastMsg);

  // Always ensure 4/4 is present in time signature step
  if (sessionData?.step === 7) {
    if (choices.length > 0 && !choices.includes("4/4")) {
      choices.unshift("4/4");
    }
  }

  // Open theory helper sidebar for the chips context
  const handleChipsInfo = (e) => {
    if (e) e.stopPropagation();
    console.log("Chips Info Clicked! Dispatching concept open event for text:", lastMsg?.content);
    if (lastMsg) {
      const event = new CustomEvent('open-theory-concept', { 
        detail: { content: lastMsg.content } 
      });
      window.dispatchEvent(event);
    }
    setChipsInfoVisible(true);
  };

  return (
    <div className="flex flex-col flex-1 bg-[var(--canvas)] relative min-h-0">
      <ProgressBar currentStep={sessionData?.step || 1} />
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0"
      >
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
                  <button 
                    onClick={onGenerateRetry}
                    className="px-[16px] py-[8px] bg-[var(--surface)] border border-[var(--hairline)] hover:border-[var(--accent)] rounded-[8px] text-[var(--ink)] hover:text-white transition-all cursor-pointer font-medium active:scale-95"
                  >
                    Regenerate Track
                  </button>
               </div>
            </div>
          )}

          {audioStatus === 'success' && audioData && (
            <AudioPlayer 
              audioData={audioData} 
              onFeedback={() => {
                const input = document.querySelector('input[type="text"]');
                if (input) input.focus();
              }} 
            />
          )}
          
          {/* Choice Chips with ⓘ theory context header */}
          {!loading && audioStatus !== 'generating' && choices.length > 0 && lastMsg?.role === 'assistant' && (
            <div className="ml-[40px]">
              {/* Chips context row */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-[var(--ink-muted)] font-medium">Choose an option or type your own</span>
                <button
                  onClick={handleChipsInfo}
                  className="flex items-center gap-1 px-[8px] py-[3px] rounded-full border border-[var(--hairline)] bg-[var(--surface)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-glow)] hover:bg-[var(--canvas-elevated)] transition-all text-[11px] cursor-pointer"
                  title="Learn about this music concept"
                >
                  <Info size={11} />
                  <span>What does this mean?</span>
                </button>
              </div>

              <ChoiceChips options={choices} onSelect={handleChoice} />
            </div>
          )}
          
          {/* Scroll Anchor */}
        </div>
      </div>

      <InputBar 
        onSend={handleSend} 
        onBack={sessionData?.step > 1 ? onBack : null}
        onSkip={choices.length > 0 ? () => handleChoice(choices[0]) : null}
        disabled={loading || audioStatus === 'generating'} 
      />
    </div>
  );
}
