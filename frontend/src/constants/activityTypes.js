export const ACTIVITY_CONFIGS = {
  run: {
    label: 'Run',
    icon: '🏃',
    color: 'var(--color-navy)',
    isDistanceBased: true,
  },
  cycling: {
    label: 'Cycling',
    icon: '🚴',
    color: '#3B82F6',
    isDistanceBased: true,
  },
  swimming: {
    label: 'Swimming',
    icon: '🏊',
    color: '#06B6D4',
    isDistanceBased: true,
  },
  rowing: {
    label: 'Rowing',
    icon: '🚣',
    color: '#0D9488',
    isDistanceBased: true,
  },
  walking: {
    label: 'Walking',
    icon: '🥾',
    color: '#22C55E',
    isDistanceBased: true,
  },
  hiking: {
    label: 'Hiking',
    icon: '⛰️',
    color: '#16A34A',
    isDistanceBased: true,
  },
  weight_lifting: {
    label: 'Strength',
    icon: '🏋️',
    color: 'var(--color-coral)',
    isDistanceBased: false,
  },
  elliptical: {
    label: 'Elliptical',
    icon: '🔄',
    color: 'var(--color-amber)',
    isDistanceBased: false,
  },
  stair_master: {
    label: 'Stair Master',
    icon: '🪜',
    color: '#F97316',
    isDistanceBased: false,
  },
  workout: {
    label: 'Workout',
    icon: '💪',
    color: '#8B5CF6',
    isDistanceBased: false,
  },
  recovery: {
    label: 'Recovery',
    icon: '🧘',
    color: '#6B7280',
    isDistanceBased: false,
  },
};

export const DISTANCE_BASED_TYPES = new Set(
  Object.entries(ACTIVITY_CONFIGS)
    .filter(([, cfg]) => cfg.isDistanceBased)
    .map(([type]) => type)
);
