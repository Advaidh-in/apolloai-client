import { Info } from 'lucide-react';

// Render **bold**, *italic*, and plain text inline without a markdown library
function renderInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(<span key={i++}>{text.slice(last, m.index)}</span>);
    if (m[2] !== undefined) parts.push(<strong key={i++}>{m[2]}</strong>);
    else if (m[3] !== undefined) parts.push(<em key={i++}>{m[3]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return parts;
}

function FormattedMessage({ content }) {
  return (
    <div className="leading-relaxed space-y-1">
      {content.split('\n').map((line, idx) => {
        const trimmed = line.trimStart();
        // Bullet lines (- or * followed by space + non-*)
        if (trimmed.startsWith('- ') || trimmed.match(/^\*\s+\S/)) {
          const body = trimmed.replace(/^[-*]\s+/, '');
          return (
            <div key={idx} className="flex gap-2">
              <span className="text-[var(--accent-glow)] mt-px shrink-0">•</span>
              <span>{renderInline(body)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  const handleInfoClick = (e) => {
    e.stopPropagation();
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
        {isUser
          ? <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
          : <FormattedMessage content={message.content} />
        }
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
