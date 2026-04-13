export default function ActionRail({ primary, secondary, ghost, layout = 'horizontal' }) {
  const isVertical = layout === 'vertical';

  return (
    <div className={`flex gap-2 ${isVertical ? 'flex-col' : 'flex-row flex-wrap'}`}>
      {primary && (
        <button
          onClick={primary.onClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-coral hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none font-sans"
        >
          {primary.icon && <primary.icon size={14} />}
          {primary.label}
        </button>
      )}
      {secondary && (
        <button
          onClick={secondary.onClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-navy bg-navy/8 hover:bg-navy/15 active:scale-[0.98] transition-all cursor-pointer border-none font-sans"
        >
          {secondary.icon && <secondary.icon size={14} />}
          {secondary.label}
        </button>
      )}
      {ghost && (
        <button
          onClick={ghost.onClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-navy hover:bg-navy/5 active:scale-[0.98] transition-all cursor-pointer border-none bg-transparent font-sans"
        >
          {ghost.icon && <ghost.icon size={14} />}
          {ghost.label}
        </button>
      )}
    </div>
  );
}
