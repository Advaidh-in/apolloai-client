export default function ProgressBar({ currentStep, totalSteps = 12 }) {
  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <div className="w-full sticky top-0 z-10">
      <div className="h-[3px] w-full bg-[var(--surface)] relative">
        <div 
          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--wave)] transition-all duration-400 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="absolute right-4 top-2 text-[11px] font-['JetBrains_Mono'] text-[var(--ink-muted)] tracking-wider">
        {currentStep} / {totalSteps}
      </div>
    </div>
  );
}
