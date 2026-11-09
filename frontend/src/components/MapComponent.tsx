'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Search, MapPin, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  latitude: number;
  longitude: number;
}

interface Props {
  activeId?: number;
  onSelect?: (id: number) => void;
  className?: string;
}

let _cache: Property[] | null = null;

function MapComponent({ activeId, onSelect, className }: Props) {
  const [properties,   setProperties]   = useState<Property[]>(_cache ?? []);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [mapSrc,       setMapSrc]       = useState("https://maps.google.com/maps?q=Tashkent,Uzbekistan&z=11&output=embed");
  const [selected,     setSelected]     = useState<Property | null>(null);
  const [showList,     setShowList]     = useState(true);

  // E'lonlarni yuklash
  useEffect(() => {
    if (_cache !== null) return;
    api.get('/properties/', { params: { page_size: 200 } })
      .then(r => {
        _cache = r.data.results || r.data || [];
        setProperties(_cache!);
      })
      .catch(() => { _cache = []; });
  }, []);

  // Aktiv e'lon o'zgarganda — xaritani yangilash
  useEffect(() => {
    if (activeId) {
      const prop = properties.find(p => p.id === activeId);
      if (prop && prop.latitude && prop.longitude) {
        setSelected(prop);
        setMapSrc(`https://maps.google.com/maps?q=${prop.latitude},${prop.longitude}&z=15&output=embed`);
      }
    }
  }, [activeId, properties]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(q + " O'zbekiston")}&z=13&output=embed`);
    setSelected(null);
  }, [searchQuery]);

  const handlePropertyClick = useCallback((prop: Property) => {
    if (prop.latitude && prop.longitude) {
      setSelected(prop);
      setMapSrc(`https://maps.google.com/maps?q=${prop.latitude},${prop.longitude}&z=15&output=embed`);
      onSelect?.(prop.id);
    } else if (prop.location) {
      // Koordinata yo'q — location bo'yicha
      setSelected(prop);
      setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(prop.location)}&z=14&output=embed`);
      onSelect?.(prop.id);
    }
  }, [onSelect]);

  const withCoords = properties.filter(p => p.latitude && p.longitude);

  return (
    <div className={`w-full h-full relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-2)] flex ${className ?? ''}`}>

      {/* ════ Chap tomon — xarita ════ */}
      <div className="flex-1 relative min-w-0">
        {/* Qidiruv */}
        <form onSubmit={handleSearch} className="absolute top-3 left-3 right-3 z-10">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Shahar yoki tuman..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 dark:border-white/20 rounded-xl pl-9 pr-12 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
            <button type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all">
              Izla
            </button>
          </div>
        </form>

        {/* Google Maps */}
        <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0, minHeight: '300px' }}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen title="Xarita" />

        {/* Aktiv e'lon info */}
        {selected && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-72 z-10">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{selected.title}</h4>
                  <button type="button" onClick={() => setSelected(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 text-xs">✕</button>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={11} className="text-blue-500" /> {selected.location}
                </p>
                <p className="text-base font-black text-blue-600">
                  {parseFloat(selected.price).toLocaleString()} UZS
                </p>
                <Link href={`/properties/${selected.id}`}
                  className="w-full mt-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-all">
                  Batafsil ko&apos;rish →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Ro'yxatni ochib/yopish tugmasi (mobile) */}
        <button type="button" onClick={() => setShowList(!showList)}
          className="absolute top-3 right-3 z-10 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5">
          <MapPin size={13} /> {withCoords.length} e&apos;lon
        </button>
      </div>

      {/* ════ O'ng tomon — e'lonlar ro'yxati ════ */}
      {showList && (
        <div className="w-72 hidden sm:flex flex-col bg-[var(--surface)] border-l border-[var(--border)] overflow-hidden">
          {/* Sarlavha */}
          <div className="px-4 py-3 border-b border-[var(--border)] shrink-0">
            <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <MapPin size={15} className="text-blue-500" />
              Xaritadagi e&apos;lonlar
            </p>
            <p className="text-[11px] text-[var(--text-3)] mt-0.5">{withCoords.length} ta e&apos;lon topildi</p>
          </div>

          {/* Ro'yxat — scrolllanadigan */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {withCoords.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-3)]">
                <MapPin size={24} className="mx-auto opacity-30 mb-2" />
                Hozircha e&apos;lonlar yo&apos;q. Backend ishga tushganda ko&apos;rinadi.
              </div>
            ) : (
              withCoords.map((prop) => {
                const isActive = (activeId === prop.id) || (selected?.id === prop.id);
                return (
                  <button key={prop.id} type="button"
                    onClick={() => handlePropertyClick(prop)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md'
                        : 'border-[var(--border)] hover:border-blue-300 hover:bg-[var(--bg-2)]'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs text-[var(--text)] line-clamp-1">{prop.title}</h5>
                      <ChevronRight size={13} className={`shrink-0 transition-colors ${isActive ? 'text-blue-500' : 'text-[var(--text-3)]'}`} />
                    </div>
                    <p className="text-[11px] text-[var(--text-3)] flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-blue-400 shrink-0" />
                      <span className="line-clamp-1">{prop.location}</span>
                    </p>
                    <p className="text-sm font-black text-blue-600 mt-1.5">
                      {parseFloat(prop.price).toLocaleString()} <span className="text-[10px] font-semibold text-[var(--text-3)]">UZS</span>
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MapComponent);
