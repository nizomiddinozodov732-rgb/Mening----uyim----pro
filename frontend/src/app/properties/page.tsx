'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import {
  Search, MapPin, Bed, Bath, Expand, SlidersHorizontal, Plus,
  LayoutGrid, Map, Rows3, Star, ArrowUpDown, AlertTriangle
} from 'lucide-react';
import MapComponent from '@/components/MapComponent';
import WishlistButton from '@/components/WishlistButton';
import RatingStars from '@/components/RatingStars';
import PropertyRatingModal from '@/components/PropertyRatingModal';
import ReportModal from '@/components/ReportModal';

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  property_type: string;
  type_display: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  primary_image: string | null;
  rating?: number;
  rating_count?: number;
  user_rating?: number | null;
}

export default function Properties() {
  const { user } = useStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState({
    type: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    search: '',
    ordering: '-rating', // Default: reytingi yuqorilar TOPda
  });
  const [view, setView]             = useState<'grid' | 'list' | 'map'>('grid');
  const [activeId, setActiveId]     = useState<number | undefined>();

  // Rating modal state
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    propertyId: number;
    propertyTitle: string;
    initialStars?: number;
  }>({
    isOpen: false,
    propertyId: 0,
    propertyTitle: '',
    initialStars: 5,
  });

  // Report modal state
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    targetId: number;
    targetTitle: string;
  }>({
    isOpen: false,
    targetId: 0,
    targetTitle: '',
  });

  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const p: Record<string, string> = {};
      if (filters.type)      p.type      = filters.type;
      if (filters.min_price) p.min_price = filters.min_price;
      if (filters.max_price) p.max_price = filters.max_price;
      if (filters.bedrooms)  p.bedrooms  = filters.bedrooms;
      if (filters.search)    p.search    = filters.search;
      if (filters.ordering)  p.ordering  = filters.ordering;

      const r = await api.get('/properties/', { params: p, signal: controller.signal });
      setProperties(r.data.results || r.data || []);
    } catch (e: unknown) {
      if ((e as { name?: string }).name !== 'AbortError' && (e as { name?: string }).name !== 'CanceledError') {
        console.error(e);
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [filters.type, filters.bedrooms, filters.ordering]);

  const handleRatingSuccess = (updatedData: { rating: number; rating_count: number }) => {
    // Ro'yxatni yangilab, reyting o'zgarganda saralashni yangilash
    setProperties((prev) => {
      const updated = prev.map((item) =>
        item.id === ratingModal.propertyId
          ? { ...item, rating: updatedData.rating, rating_count: updatedData.rating_count }
          : item
      );
      // Agar -rating bo'yicha saralangan bo'lsa, ro'yxatni yangi reyting bo'yicha saralab qo'yamiz
      if (filters.ordering === '-rating') {
        return [...updated].sort((a, b) => ((b.rating || 0) - (a.rating || 0)));
      }
      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-6 py-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)]">Ko&apos;chmas Mulklar</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">
            Sotiladigan va ijaraga beriladigan e&apos;lonlar — eng yuqori reytingli e&apos;lonlar TOPda
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex bg-[var(--bg-2)] p-1 rounded-xl border border-[var(--border)]">
            {([['grid', LayoutGrid], ['list', Rows3], ['map', Map]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 rounded-lg transition-all ${view === v ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          {user?.profession !== 'customer' && (
            <Link href="/properties/add"
              className="btn btn-primary px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5">
              <Plus size={15} /> E&apos;lon joylash
            </Link>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative lg:col-span-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
          <input type="text" placeholder="Shahar, manzil..."
            value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })}
            className="glass-input pl-9 pr-3 py-2.5 w-full" />
        </div>
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}
          className="glass-input px-3 py-2.5">
          <option value="">Barcha turlar</option>
          <option value="house">Hovli / Kottedj</option>
          <option value="apartment">Kvartira</option>
          <option value="land">Yer maydoni</option>
          <option value="rental">Ijara</option>
        </select>
        <input type="number" placeholder="Min narx" value={filters.min_price}
          onChange={e => setFilters({ ...filters, min_price: e.target.value })}
          className="glass-input px-3 py-2.5" />
        <input type="number" placeholder="Max narx" value={filters.max_price}
          onChange={e => setFilters({ ...filters, max_price: e.target.value })}
          className="glass-input px-3 py-2.5" />

        {/* Saralash (Ordering) */}
        <div className="relative">
          <select
            value={filters.ordering}
            onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}
            className="glass-input px-3 py-2.5 w-full font-medium text-amber-600 dark:text-amber-400"
          >
            <option value="-rating">⭐ Top reyting (Yuqori)</option>
            <option value="-created_at">🕒 Eng yangi</option>
            <option value="price">💰 Arzonroq</option>
            <option value="-price">💎 Qimmatroq</option>
            <option value="-views_count">👁️ Ko&apos;p ko&apos;rilgan</option>
          </select>
        </div>

        <button onClick={load}
          className="btn btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
          <SlidersHorizontal size={15} /> Filtrlash
        </button>
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className="relative w-full h-[calc(100vh-240px)] min-h-[560px] rounded-3xl overflow-hidden shadow-xl border border-[var(--border)] flex flex-col justify-end">
          <MapComponent activeId={activeId} onSelect={setActiveId} className="absolute inset-0 rounded-none border-none" />
          {properties.length > 0 && (
            <div className="relative z-10 w-full overflow-x-auto pb-5 pt-3 px-5 hide-scrollbar bg-gradient-to-t from-black/40 to-transparent">
              <div className="flex gap-3 w-max">
                {properties.map((p) => (
                  <div key={p.id} onClick={() => setActiveId(p.id)} onMouseEnter={() => setActiveId(p.id)}
                    className={`w-64 bg-[var(--surface)]/95 backdrop-blur-xl rounded-2xl shadow-xl border flex-shrink-0 overflow-hidden cursor-pointer transition-all hover:-translate-y-1 ${activeId === p.id ? 'border-blue-500' : 'border-[var(--border)]'}`}>
                    <div className="h-28 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.primary_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'} alt={p.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 img-overlay" />
                      {(p.rating || 0) >= 4.0 && (p.rating_count || 0) > 0 && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center gap-1 shadow">
                          <Star size={9} className="fill-white" /> TOP
                        </span>
                      )}
                      <p className="absolute bottom-2 left-3 text-white font-black text-sm">{parseFloat(p.price).toLocaleString()} UZS</p>
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-xs text-[var(--text)] line-clamp-1">{p.title}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <RatingStars value={p.rating || 0} count={p.rating_count || 0} size={11} />
                        <p className="text-[10px] text-[var(--text-3)] flex items-center gap-0.5"><MapPin size={9} />{p.location}</p>
                      </div>
                      <Link href={`/properties/${p.id}`} className="mt-2 block text-center text-[10px] font-bold text-blue-600 hover:underline">Ko&apos;rish →</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid / List view */}
      {view !== 'map' && (
        <div className={`grid gap-8 ${view === 'grid' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
          <div className={`${view === 'grid' ? 'lg:col-span-2' : ''} flex flex-col gap-5`}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1,2,3,4].map(n => <div key={n} className="skeleton h-72 rounded-2xl" />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="card rounded-2xl p-14 text-center text-[var(--text-3)]">
                <p className="font-semibold">E&apos;lonlar topilmadi</p>
                <p className="text-sm mt-1">Boshqa filtrlardan foydalaning</p>
              </div>
            ) : (
              <div className={`grid gap-5 ${view === 'list' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {properties.map((p) => {
                  const isTopRated = (p.rating || 0) >= 4.0 && (p.rating_count || 0) > 0;

                  return (
                    <article key={p.id}
                      className={`card card-hover rounded-2xl overflow-hidden flex flex-col group ${isTopRated ? 'ring-1 ring-amber-500/30' : ''}`}>
                      <div className="h-48 relative overflow-hidden bg-[var(--bg-2)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.primary_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'}
                          alt={p.title} loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 img-overlay" />
                        <span className="absolute top-3 left-3 badge tag-blue">{p.type_display}</span>

                        {/* Top Rating Badge */}
                        {isTopRated && (
                          <span className="absolute top-3 right-12 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-lg shadow-amber-500/40">
                            <Star size={11} className="fill-white" /> TOP
                          </span>
                        )}

                        <p className="absolute bottom-3 left-3 text-white font-black text-base drop-shadow">{parseFloat(p.price).toLocaleString()} UZS</p>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <WishlistButton item={{ id: p.id, type: 'property', title: p.title, price: p.price, image: p.primary_image, location: p.location, addedAt: new Date().toISOString() }} />
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm text-[var(--text)] line-clamp-1">{p.title}</h3>
                        </div>

                        {/* Rating row with interactive rate button */}
                        <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
                          <RatingStars value={p.rating || 0} count={p.rating_count || 0} size={13} />
                          <button
                            type="button"
                            onClick={() => setRatingModal({
                              isOpen: true,
                              propertyId: p.id,
                              propertyTitle: p.title,
                              initialStars: 5,
                            })}
                            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <Star size={11} className="fill-amber-400" /> Baholash
                          </button>
                        </div>

                        <p className="flex items-center gap-1 text-xs text-[var(--text-3)]">
                          <MapPin size={11} className="text-blue-400 shrink-0" />
                          <span className="line-clamp-1">{p.location}</span>
                        </p>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-3)] mt-1">
                          {p.bedrooms  > 0 && <span className="flex items-center gap-1"><Bed  size={12} className="text-blue-400"/>{p.bedrooms}</span>}
                          {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={12} className="text-blue-400"/>{p.bathrooms}</span>}
                          <span className="flex items-center gap-1"><Expand size={12} className="text-blue-400"/>{p.area} m²</span>
                        </div>

                        <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center gap-2">
                          <Link href={`/properties/${p.id}`} className="btn btn-outline flex-1 py-2 rounded-xl text-xs hover:border-blue-400 hover:text-blue-600 text-center">
                            Batafsil ko&apos;rish →
                          </Link>
                          <button
                            type="button"
                            onClick={() => setReportModal({
                              isOpen: true,
                              targetId: p.id,
                              targetTitle: p.title,
                            })}
                            className="p-2 rounded-xl text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all"
                            title="E'longa shikoyat qilish"
                          >
                            <AlertTriangle size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky map */}
          {view === 'grid' && (
            <div className="hidden lg:block h-[680px] sticky top-24">
              <MapComponent activeId={activeId} onSelect={setActiveId} />
            </div>
          )}
        </div>
      )}

      {/* Property Rating Modal */}
      <PropertyRatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal((prev) => ({ ...prev, isOpen: false }))}
        propertyId={ratingModal.propertyId}
        propertyTitle={ratingModal.propertyTitle}
        initialStars={ratingModal.initialStars}
        onRatingSuccess={handleRatingSuccess}
      />

      {/* Property Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal((prev) => ({ ...prev, isOpen: false }))}
        targetType="property"
        targetId={reportModal.targetId}
        targetTitle={reportModal.targetTitle}
      />
    </div>
  );
}
