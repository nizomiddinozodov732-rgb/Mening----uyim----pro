'use client';

import { memo, useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useStore, WishlistItem } from '@/store/useStore';

interface Props {
  item: WishlistItem;
  size?: number;
  className?: string;
}

function WishlistButton({ item, size = 18, className = '' }: Props) {
  // Faqat kerakli state ni subscribe qilamiz — keraksiz re-render yo'q
  const isInWishlist  = useStore(s => s.isInWishlist);
  const toggleWishlist = useStore(s => s.toggleWishlist);
  const active = isInWishlist(item.id, item.type);
  const [pop, setPop] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPop(true);
    toggleWishlist(item);
    setTimeout(() => setPop(false), 350);
  }, [item, toggleWishlist]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Sevimlilardan olib tashlash' : "Sevimlilarga qo'shish"}
      className={`
        flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
        ${active
          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
          : 'bg-[var(--surface)]/90 text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shadow-md'}
        ${pop ? 'scale-125' : 'scale-100'}
        ${className}
      `}
    >
      <Heart size={size} className={active ? 'fill-white' : ''} />
    </button>
  );
}

export default memo(WishlistButton);
