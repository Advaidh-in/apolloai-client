import { useState, useRef, useEffect } from 'react';

const isCustom = (opt) => {
  const t = (opt?.label || opt || '').toLowerCase();
  return t.includes('write your own') || t.includes('specify your own') || t.includes('custom ');
};

const getInputPlaceholder = (opt) => {
  const t = (opt?.label || opt || '').toLowerCase();
  if (t.includes('artist'))     return 'e.g. Perturbator, Carpenter Brut...';
  if (t.includes('genre'))      return 'e.g. Dark Ambient, Witch House...';
  if (t.includes('instrument')) return 'e.g. Hang drum, Theremin...';
  if (t.includes('mood'))       return 'e.g. Melancholic, Euphoric...';
  if (t.includes('style'))      return 'Describe the style...';
  return 'Type your answer...';
};

export default function ChoiceChips({ options, onSelect }) {
  const [selectedIdx, setSelectedIdx]   = useState(null);
  const [customForIdx, setCustomForIdx] = useState(null);
  const [customValue, setCustomValue]   = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (customForIdx !== null) inputRef.current?.focus();
  }, [customForIdx]);

  if (!options || options.length === 0) return null;

  const handleChipClick = (option, idx) => {
    if (selectedIdx !== null) return; // already locked
    if (isCustom(option)) {
      setCustomForIdx(idx);
      setCustomValue('');
    } else {
      setSelectedIdx(idx);
      onSelect(option?.label || option);
    }
  };

  const submitCustom = () => {
    const val = customValue.trim();
    if (!val) return;
    setSelectedIdx(customForIdx);
    setCustomForIdx(null);
    onSelect(val);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); submitCustom(); }
    if (e.key === 'Escape') { setCustomForIdx(null); setCustomValue(''); }
  };

  const locked = selectedIdx !== null;

  return (
    <div className="flex flex-col gap-2 mt-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {options.map((option, idx) => {
          const label        = option?.label || option;
          const isSelected   = selectedIdx === idx;
          const isPending    = customForIdx === idx;
          const isDisabled   = locked && !isSelected;

          return (
            <button
              key={idx}
              onClick={() => handleChipClick(option, idx)}
              disabled={isDisabled}
              className={`
                px-[14px] py-[6px] rounded-full text-[12px] transition-all duration-150 ease-in-out font-['Inter']
                ${isSelected
                  ? 'bg-[var(--accent)] border border-[var(--accent)] text-white pointer-events-none'
                  : isPending
                  ? 'bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--ink)]'
                  : 'bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] hover:text-[var(--ink)]'}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {label}
            </button>
          );
        })}
      </div>

      {customForIdx !== null && (
        <div className="flex gap-2 items-center animate-message-in">
          <input
            ref={inputRef}
            type="text"
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={getInputPlaceholder(options[customForIdx])}
            className="flex-1 bg-[var(--surface)] border border-[var(--accent)]/40 focus:border-[var(--accent)] rounded-xl px-4 py-[9px] text-[13px] text-[var(--ink)] placeholder-[var(--ink-muted)] outline-none transition-colors"
          />
          <button
            onClick={submitCustom}
            disabled={!customValue.trim()}
            className="px-4 py-[9px] bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
