export default function CardiacDriftWidget() {
  return (
    <div className="bg-white rounded-2xl p-[22px] shadow-sm">
      <div className="flex justify-between mb-4">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Cardiac Drift
        </span>
        <span className="font-sans text-[9px] font-bold text-[var(--color-coral)]">✦ Korsana</span>
      </div>
      <div className="flex flex-col items-center py-5 gap-2.5">
        <span className="text-3xl">📈</span>
        <div className="font-sans text-xs text-[var(--color-text-muted)] text-center leading-relaxed">
          HR stream data required<br />Coming with Garmin integration
        </div>
      </div>
    </div>
  );
}
