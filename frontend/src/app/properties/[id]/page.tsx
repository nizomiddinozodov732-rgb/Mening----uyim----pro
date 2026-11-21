'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import {
  MapPin, Bed, Bath, Expand, MessageSquare, PhoneCall, Video, Star,
  ChevronLeft, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Trash2,
  Eye, Calendar, Home, AlertTriangle, Pencil
} from 'lucide-react';
import Link from 'next/link';
import RatingStars from '@/components/RatingStars';
import WishlistButton from '@/components/WishlistButton';
import RatingSection from '@/components/RatingSection';
import ReportModal from '@/components/ReportModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';

interface RatingItem {
  id: number;
  user: number;
  user_detail: { id: number; username: string; first_name: string; last_name: string; avatar: string | null; };
  stars: number;
  comment: string;
  created_at: string;
}

interface Property {
  id: number;
  title: string;
  price: string;
  location: string;
  latitude?: number;
  longitude?: number;
  property_type: string;
  type_display: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  features: string[];
  video_url?: string;
  views_count: number;
  rating: number;
  rating_count: number;
  user_rating?: { id: number; stars: number; comment: string } | null;
  ratings?: RatingItem[];
  owner: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    avatar: string | null;
    rating: number;
    rating_count: number;
    profession_display: string;
  };
  images: Array<{ id: number; image: string; is_primary: boolean; }>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PropertyDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn, user } = useStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [rateStars, setRateStars]     = useState(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [rateComment, setRateComment] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [rateSuccess, setRateSuccess] = useState<string | null>(null);
  const [rateError,   setRateError]   = useState<string | null>(null);
  const [reportOpen,  setReportOpen]  = useState(false);

  /* ── O'chirish ─────────────────────────────────────────── */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [deleteErr,  setDeleteErr]  = useState<string | null>(null);
  const [deleted,    setDeleted]    = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/properties/${id}/`);
      setProperty(res.data);
      const primary = res.data.images?.find((i: { is_primary: boolean }) => i.is_primary)?.image
        || res.data.images?.[0]?.image || '';
      setActiveImage(primary);
      if (res.data.user_rating) {
        setRateStars(res.data.user_rating.stars);
        setRateComment(res.data.user_rating.comment || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [id]);

  const handleChat = async () => {
    if (!isLoggedIn) { router.push('/login'); return; }
    try {
      const res = await api.post('/chat/conversations/', {
        recipient_id: property?.owner.id,
        property_id: property?.id,
      });
      router.push(`/chat?conv=${res.data.id}`);
    } catch (err) { console.error(err); }
  };

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { router.push('/login'); return; }
    if (!property) return;
    if (user?.id === property.owner.id) {
      setRateError("O'zingizning e'loningizga reyting bera olmaysiz.");
      return;
    }
    setSubmitting(true); setRateError(null); setRateSuccess(null);
    try {
      await api.post(`/properties/${property.id}/rate/`, { stars: rateStars, comment: rateComment });
      setRateSuccess("Rahmat! Reyting saqlandi 🎉");
      await fetchDetail();
      setTimeout(() => setRateSuccess(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; detail?: string } } };
      setRateError(e.response?.data?.error || e.response?.data?.detail || "Xatolik yuz berdi");
    } finally { setSubmitting(false); }
  };

  const handleDeleteRating = async () => {
    if (!property) return;
    try {
      await api.delete(`/properties/${property.id}/delete_rating/`);
      setRateStars(5); setRateComment('');
      setRateSuccess("Reyting o'chirildi");
      await fetchDetail();
      setTimeout(() => setRateSuccess(null), 3000);
    } catch (err) { console.error(err); }
  };

  /* ── E'lonni o'chirish (faqat egasi/admin) ─────────────── */
  const handleDelete = async () => {
    if (!property) return;
    setDeleting(true); setDeleteErr(null);
    try {
      await api.delete(`/properties/${property.id}/`);
      setDeleteOpen(false);
      setDeleted(true);
      setTimeout(() => router.push('/properties'), 1600);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { error?: string; detail?: string } } };
      const s = e.response?.status;
      if (s === 403) {
        setDeleteErr("Bu e'lonni o'chirish huquqingiz yo'q.");
      } else if (s === 404) {
        setDeleteErr("E'lon topilmadi. Balki allaqachon o'chirilgan.");
      } else if (s === 401) {
        setDeleteErr("Sessiya muddati tugagan. Qaytadan tizimga kiring.");
      } else {
        setDeleteErr(e.response?.data?.error || e.response?.data?.detail || "E'lonni o'chirishda xatolik yuz berdi.");
      }
    } finally {
      setDeleting(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex flex-col gap-6 py-6">
      <div className="skeleton h-10 w-40 rounded-xl" />
      <div className="skeleton h-[420px] w-full rounded-2xl" />
      <div className="skeleton h-64 w-full rounded-2xl" />
    </div>
  );

  if (!property) return (
    <div className="text-center py-20 flex flex-col items-center gap-4 text-[var(--text-3)]">
      <Home size={40} className="opacity-30" />
      <p className="font-semibold text-[var(--text)]">Mulk topilmadi</p>
      <Link href="/properties" className="text-[var(--primary)] hover:underline">
        E&apos;lonlar ro&apos;yxatiga qaytish →
      </Link>
    </div>
  );

  const isOwner  = user?.id === property.owner.id;
  const canManage = !!user && (isOwner || user.is_admin || user.is_super_admin);
  const dispStars = hoveredStars ?? rateStars;
  const fallback  = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800';

  /* ── Google Maps src — e'lon koordinatasi yoki joylashuvi ── */
  const mapSrc = property.latitude && property.longitude
    ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&z=14&output=embed`;

  return (
    <div className="flex flex-col gap-8 py-6">

      {/* Back + Wishlist */}
      <div className="flex justify-between items-center">
        <Link href="/properties"
          className="flex items-center gap-1.5 text-[var(--text-3)] hover:text-[var(--primary)] font-semibold text-sm transition-colors">
          <ChevronLeft size={18} /> Orqaga
        </Link>
        <WishlistButton item={{
          id: property.id, type: 'property', title: property.title,
          price: property.price, image: activeImage, location: property.location,
          addedAt: new Date().toISOString(),
        }} />
      </div>

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left col ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Hero image */}
          <div className="relative h-[380px] md:h-[480px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage || fallback} alt={property.title}
              className="w-full h-full object-cover" />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* TOP badge */}
            {property.rating >= 4.0 && property.rating_count > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xl">
                <Star size={13} className="fill-white" /> TOP E&apos;LON
              </span>
            )}
            {/* Type badge */}
            <span className="absolute bottom-4 left-4 badge tag-blue text-xs">{property.type_display}</span>
            {/* Views */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-white/80 text-xs font-semibold">
              <Eye size={13} /> {property.views_count} ko&apos;rildi
            </div>
          </div>

          {/* Thumbnail strip */}
          {property.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
              {property.images.map(img => (
                <button key={img.id} type="button" onClick={() => setActiveImage(img.image)}
                  className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    activeImage === img.image ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Info card */}
          <div className="card rounded-2xl p-6 flex flex-col gap-5">
            {/* Title + rating */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text)]">{property.title}</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shrink-0">
                <RatingStars value={property.rating} count={property.rating_count} size={15} />
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-[var(--text-2)]">
              <MapPin size={16} className="text-blue-500 shrink-0" />
              <span className="text-sm">{property.location}</span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-5 py-4 border-y border-[var(--border)] text-sm text-[var(--text-2)]">
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-2">
                  <Bed size={18} className="text-blue-500" />
                  <span>{property.bedrooms} xona</span>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-2">
                  <Bath size={18} className="text-blue-500" />
                  <span>{property.bathrooms} hammom</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Expand size={18} className="text-blue-500" />
                <span>{property.area} m²</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-base font-bold text-[var(--text)] mb-2">Tavsif</h2>
              <p className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Features */}
            {property.features?.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-[var(--text)] mb-3">Qulayliklar</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map((f, i) => (
                    <span key={i} className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-200 dark:border-blue-500/20">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MAP — Google Maps iframe, e'lon belgilangan */}
            <div>
              <h2 className="text-base font-bold text-[var(--text)] mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-blue-500" /> Xaritada joylashuvi
              </h2>
              <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm">
                <iframe
                  src={mapSrc}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  title="E'lon joylashuvi"
                />
              </div>
              <p className="text-xs text-[var(--text-3)] mt-2 flex items-center gap-1">
                <MapPin size={11} /> {property.location}
              </p>
            </div>
          </div>

          {/* ═══ Reyting bo'limi ═══ */}
          {/* ═══ Reyting bo'limi — RatingSection komponenti ═══ */}
          <RatingSection
            endpoint={`/properties/${property.id}`}
            rating={property.rating}
            ratingCount={property.rating_count}
            ownerId={property.owner.id}
            color="amber"
            onUpdate={(r, c) => {
              setProperty(prev => prev ? { ...prev, rating: r, rating_count: c } : prev);
            }}
          />
        </div>

        {/* ── Right sidebar ── */}
        <div className="flex flex-col gap-5">
          <div className="card rounded-2xl p-6 flex flex-col gap-5 border border-[var(--border)]">

            {/* E'lon egasi uchun boshqaruv */}
            {canManage && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex flex-col gap-2">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  {isOwner ? "Bu sizning e'loningiz" : "Admin boshqaruvi"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/properties/${property.id}/edit`}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                    <Pencil size={13} /> Tahrirlash
                  </Link>
                  <button type="button"
                    onClick={() => { setDeleteErr(null); setDeleteOpen(true); }}
                    className="py-2.5 rounded-xl bg-white dark:bg-transparent border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
                    <Trash2 size={13} /> O&apos;chirish
                  </button>
                </div>
              </div>
            )}

            {/* Price */}
            <div>
              <p className="text-xs text-[var(--text-3)] font-semibold uppercase mb-1">Narx</p>
              <span className="text-3xl font-black text-emerald-600">
                {parseFloat(property.price).toLocaleString()} <span className="text-base font-semibold text-[var(--text-3)]">UZS</span>
              </span>
            </div>

            {/* Owner */}
            <div className="flex items-center gap-4 pt-4 border-t border-[var(--border)]">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--bg-2)] border-2 border-[var(--border)] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={property.owner.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                  alt={property.owner.username} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[var(--text)] truncate">
                  {property.owner.first_name} {property.owner.last_name}
                </h4>
                <p className="text-xs text-blue-600 font-semibold">{property.owner.profession_display}</p>
                <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                  <Star size={12} className="fill-amber-400" />
                  <span>{property.owner.rating.toFixed(1)} ({property.owner.rating_count})</span>
                </div>
              </div>
            </div>

            {/* Safety badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={16} className="shrink-0" />
              <span>Sotuvchi shaxsiyati tasdiqlangan</span>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-2)] flex items-center gap-2">
                <Eye size={13} className="text-[var(--text-3)]" />
                <span className="text-[var(--text-2)]">{property.views_count} ko&apos;rildi</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-2)] flex items-center gap-2">
                <Calendar size={13} className="text-[var(--text-3)]" />
                <span className="text-[var(--text-2)]">{property.type_display}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-1">
              <button type="button" onClick={handleChat}
                className="btn btn-primary w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                <MessageSquare size={16} /> Chat yozish
              </button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:${property.owner.phone}`}
                  className="py-3 rounded-xl border border-[var(--border)] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-[var(--text-2)] hover:text-blue-600 font-bold text-sm flex justify-center items-center gap-1.5 transition-all">
                  <PhoneCall size={14} /> Qo&apos;ng&apos;iroq
                </a>
                <Link href={`/chat?call=true&user=${property.owner.id}`}
                  className="py-3 rounded-xl border border-[var(--border)] hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-[var(--text-2)] hover:text-violet-600 font-bold text-sm flex justify-center items-center gap-1.5 transition-all">
                  <Video size={14} /> Video call
                </Link>
              </div>

              {/* Shikoyat tugmasi */}
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors mt-1"
              >
                <AlertTriangle size={13} /> Ushbu e&apos;longa shikoyat qilish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="property"
        targetId={property.id}
        targetTitle={property.title}
        accusedId={property.owner.id}
      />

      {/* Delete confirmation */}
      <ConfirmDeleteModal
        isOpen={deleteOpen}
        onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteErr(null); } }}
        onConfirm={handleDelete}
        title="E'lonni o'chirish"
        message={`"${property.title}" e'loni butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.`}
        confirmLabel="Ha, o'chirish"
        loading={deleting}
        error={deleteErr}
      />

      {/* Delete success overlay */}
      {deleted && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 size={34} />
            </div>
            <h3 className="text-lg font-extrabold text-[var(--text)]">E&apos;lon o&apos;chirildi</h3>
            <p className="text-sm text-[var(--text-3)]">E&apos;lonlar ro&apos;yxatiga yo&apos;naltirilmoqda...</p>
          </div>
        </div>
      )}
    </div>
  );
}
