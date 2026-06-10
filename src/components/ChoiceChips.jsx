import { useState } from 'react';

export default function ChoiceChips({ options, onSelect }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (!options || options.length === 0) return null;

  const handleSelect = (option, idx) => {
    setSelectedIdx(idx);
    onSelect(option);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-6">
      {options.map((option, idx) => {
        const isSelected = selectedIdx === idx;
        const isDisabled = selectedIdx !== null;
        
        return (
          <button
            key={idx}
            onClick={() => handleSelect(option, idx)}
            disabled={isDisabled}
            className={`
              px-[14px] py-[6px] rounded-full text-[12px] transition-all duration-150 ease-in-out font-['Inter']
              ${isSelected 
                ? 'bg-[var(--accent)] border border-[var(--accent)] text-[var(--ink)] pointer-events-none' 
                : 'bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)] hover:text-[var(--ink)]'}
              ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {option.label || option}
          </button>
        );
      })}
    </div>
  );
}
