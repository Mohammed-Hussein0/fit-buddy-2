import { Tier, TIER_LABELS, TIER_COLORS } from '../../models/types/StrengthStandards';
import { Star } from 'lucide-react';

interface TierBadgeProps {
  tier: Tier;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TierBadge({ tier, showLabel = true, size = 'md', className = '' }: TierBadgeProps) {
  const starSizes = {
    sm: 10,
    md: 13,
    lg: 16,
  };

  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {([1, 2, 3, 4, 5] as Tier[]).map((s) => {
          const filled = s <= tier;
          return (
            <Star
              key={s}
              size={starSizes[size]}
              fill={filled ? '#dc2626' : 'transparent'}
              color={filled ? '#dc2626' : '#27272a'}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      {showLabel && (
        <span className="text-[8px] font-black uppercase tracking-widest font-mono-stat text-neutral-400">
          [{TIER_LABELS[tier]}]
        </span>
      )}
    </div>
  );
}
