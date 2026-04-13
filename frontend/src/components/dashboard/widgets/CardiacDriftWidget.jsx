import DataEmptyState from '../../ui/DataEmptyState';

export default function CardiacDriftWidget() {
  return (
    <div className="widget-card">
      <div className="flex justify-between mb-4">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Cardiac Drift
        </span>
        <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
      </div>
      <DataEmptyState
        variant="nodata"
        title="Coming soon"
        description="HR stream data required — coming with Garmin integration"
      />
    </div>
  );
}
