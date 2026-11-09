'use client';

import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Heart, MapPin, Trash2, ShoppingBag, Home, Store } from 'lucide-react';
import WishlistButton from '@/components/WishlistButton';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  property: { label: "Ko'chmas mulk", color: 'blue', icon: <Home size={12} /> },
  material:  { label: 'Material',       color: 'cyan', icon: <Store size={12} /> },
  service:   { label: 'Xizmat',         color: 'violet', icon: <ShoppingBag size={12} /> },
};

const TYPE_HREF: Record<string, (id: number) => string> = {
  property: (id) => `/properties/${id}`,
  material:  (id) => `/materials/${id}`,
  service:   (id) => `/workers/${id}`,
};

export default function WishlistPage() {
  const { wishlist, clearWishlist } = useStore();

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Heart className="text-rose-500 fill-rose-500" size={30} />
            Sevimlilar
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {wishlist.length > 0
              ? `${wishlist.length} ta saqlangan e'lon`
              : "Hozircha biror narsa saqlamadingiz"}
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={clearWishlist}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-sm font-semibold transition-all"
          >
            <Trash2 size={16} />
            Hammasini o&apos;chirish
          </button>
        )}
      </div>

      {/* Empty state */}
      {wishlist.length === 0 ? (
        <div className="glass rounded-3xl p-16 flex flex-col items-center justify-center gap-5 text-center">
          <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
            <Heart size={40} className="text-rose-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Sevimlilar bo&apos;sh</h2>
            <p className="text-slate-400 text-sm mt-1">E&apos;lonlarda yurakcha tugmasini bosib saqlang</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/properties" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
              Ko&apos;chmas mulklar
            </Link>
            <Link href="/materials" className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:border-blue-300 transition-all">
              Materiallar
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Type filters */}
          <div className="flex gap-2 flex-wrap">
            {(['property', 'material', 'service'] as const).map((type) => {
              const count = wishlist.filter((w) => w.type === type).length;
              if (!count) return null;
              const meta = TYPE_LABELS[type];
              return (
                <span
                  key={type}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border
                    ${type === 'property' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20' :
                      type === 'material' ? 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-500/10 dark:border-cyan-500/20' :
                      'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:border-violet-500/20'
                    }`}
                >
                  {meta.label} — {count}
                </span>
              );
            })}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const meta = TYPE_LABELS[item.type] || TYPE_LABELS.property;
              const href = TYPE_HREF[item.type]?.(item.id) ?? '#';

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="glass rounded-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-100/30 transition-all duration-300 group"
                >
                  {/* Image */}
                  <div className="h-44 relative bg-slate-100 dark:bg-white/5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Type badge */}
                    <div className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${item.type === 'property' ? 'bg-blue-600 text-white' :
                        item.type === 'material' ? 'bg-cyan-600 text-white' :
                        'bg-violet-600 text-white'
                      }`}
                    >
                      {meta.icon}
                      {meta.label}
                    </div>
                    {/* Wishlist remove button */}
                    <div className="absolute top-3 right-3">
                      <WishlistButton item={item} size={15} />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                      {item.title}
                    </h3>

                    {item.location && (
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MapPin size={11} />
                        <span className="line-clamp-1">{item.location}</span>
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                      <span className={`text-base font-black
                        ${item.type === 'property' ? 'text-blue-600' :
                          item.type === 'material' ? 'text-cyan-600' :
                          'text-violet-600'
                        }`}>
                        {parseFloat(item.price || '0').toLocaleString()} UZS
                      </span>
                      <Link
                        href={href}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-600 hover:text-white text-xs font-bold text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-white/10"
                      >
                        Ko&apos;rish
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
