'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, useStore } from '@/store/useStore';
import {
  ArrowLeft, CheckCircle2, Upload, X, ImagePlus,
  MapPin, Home, DollarSign, Ruler, Bed, Bath,
  FileText, Video, Layers, AlertCircle,
  Star, Navigation, Info, Save, ShieldAlert, Loader2,
} from 'lucide-react';

/* ─── Konstantalar (add sahifasi bilan bir xil) ─────────── */
const FEATURES_LIST = [
  "Tabiiy gaz", "Markaziy isitish", "Konditsioner", "Lift",
  "Garaj", "Yer osti avtoturargoh", "Qo'riqchi", "Video kuzatuv",
  "Internet", "Kabel TV", "Mebel", "Texnika",
  "Balkon", "Supurish", "Hovuz", "Sport zal",
  "Bolalar maydoni", "Magazin yaqin", "Metro yaqin", "Park yaqin",
];

const PROPERTY_TYPES = [
  { value: 'house',     label: 'Hovli / Kottedj', icon: '🏡' },
  { value: 'apartment', label: 'Kvartira',         icon: '🏢' },
  { value: 'land',      label: 'Yer maydoni',      icon: '🌿' },
  { value: 'rental',    label: 'Ijara',             icon: '🔑' },
];

const STATUS_OPTIONS = [
  { v: 'active',   l: "Faol — ko'rinadi" },
  { v: 'pending',  l: 'Kutilmoqda' },
  { v: 'sold',     l: 'Sotilgan' },
  { v: 'inactive', l: "Yashirin (ko'rinmasin)" },
];

const MAX_FILES = 10;
const MAX_MB    = 5;

interface ExistingImage { id: number; image: string; is_primary: boolean; }

export default function EditProperty() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn, user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Yuklash holati ───────────────────────────────────── */
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState('');
  const [notFound, setNotFound] = useState(false);

  /* ── Forma maydonlari ─────────────────────────────────── */
  const [ownerId,      setOwnerId]      = useState<number | null>(null);
  const [title,        setTitle]        = useState('');
  const [propertyType, setPropertyType] = useState('house');
  const [price,        setPrice]        = useState('');
  const [location,     setLocation]     = useState('');
  const [latitude,     setLatitude]     = useState('');
  const [longitude,    setLongitude]    = useState('');
  const [area,         setArea]         = useState('');
  const [bedrooms,     setBedrooms]     = useState('0');
  const [bathrooms,    setBathrooms]    = useState('0');
  const [description,  setDescription]  = useState('');
  const [features,     setFeatures]     = useState<string[]>([]);
  const [customFeature,setCustomFeature]= useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [status,       setStatus]       = useState('active');

  /* ── Rasmlar ──────────────────────────────────────────── */
  const [existing,    setExisting]    = useState<ExistingImage[]>([]);
  const [newFiles,    setNewFiles]    = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  /* ── Saqlash ──────────────────────────────────────────── */
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  /* ── Mavjud ma'lumotlarni yuklash ─────────────────────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(`/properties/${id}/`);
        if (!alive) return;
        const p = res.data;
        setOwnerId(p.owner?.id ?? null);
        setTitle(p.title || '');
        setPropertyType(p.property_type || 'house');
        setPrice(p.price ? String(parseFloat(p.price)) : '');
        setLocation(p.location || '');
        setLatitude(p.latitude != null ? String(p.latitude) : '');
        setLongitude(p.longitude != null ? String(p.longitude) : '');
        setArea(p.area != null ? String(p.area) : '');
        setBedrooms(String(p.bedrooms ?? 0));
        setBathrooms(String(p.bathrooms ?? 0));
        setDescription(p.description || '');
        setFeatures(Array.isArray(p.features) ? p.features : []);
        setVideoUrl(p.video_url || '');
        setStatus(p.status || 'active');
        setExisting(p.images || []);
      } catch (err: unknown) {
        if (!alive) return;
        const e = err as { response?: { status?: number } };
        if (e.response?.status === 404) setNotFound(true);
        else setLoadErr("E'lon ma'lumotlarini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  /* ── Rasmlar bilan ishlash ────────────────────────────── */
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const picked: File[] = [];
    const prevs: string[] = [];
    let err = '';

    Array.from(files).forEach(f => {
      if (existing.length + newFiles.length + picked.length >= MAX_FILES) {
        err = `Maksimal ${MAX_FILES} ta rasm bo'lishi mumkin.`; return;
      }
      if (f.size > MAX_MB * 1024 * 1024) { err = `Rasm hajmi ${MAX_MB}MB dan oshmasligi kerak.`; return; }
      if (!f.type.startsWith('image/')) { err = 'Faqat rasm fayllari qabul qilinadi.'; return; }
      picked.push(f);
      prevs.push(URL.createObjectURL(f));
    });

    if (err) setError(err);
    setNewFiles(prev => [...prev, ...picked]);
    setNewPreviews(prev => [...prev, ...prevs]);
  }, [existing.length, newFiles.length]);

  const removeNewFile = (i: number) => {
    setNewFiles(prev => prev.filter((_, idx) => idx !== i));
    setNewPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const toggleFeature = (f: string) =>
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const addCustomFeature = () => {
    const f = customFeature.trim();
    if (f && !features.includes(f)) { setFeatures(prev => [...prev, f]); setCustomFeature(''); }
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) { setError("Geolokatsiya qo'llab-quvvatlanmaydi"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6)); },
      () => setError('Joylashuvni aniqlashda xatolik')
    );
  };

  /* ── Saqlash ──────────────────────────────────────────── */
  const handleSave = async () => {
    setError('');
    if (!title.trim())        { setError('Sarlavha kiriting'); return; }
    if (!price)               { setError('Narxni kiriting'); return; }
    if (!location.trim())     { setError('Manzilni kiriting'); return; }
    if (!area)                { setError('Maydonni kiriting'); return; }
    if (!description.trim())  { setError('Tavsif kiriting'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',         title);
      fd.append('property_type', propertyType);
      fd.append('price',         price);
      fd.append('location',      location);
      fd.append('area',          area);
      fd.append('bedrooms',      bedrooms);
      fd.append('bathrooms',     bathrooms);
      fd.append('description',   description);
      fd.append('status',        status);
      if (latitude)  fd.append('latitude',  latitude);
      if (longitude) fd.append('longitude', longitude);
      if (videoUrl)  fd.append('video_url', videoUrl);
      fd.append('features', JSON.stringify(features));
      // Saqlab qolinadigan mavjud rasmlar
      fd.append('keep_image_ids', JSON.stringify(existing.map(i => i.id)));
      // Yangi rasmlar
      newFiles.forEach(f => fd.append('images', f));

      await api.patch(`/properties/${id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => router.push(`/properties/${id}`), 1400);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: Record<string, unknown> } };
      const s = e.response?.status;
      const d = e.response?.data;
      if (s === 403) {
        setError("Bu e'lonni tahrirlash huquqingiz yo'q.");
      } else if (s === 404) {
        setError("E'lon topilmadi. Balki u allaqachon o'chirilgan.");
      } else if (s === 401) {
        setError('Sessiya muddati tugagan. Qaytadan tizimga kiring.');
      } else if (d && typeof d === 'object') {
        setError(Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('; '));
      } else {
        setError("Saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Holat ekranlari ──────────────────────────────────── */
  if (!isLoggedIn) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <ShieldAlert size={40} className="text-amber-500" />
      <h2 className="text-xl font-bold text-[var(--text)]">E&apos;lonni tahrirlash uchun tizimga kiring</h2>
      <Link href="/login" className="btn btn-primary px-6 py-3 rounded-xl text-sm">Tizimga kirish</Link>
    </div>
  );

  if (loading) return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">
      <div className="skeleton h-10 w-52 rounded-xl" />
      <div className="skeleton h-96 w-full rounded-3xl" />
    </div>
  );

  if (notFound) return (
    <div className="py-20 text-center flex flex-col items-center gap-4 text-[var(--text-3)]">
      <Home size={40} className="opacity-30" />
      <p className="font-semibold text-[var(--text)]">E&apos;lon topilmadi</p>
      <Link href="/properties" className="text-[var(--primary)] hover:underline">E&apos;lonlar ro&apos;yxatiga qaytish →</Link>
    </div>
  );

  const canEdit = !!user && ownerId !== null &&
    (user.id === ownerId || user.is_admin || user.is_super_admin);

  if (!canEdit) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <ShieldAlert size={40} className="text-rose-500" />
      <h2 className="text-xl font-bold text-[var(--text)]">Ruxsat yo&apos;q</h2>
      <p className="text-sm text-[var(--text-3)] max-w-sm">
        Bu e&apos;lonni faqat uning egasi (yoki administrator) tahrirlashi mumkin.
      </p>
      <Link href={`/properties/${id}`} className="btn btn-primary px-6 py-3 rounded-xl text-sm">
        E&apos;lon sahifasiga qaytish
      </Link>
    </div>
  );

  if (success) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-[var(--text)]">E&apos;lon muvaffaqiyatli yangilandi!</h2>
      <p className="text-[var(--text-3)]">Yangilangan ma&apos;lumotlar ko&apos;rsatilmoqda...</p>
    </div>
  );

  const isLand = propertyType === 'land';

  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/properties/${id}`}
          className="p-2 rounded-xl bg-[var(--bg-2)] hover:bg-[var(--border)] text-[var(--text-2)] transition-all border border-[var(--border)]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">E&apos;lonni tahrirlash</h1>
          <p className="text-sm text-[var(--text-3)]">Barcha maydonlarni o&apos;zgartirib, saqlashingiz mumkin</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {loadErr && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {loadErr}
        </div>
      )}

      {/* ════ Asosiy ma'lumotlar ════ */}
      <div className="card rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
          <Home size={20} className="text-blue-500" /> Asosiy ma&apos;lumotlar
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-2)]">Sarlavha *</label>
          <input type="text" value={title} onChange={e => { setTitle(e.target.value); setError(''); }}
            placeholder="Masalan: Yunusobodda 3 xonali kvartira, 75m²" className="glass-input px-4 py-3" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-2)]">Mulk turi *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROPERTY_TYPES.map(pt => (
              <button key={pt.value} type="button" onClick={() => setPropertyType(pt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  propertyType === pt.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                    : 'border-[var(--border)] hover:border-blue-300'
                }`}>
                <span className="text-2xl">{pt.icon}</span>
                <span className="text-xs font-bold text-[var(--text)]">{pt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <DollarSign size={14} /> Narx (UZS) *
            </label>
            <input type="number" min="0" value={price}
              onChange={e => { setPrice(e.target.value); setError(''); }}
              className="glass-input px-4 py-3" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <Ruler size={14} /> Maydon (m²) *
            </label>
            <input type="number" min="1" value={area}
              onChange={e => { setArea(e.target.value); setError(''); }}
              className="glass-input px-4 py-3" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
            <MapPin size={14} /> Manzil *
          </label>
          <input type="text" value={location}
            onChange={e => { setLocation(e.target.value); setError(''); }}
            className="glass-input px-4 py-3" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <Navigation size={14} /> GPS koordinatalar (ixtiyoriy)
            </label>
            <button type="button" onClick={getMyLocation}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              <Navigation size={12} /> Mening joylashuvim
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="any" placeholder="Kenglik" value={latitude}
              onChange={e => setLatitude(e.target.value)} className="glass-input px-4 py-3 text-sm" />
            <input type="number" step="any" placeholder="Uzunlik" value={longitude}
              onChange={e => setLongitude(e.target.value)} className="glass-input px-4 py-3 text-sm" />
          </div>
        </div>

        {!isLand && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
                <Bed size={14} /> Xonalar
              </label>
              <select value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="glass-input px-4 py-3">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n === 0 ? '—' : n}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
                <Bath size={14} /> Hammom
              </label>
              <select value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="glass-input px-4 py-3">
                {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n === 0 ? '—' : n}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ════ Qo'shimcha ma'lumotlar ════ */}
      <div className="card rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
          <FileText size={20} className="text-blue-500" /> Qo&apos;shimcha ma&apos;lumotlar
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-2)]">Batafsil tavsif *</label>
          <textarea rows={6} value={description}
            onChange={e => { setDescription(e.target.value); setError(''); }}
            className="glass-input px-4 py-3 resize-none" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
            <Star size={14} /> E&apos;lon holati
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATUS_OPTIONS.map(({ v, l }) => (
              <button key={v} type="button" onClick={() => setStatus(v)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                  status === v
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                    : 'border-[var(--border)] text-[var(--text-3)] hover:border-blue-300'
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {!isLand && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <Layers size={14} /> Qulayliklar
            </label>
            <div className="flex flex-wrap gap-2">
              {FEATURES_LIST.map(f => (
                <button key={f} type="button" onClick={() => toggleFeature(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    features.includes(f)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                      : 'border-[var(--border)] text-[var(--text-2)] hover:border-blue-300'
                  }`}>
                  {features.includes(f) ? '✓ ' : ''}{f}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Qo'shimcha qulaylik qo'shish..." value={customFeature}
                onChange={e => setCustomFeature(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomFeature(); } }}
                className="glass-input flex-1 px-4 py-2.5 text-sm" />
              <button type="button" onClick={addCustomFeature}
                className="btn btn-outline px-4 py-2.5 rounded-xl text-sm">Qo&apos;shish</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
            <Video size={14} /> Video havolasi (ixtiyoriy)
          </label>
          <input type="url" placeholder="https://youtube.com/watch?v=..." value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)} className="glass-input px-4 py-3" />
        </div>
      </div>

      {/* ════ Rasmlar ════ */}
      <div className="card rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
          <ImagePlus size={20} className="text-blue-500" /> Rasmlar
        </h2>

        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div>Rasmlarni olib tashlashingiz yoki yangi rasm qo&apos;shishingiz mumkin. Maksimal {MAX_FILES} ta, har biri {MAX_MB}MB gacha.</div>
        </div>

        {/* Mavjud rasmlar */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-[var(--text-2)]">Mavjud rasmlar ({existing.length})</p>
          {existing.length === 0 ? (
            <p className="text-xs text-[var(--text-3)]">Hozircha rasm yo&apos;q</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {existing.map(img => (
                <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                  {img.is_primary && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold">ASOSIY</div>
                  )}
                  <button type="button"
                    onClick={() => setExisting(prev => prev.filter(x => x.id !== img.id))}
                    title="Rasmni o'chirish"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yangi rasmlar */}
        <div className="flex flex-col gap-3">
          <div
            className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <Upload size={30} className="text-[var(--text-3)] mx-auto mb-2" />
            <p className="font-semibold text-[var(--text-2)] text-sm">Yangi rasmlarni qo&apos;shish uchun bosing</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
          </div>

          {newPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {newPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold">YANGI</div>
                  <button type="button" onClick={() => removeNewFile(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════ Amallar ════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/properties/${id}`}
          className="btn btn-outline flex-1 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2">
          <X size={16} /> Bekor qilish
        </Link>
        <button type="button" onClick={handleSave} disabled={saving}
          className="btn btn-primary flex-1 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving
            ? <><Loader2 size={17} className="animate-spin" /> Saqlanmoqda...</>
            : <><Save size={17} /> O&apos;zgarishlarni saqlash</>}
        </button>
      </div>
    </div>
  );
}
