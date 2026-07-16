export function BrandLoader({ label = 'Preparing your workspace', compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className={`chakra-container ${compact ? 'scale-75' : ''}`}>
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="chakra-glow" />
          <div className="chakra-ring-outer animate-chakra-spin" />
          <div className="chakra-wheel animate-[spin_8s_linear_infinite]">
            {[...Array(12)].map((_, index) => <span key={index} className="chakra-spoke" style={{ transform: `rotate(${index * 15}deg)` }} />)}
            <span className="relative z-10 h-2 w-2 rounded-full bg-navy-950" />
          </div>
        </div>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-navy-700">{label}</span>
    </div>
  );
}
