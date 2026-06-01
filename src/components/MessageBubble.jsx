import React from 'react';
import { Info } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  const handleInfoClick = (e) => {
    e.stopPropagation();
    console.log("ⓘ Clicked! Dispatching concept open event for text:", message.content);
    const event = new CustomEvent('open-theory-concept', { 
      detail: { content: message.content } 
    });
    window.dispatchEvent(event);
  };
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} items-start animate-message-in gap-2`}>
      
      {/* Apollo avatar — left side for assistant */}
      {!isUser && (
        <div className="w-[28px] h-[28px] shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-glow)] flex items-center justify-center shadow-[0_0_10px_var(--accent-muted)] mt-1">
          <span className="text-[11px] font-bold text-white font-['Inter']">A</span>
        </div>
      )}

      {/* Message bubble */}
      <div 
        className={`${
          isUser 
            ? 'bg-[var(--accent-muted)] border border-[var(--accent-deep)] rounded-[16px_16px_4px_16px] max-w-[80%]' 
            : 'bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[16px_16px_16px_4px] max-w-[80%]'
        } p-[14px_20px] text-[14px] text-[var(--ink)]`}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>
      </div>

      {/* ⓘ Info button — shown on the outer edge of every bubble */}
      <button 
        onClick={handleInfoClick}
        className={`
          shrink-0 mt-1 flex items-center justify-center w-[26px] h-[26px] rounded-full
          border transition-all duration-150 cursor-pointer
          ${isUser
            ? 'bg-[var(--accent-muted)] border-[var(--accent-deep)] text-[var(--accent-glow)] hover:bg-[var(--accent-deep)] hover:shadow-[0_0_8px_var(--accent-muted)]'
            : 'bg-[var(--surface)] border-[var(--hairline)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent-glow)] hover:bg-[var(--canvas-elevated)]'
          }
        `}
        title={isUser ? "Explain the theory behind your choice" : "Learn more about this music concept"}
      >
        <Info size={13} />
      </button>
    </div>
  );
}
