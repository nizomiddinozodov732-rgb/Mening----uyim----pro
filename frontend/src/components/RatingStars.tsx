'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value?: number;
  count?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (stars: number) => void;
  showCount?: boolean;
  compact?: boolean;
}

export default function RatingStars({
  value = 0,
  count,
  size = 14,
  interactive = false,
  onRate,
  showCount = true,
  compact = false,
}: RatingStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayVal = hovered !== null ? hovered : value;

  return (
    <div className="inline-flex items-center gap-1.5 select-none" onClick={(e) => interactive && e.stopPropagation()}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayVal >= star;
          const isHalf = !isFilled && displayVal >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setHovered(star)}
              onMouseLeave={() => interactive && setHovered(null)}
              onClick={() => interactive && onRate && onRate(star)}
              className={`transition-all duration-150 p-0.5 ${
                interactive
                  ? 'cursor-pointer hover:scale-125 focus:outline-none'
                  : 'cursor-default'
              }`}
              title={interactive ? `${star} yulduz berish` : `${value.toFixed(1)} / 5`}
            >
              <Star
                size={size}
                className={`${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-200 text-amber-400'
                    : 'fill-transparent text-gray-300 dark:text-zinc-600'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {!compact && (
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
          {value > 0 ? value.toFixed(1) : '0.0'}
        </span>
      )}

      {showCount && typeof count === 'number' && (
        <span className="text-[11px] text-gray-400 dark:text-zinc-500">
          ({count})
        </span>
      )}
    </div>
  );
}

