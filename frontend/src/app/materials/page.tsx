'use client';

import { useState, useEffect } from 'react';
import { api, useStore } from '@/store/useStore';
import { Store, Search, ArrowRight, Package, Star, X, MessageSquare, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import MapComponent from '@/components/MapComponent';
import WishlistButton from '@/components/WishlistButton';
import RatingSection from '@/components/RatingSection';
import ReportModal from '@/components/ReportModal';

interface MaterialCategory { id: string; name: string; }
interface Material {
  id: number; name: string; category: string; category_display?: string;
  price: string; unit: string; description: string; image: string | null;
  rating?: number; rating_count?: number;
  store_detail?: { id: number; name: string; phone: string; location: string; rating?: number; rating_count?: number; owner_id?: number; owner?: number; };
}

export default function Materials() {
  const { isLoggedIn } = useStore();
  const [materials,  setMaterials]  = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [cat,        setCat]        = useState<string | null>(null);
  const [sortBy,     setSortBy]     = useState<'rating' | 'price_asc' | 'price_desc' | 'newest'>('rating');
  // Reyting modal — do'kon id va material id
  const [ratingStoreId, setRatingStoreId] = useState<number | null>(null);
  const [ratingMaterialId, setRatingMaterialId] = useState<number | null>(null);
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    targetId: number;
    targetTitle: string;
    targetType: 'material' | 'store';
    accusedId?: number;
  }>({ isOpen: false, targetId: 0, targetTitle: '', targetType: 'material' });

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get('/materials/items/'), api.get('/materials/categories/')])
      .then(([m, c]) => {
        setMaterials(m.data.results || m.data || []);
        setCategories(c.data.results || c.data || []);
      })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const items = materials
    .filter(m => {
      const q = search.toLowerCase();
      return (!q || m.name.toLowerCase().includes(q)) && (!cat || m.category === cat);
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        const rA = a.rating ?? 0;
        const rB = b.rating ?? 0;
        if (rB !== rA) return rB - rA;
        return (b.rating_count ?? 0) - (a.rating_count ?? 0);
      }
      if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      return b.id - a.id;
    });

  // Tanlangan do'kon va material
  const activeStore = ratingStoreId
    ? items.find(i => i.store_detail?.id === ratingStoreId)?.store_detail
    : null;
  const activeMaterial = ratingMaterialId
    ? items.find(i => i.id === ratingMaterialId)
    : null;

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] flex items-center gap-2">
            <Store size={28} className="text-cyan-600" /> Qurilish Materiallari
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Ishonchli do&apos;konlar va raqobatbardosh narxlar</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
            <input type="text" placeholder="Material qidirish..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 pr-3 py-2.5" />
          </div>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-2)] outline-none"
          >
            <option value="rating">⭐ TOP Reyting</option>
            <option value="newest">Eng yangi</option>
            <option value="price_asc">Arzonroq</option>
            <option value="price_desc">Qimmatroq</option>
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <button type="button" onClick={() => setCat(null)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${!cat ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20' : 'border-[var(--border)] text-[var(--text-2)] hover:border-cyan-300 hover:text-cyan-600'}`}>
          Barchasi
        </button>
        {categories.map(c => (
          <button key={c.id} type="button" onClick={() => setCat(c.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${cat === c.id ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/20' : 'border-[var(--border)] text-[var(--text-2)] hover:border-cyan-300 hover:text-cyan-600'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1,2,3,4,5,6,7,8].map(n => <div key={n} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card rounded-2xl p-14 text-center text-[var(--text-3)] flex flex-col items-center gap-3">
          <Package size={40} className="opacity-30" />
          <p className="font-semibold">Materiallar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map(item => (
            <div key={item.id} className="card card-hover rounded-2xl overflow-hidden flex flex-col group">
              <div className="h-40 relative overflow-hidden bg-[var(--bg-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800'}
                  alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 img-overlay" />
                <span className="absolute top-3 left-3 badge tag-cyan">{item.category_display || item.category}</span>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <WishlistButton item={{ id: item.id, type: 'material', title: item.name, price: item.price, image: item.image, location: item.store_detail?.location, addedAt: new Date().toISOString() }} />
                </div>
              </div>

              <div className="p-4 flex flex-col gap-2.5 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[var(--text)] line-clamp-2 leading-snug flex-1">{item.name}</h3>
                  <button
                    type="button"
                    onClick={() => setRatingMaterialId(item.id)}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0 hover:bg-amber-100 transition-colors"
                    title="Materialga baho va sharhlar"
                  >
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                    <span>{(item.rating ?? 0).toFixed(1)}</span>
                    <span className="text-[10px] text-[var(--text-3)] font-normal">({item.rating_count ?? 0})</span>
                  </button>
                </div>

                {item.store_detail?.name && (
                  <div className="flex items-center justify-between text-xs text-[var(--text-3)]">
                    <div className="flex items-center gap-1.5">
                      <Store size={11} className="text-cyan-500 shrink-0" />
                      <span className="line-clamp-1">{item.store_detail.name}</span>
                    </div>
                    {item.store_detail.rating !== undefined && (
                      <button
                        type="button"
                        onClick={() => setRatingStoreId(item.store_detail!.id)}
                        className="text-[10px] text-cyan-600 hover:underline"
                        title="Do'kon reytingi"
                      >
                        Do&apos;kon: {item.store_detail.rating.toFixed(1)}★
                      </button>
                    )}
                  </div>
                )}
                <p className="text-xs text-[var(--text-3)] line-clamp-2 flex-1">{item.description}</p>

                <div className="pt-3 border-t border-[var(--border)] flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-[var(--text-3)] font-semibold mb-0.5">Narx</p>
                    <p className="text-base font-black text-cyan-600">{parseFloat(item.price).toLocaleString()} <span className="text-xs font-semibold text-[var(--text-3)]">UZS / {item.unit}</span></p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Materialga baho berish tugmasi */}
                    <button type="button"
                      onClick={() => setRatingMaterialId(item.id)}
                      className="p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-500 hover:bg-amber-100 transition-all flex items-center gap-1 text-xs font-bold"
                      title="Materialga baho berish">
                      <Star size={14} className="fill-amber-400" />
                    </button>
                    {/* Materialga shikoyat qilish */}
                    <button type="button"
                      onClick={() => setReportModal({
                        isOpen: true,
                        targetId: item.id,
                        targetTitle: item.name,
                        targetType: 'material',
                        accusedId: item.store_detail?.owner_id || item.store_detail?.owner,
                      })}
                      className="p-2 rounded-xl text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-[var(--border)] transition-all flex items-center"
                      title="Shikoyat qilish">
                      <AlertTriangle size={14} />
                    </button>
                    <Link href={`/chat?store_id=${item.store_detail?.id || ''}`}
                      className="btn btn-primary text-[11px] px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/20 flex items-center gap-1">
                      <MessageSquare size={11} /> Bog&apos;lanish
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <section className="flex flex-col gap-4 mt-4">
        <div>
          <h2 className="section-title">Do&apos;konlar Xaritasi</h2>
          <p className="section-sub">Qurilish mollari do&apos;konlarini xaritadan toping</p>
        </div>
        <div className="h-96 relative rounded-3xl overflow-hidden shadow-xl border border-[var(--border)]">
          <MapComponent activeId={undefined} onSelect={() => {}} className="absolute inset-0 rounded-none border-none" />
        </div>
      </section>

      {/* ════ Material Reyting Modali ════ */}
      {ratingMaterialId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setRatingMaterialId(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h2 className="font-extrabold text-[var(--text)]">{activeMaterial?.name || "Material"}</h2>
                <p className="text-xs text-[var(--text-3)] mt-0.5">Ushbu mahsulotga 5 yulduzli baho va sharh qoldiring</p>
              </div>
              <button type="button" onClick={() => setRatingMaterialId(null)}
                className="p-2 rounded-xl text-[var(--text-3)] hover:bg-[var(--bg-2)] transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <RatingSection
                endpoint={`/materials/items/${ratingMaterialId}`}
                rating={activeMaterial?.rating ?? 0}
                ratingCount={activeMaterial?.rating_count ?? 0}
                color="amber"
                onUpdate={(newRating, newCount) => {
                  setMaterials(prev => prev.map(m => m.id === ratingMaterialId ? { ...m, rating: newRating, rating_count: newCount } : m));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ════ Do'kon Reyting Modali ════ */}
      {ratingStoreId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setRatingStoreId(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div>
                <h2 className="font-extrabold text-[var(--text)]">{activeStore?.name || "Do'kon"}</h2>
                <p className="text-xs text-[var(--text-3)] mt-0.5">Do&apos;kon sifatini baholang</p>
              </div>
              <button type="button" onClick={() => setRatingStoreId(null)}
                className="p-2 rounded-xl text-[var(--text-3)] hover:bg-[var(--bg-2)] transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <RatingSection
                endpoint={`/materials/stores/${ratingStoreId}`}
                rating={activeStore?.rating ?? 0}
                ratingCount={activeStore?.rating_count ?? 0}
                ownerId={activeStore?.owner}
                color="emerald"
              />
            </div>
          </div>
        </div>
      )}

      {/* ════ Shikoyat Modali ════ */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
        targetId={reportModal.targetId}
        targetTitle={reportModal.targetTitle}
        targetType={reportModal.targetType}
        accusedId={reportModal.accusedId}
      />
    </div>
  );
}
