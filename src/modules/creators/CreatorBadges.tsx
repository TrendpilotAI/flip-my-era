import { type CreatorStats, getEarnedBadges, BADGE_CONFIG } from './types';

interface CreatorBadgesProps {
  stats: CreatorStats;
  showAll?: boolean;
}

/**
 * Renders earned badges for a creator based on their stats.
 * By default shows only the highest badge; set showAll to display all.
 */
export const CreatorBadges = ({ stats, showAll = false }: CreatorBadgesProps) => {
  const earned = getEarnedBadges(stats);
  if (earned.length === 0) return null;

  const display = showAll ? earned : [earned[earned.length - 1]]; // highest is last in order

  return (
    <span className="inline-flex items-center gap-1">
      {display.map((type) => {
        const cfg = BADGE_CONFIG[type];
        return (
          <span
            key={type}
            title={cfg.label}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${cfg.color} bg-current/10`}
          >
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </span>
        );
      })}
    </span>
  );
};

export default CreatorBadges;
