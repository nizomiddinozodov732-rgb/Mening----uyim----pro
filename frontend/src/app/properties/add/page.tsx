'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import {
  ArrowLeft, CheckCircle2, Upload, X, ImagePlus,
  MapPin, Home, DollarSign, Ruler, Bed, Bath,
  FileText, Tag, Video, Layers, AlertCircle,
  Star, Navigation, Info,
} from 'lucide-react';
import Link from 'next/link';

/* ─── Qulayliklar ro'yxati ──────────────────────────────── */
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

/* Rasm validatsiyasi */
const MAX_FILES = 10;
const MAX_MB    = 5;

export default function AddProperty() {
  const router = useRouter();
  const { isLoggedIn, user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Form holati ──────────────────────────────────────── */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* Step 1 — asosiy */
  const [title,        setTitle]        = useState('');
  const [propertyType, setPropertyType] = useState('house');
  const [price,        setPrice]        = useState('');
  const [location,     setLocation]     = useState('');
  const [latitude,     setLatitude]     = useState('');
  const [longitude,    setLongitude]    = useState('');
  const [area,         setArea]         = useState('');
  const [bedrooms,     setBedrooms]     = useState('0');
  const [bathrooms,    setBathrooms]    = useState('0');
  const [floor,        setFloor]        = useState('');
  const [totalFloors,  setTotalFloors]  = useState('');

  /* Step 2 — qo'shimcha */
  const [description,  setDescription]  = useState('');
  const [features,     setFeatures]     = useState<string[]>([]);
  const [customFeature,setCustomFeature]= useState('');
  const [videoUrl,     setVideoUrl]     = useState('');
  const [status,       setStatus]       = useState('active');

  /* Step 3 — rasmlar */
  const [images,       setImages]       = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const [primaryIdx,   setPrimaryIdx]   = useState(0);

  /* Umumiy */
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  /* ── Rasm qo'shish ──────────────────────────────────── */
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    let err = '';

    Array.from(files).forEach(f => {
      if (images.length + newFiles.length >= MAX_FILES) {
        err = `Maksimal ${MAX_FILES} ta rasm yuklash mumkin.`; return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        err = `Rasm hajmi ${MAX_MB}MB dan oshmasligi kerak.`; return;
      }
      if (!f.type.startsWith('image/')) { err = 'Faqat rasm fayllari qabul qilinadi.'; return; }
      newFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    });

    if (err) setError(err);
    setImages(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [images]);

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
    if (primaryIdx >= i && primaryIdx > 0) setPrimaryIdx(p => p - 1);
  };

  const toggleFeature = (f: string) => {
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const addCustomFeature = () => {
    const f = customFeature.trim();
    if (f && !features.includes(f)) { setFeatures(prev => [...prev, f]); setCustomFeature(''); }
  };

  /* ── Geolocation ────────────────────────────────────── */
  const getMyLocation = () => {
    if (!navigator.geolocation) { setError("Geolokatsiya qo'llab-quvvatlanmaydi"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6)); },
      () => setError("Joylashuvni aniqlashda xatolik")
    );
  };

  /* ── Validatsiya ────────────────────────────────────── */
  const validateStep1 = () => {
    if (!title.trim())    { setError('Sarlavha kiriting');  return false; }
    if (!price)           { setError('Narxni kiriting');     return false; }
    if (!location.trim()) { setError('Manzilni kiriting');   return false; }
    if (!area)            { setError('Maydonni kiriting');   return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!description.trim()) { setError('Tavsif kiriting'); return false; }
    return true;
  };

  const validateStep3 = () => {
    const needsImages = ['house', 'apartment', 'rental'].includes(propertyType);
    if (needsImages && images.length === 0) {
      setError('Kamida 1 ta rasm yuklash shart'); return false;
    }
    return true;
  };

  /* ── Submit ─────────────────────────────────────────── */
  const handleSubmit = async () => {
    setError(''); setLoading(true);
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
      if (latitude)   fd.append('latitude',  latitude);
      if (longitude)  fd.append('longitude', longitude);
      if (floor)      fd.append('floor',       floor);
      if (totalFloors)fd.append('total_floors',totalFloors);
      if (videoUrl)   fd.append('video_url',   videoUrl);
      if (features.length) fd.append('features', JSON.stringify(features));

      // Rasmlarni alohida FormData bilan yuborish
      const propRes = await api.post('/properties/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Rasmlarni yuklash
      if (images.length > 0) {
        const imgFd = new FormData();
        images.forEach((img, i) => imgFd.append('images', img));
        await api.post(`/properties/${propRes.data.id}/upload_images/`, imgFd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccess(true);
      setTimeout(() => router.push(`/properties/${propRes.data.id}`), 1800);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const d = e.response?.data;
      const msg = d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v[0]:v}`).join('; ') : "Xatolik yuz berdi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Auth check ─────────────────────────────────────── */
  if (!isLoggedIn) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <h2 className="text-xl font-bold text-[var(--text)]">E&apos;lon berish uchun tizimga kiring</h2>
      <Link href="/login" className="btn btn-primary px-6 py-3 rounded-xl text-sm">Tizimga kirish</Link>
    </div>
  );

  if (user?.profession === 'customer') return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <Info size={40} className="text-amber-500" />
      <h2 className="text-xl font-bold text-[var(--text)]">Faqat sotuvchilar e&apos;lon qo&apos;sha oladi</h2>
      <p className="text-[var(--text-3)] text-sm max-w-sm">Profil sozlamalarida kasbingizni o&apos;zgartiring yoki obunaga yozing.</p>
      <Link href="/subscription" className="btn btn-primary px-6 py-3 rounded-xl text-sm">Obuna bo&apos;lish</Link>
    </div>
  );

  /* ── Success ────────────────────────────────────────── */
  if (success) return (
    <div className="py-20 text-center flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-extrabold text-[var(--text)]">E&apos;lon muvaffaqiyatli qo&apos;shildi!</h2>
      <p className="text-[var(--text-3)]">E&apos;lon sahifasiga yo&apos;naltirilmoqda...</p>
    </div>
  );

  /* ── Steps indicator ────────────────────────────────── */
  const STEPS = [
    { n: 1, label: 'Asosiy', icon: Home },
    { n: 2, label: "Qo'shimcha", icon: FileText },
    { n: 3, label: 'Rasmlar',   icon: ImagePlus },
  ];

  const isLand = propertyType === 'land';

  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/properties" className="p-2 rounded-xl bg-[var(--bg-2)] hover:bg-[var(--border)] text-[var(--text-2)] transition-all border border-[var(--border)]">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Yangi E&apos;lon Qo&apos;shish</h1>
          <p className="text-sm text-[var(--text-3)]">Mulk ma&apos;lumotlarini to&apos;liq va aniq kiriting</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map(({ n, label, icon: Icon }, i) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              step === n ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' :
              step > n  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' :
              'bg-[var(--bg-2)] text-[var(--text-3)]'
            }`}>
              {step > n ? <CheckCircle2 size={15} /> : <Icon size={15} />}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{n}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-emerald-400' : 'bg-[var(--border)]'}`} />}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* ════ STEP 1 — Asosiy ma'lumotlar ════ */}
      {step === 1 && (
        <div className="card rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Home size={20} className="text-blue-500" /> Asosiy ma&apos;lumotlar
          </h2>

          {/* Sarlavha */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)]">Sarlavha *</label>
            <input type="text" required placeholder="Masalan: Yunusobodda 3 xonali kvartira, 75m²"
              value={title} onChange={e => { setTitle(e.target.value); setError(''); }}
              className="glass-input px-4 py-3" />
          </div>

          {/* Mulk turi */}
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

          {/* Narx + Manzil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
                <DollarSign size={14} /> Narx (UZS) *
              </label>
              <input type="number" required min="0" placeholder="150 000 000"
                value={price} onChange={e => { setPrice(e.target.value); setError(''); }}
                className="glass-input px-4 py-3" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
                <Ruler size={14} /> Maydon (m²) *
              </label>
              <input type="number" required min="1" placeholder="75"
                value={area} onChange={e => { setArea(e.target.value); setError(''); }}
                className="glass-input px-4 py-3" />
            </div>
          </div>

          {/* Manzil */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <MapPin size={14} /> Manzil *
            </label>
            <input type="text" required placeholder="Toshkent, Yunusobod tumani, Amir Temur ko'chasi"
              value={location} onChange={e => { setLocation(e.target.value); setError(''); }}
              className="glass-input px-4 py-3" />
          </div>

          {/* Koordinatalar */}
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
              <input type="number" step="any" placeholder="Kenglik: 41.2995"
                value={latitude} onChange={e => setLatitude(e.target.value)}
                className="glass-input px-4 py-3 text-sm" />
              <input type="number" step="any" placeholder="Uzunlik: 69.2401"
                value={longitude} onChange={e => setLongitude(e.target.value)}
                className="glass-input px-4 py-3 text-sm" />
            </div>
            <p className="text-xs text-[var(--text-3)]">Koordinata kiritsangiz xaritada aniq belgi ko&apos;rinadi</p>
          </div>

          {/* Xonalar (faqat uy/kvartira/ijara uchun) */}
          {!isLand && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
                  <Bed size={14} /> Xonalar
                </label>
                <select value={bedrooms} onChange={e => setBedrooms(e.target.value)}
                  className="glass-input px-4 py-3">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n === 0 ? '—' : n}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
                  <Bath size={14} /> Hammom
                </label>
                <select value={bathrooms} onChange={e => setBathrooms(e.target.value)}
                  className="glass-input px-4 py-3">
                  {[0,1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n === 0 ? '—' : n}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--text-2)]">Qavat</label>
                <input type="number" min="1" placeholder="3"
                  value={floor} onChange={e => setFloor(e.target.value)}
                  className="glass-input px-4 py-3" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--text-2)]">Jami qavatlar</label>
                <input type="number" min="1" placeholder="9"
                  value={totalFloors} onChange={e => setTotalFloors(e.target.value)}
                  className="glass-input px-4 py-3" />
              </div>
            </div>
          )}

          <button type="button" onClick={() => { setError(''); if (validateStep1()) setStep(2); }}
            className="btn btn-primary w-full py-3.5 rounded-2xl text-sm mt-2">
            Keyingi qadam →
          </button>
        </div>
      )}

      {/* ════ STEP 2 — Qo'shimcha ma'lumotlar ════ */}
      {step === 2 && (
        <div className="card rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <FileText size={20} className="text-blue-500" /> Qo&apos;shimcha ma&apos;lumotlar
          </h2>

          {/* Tavsif */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)]">Batafsil tavsif *</label>
            <textarea required rows={6}
              placeholder={isLand
                ? "Yer haqida: joylashuv, atrofdagi infratuzilma, o'lchami, maqsad, qaysi yo'nalishda, kommunikatsiyalar (gaz, suv, elektr) bor yoki yo'qligi..."
                : "Uy/kvartira haqida: qavati, ta'mir holati, qurilish yili, kommunikatsiyalar, atrofdagi infratuzilma, qo'shnilar, xavfsizlik..."}
              value={description} onChange={e => { setDescription(e.target.value); setError(''); }}
              className="glass-input px-4 py-3 resize-none" />
            <p className="text-xs text-[var(--text-3)]">Qanchalik batafsil yozsangiz, shunchalik ko&apos;p e&apos;tibor olasiz</p>
          </div>

          {/* Holat */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <Star size={14} /> E&apos;lon holati
            </label>
            <div className="flex gap-3">
              {[
                { v: 'active',  l: 'Faol — ko\'rinadi',       c: 'emerald' },
                { v: 'pending', l: 'Kutilmoqda',               c: 'amber' },
                { v: 'inactive',l: "Ko'rinmasin (yashirin)", c: 'slate' },
              ].map(({ v, l, c }) => (
                <button key={v} type="button" onClick={() => setStatus(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    status === v
                      ? `border-${c}-500 bg-${c}-50 dark:bg-${c}-500/10 text-${c}-600`
                      : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--border-2)]'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Qulayliklar (yer uchun ko'rsatmaslik) */}
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
                <input type="text" placeholder="Qo'shimcha qulaylik qo'shish..."
                  value={customFeature} onChange={e => setCustomFeature(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomFeature(); } }}
                  className="glass-input flex-1 px-4 py-2.5 text-sm" />
                <button type="button" onClick={addCustomFeature}
                  className="btn btn-outline px-4 py-2.5 rounded-xl text-sm">
                  Qo&apos;shish
                </button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.map(f => (
                    <span key={f} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                      {f}
                      <button type="button" onClick={() => toggleFeature(f)}
                        className="hover:text-blue-200 ml-0.5">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video (ixtiyoriy) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--text-2)] flex items-center gap-1">
              <Video size={14} /> Video havolasi (ixtiyoriy)
            </label>
            <input type="url" placeholder="https://youtube.com/watch?v=..."
              value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              className="glass-input px-4 py-3" />
            <p className="text-xs text-[var(--text-3)]">YouTube, Vimeo yoki boshqa video platformalar</p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { setError(''); setStep(1); }}
              className="btn btn-outline flex-1 py-3.5 rounded-2xl text-sm">
              ← Orqaga
            </button>
            <button type="button" onClick={() => { setError(''); if (validateStep2()) setStep(3); }}
              className="btn btn-primary flex-1 py-3.5 rounded-2xl text-sm">
              Keyingi qadam →
            </button>
          </div>
        </div>
      )}

      {/* ════ STEP 3 — Rasmlar ════ */}
      {step === 3 && (
        <div className="card rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <ImagePlus size={20} className="text-blue-500" /> Rasmlar yuklash
            {!isLand && <span className="text-rose-500 text-sm font-normal ml-1">*</span>}
          </h2>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              {isLand
                ? 'Yer uchun rasm ixtiyoriy, lekin qo\'shsangiz e\'lon ko\'proq e\'tibor oladi.'
                : 'Kamida 1 ta rasm shart. Birinchi rasm asosiy (cover) sifatida ko\'rsatiladi. Maksimal 10 ta, har biri 5MB gacha.'
              }
            </div>
          </div>

          {/* Upload zona */}
          <div
            className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
            <Upload size={36} className="text-[var(--text-3)] mx-auto mb-3" />
            <p className="font-semibold text-[var(--text-2)]">Rasmlarni bu yerga tashlang yoki bosing</p>
            <p className="text-xs text-[var(--text-3)] mt-1">JPG, PNG, WebP • Maksimal 5MB • {MAX_FILES} tagacha</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handleFiles(e.target.files)} />
          </div>

          {/* Preview grid */}
          {previews.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-[var(--text-2)]">
                {previews.length} ta rasm yuklandi. Asosiy rasmni tanlang:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all"
                    style={{ borderColor: i === primaryIdx ? '#2563eb' : 'var(--border)' }}
                    onClick={() => setPrimaryIdx(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {/* Primary badge */}
                    {i === primaryIdx && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold">
                        ASOSIY
                      </div>
                    )}
                    {/* Remove */}
                    <button type="button" onClick={e => { e.stopPropagation(); removeImage(i); }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-all">
                      <X size={12} />
                    </button>
                    {/* Hover select */}
                    <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                      <span className="text-white text-[10px] font-bold">Asosiy qilish</span>
                    </div>
                  </div>
                ))}

                {/* Add more */}
                {previews.length < MAX_FILES && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 flex flex-col items-center justify-center gap-1 text-[var(--text-3)] transition-all">
                    <ImagePlus size={22} />
                    <span className="text-[10px] font-semibold">Qo&apos;shish</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* E'lon xulosasi */}
          <div className="p-4 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] flex flex-col gap-2">
            <p className="text-sm font-bold text-[var(--text)]">E&apos;lon xulosasi</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--text-2)]">
              <span className="text-[var(--text-3)]">Sarlavha:</span> <span className="font-semibold">{title}</span>
              <span className="text-[var(--text-3)]">Tur:</span> <span className="font-semibold">{PROPERTY_TYPES.find(t => t.value === propertyType)?.label}</span>
              <span className="text-[var(--text-3)]">Narx:</span> <span className="font-semibold">{parseFloat(price||'0').toLocaleString()} UZS</span>
              <span className="text-[var(--text-3)]">Maydon:</span> <span className="font-semibold">{area} m²</span>
              <span className="text-[var(--text-3)]">Manzil:</span> <span className="font-semibold line-clamp-1">{location}</span>
              <span className="text-[var(--text-3)]">Rasmlar:</span> <span className="font-semibold">{images.length} ta</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { setError(''); setStep(2); }}
              className="btn btn-outline flex-1 py-3.5 rounded-2xl text-sm">
              ← Orqaga
            </button>
            <button type="button" onClick={() => { setError(''); if (validateStep3()) handleSubmit(); }}
              disabled={loading}
              className="btn btn-primary flex-1 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuklanmoqda...</>
                : <><CheckCircle2 size={17} /> E&apos;lonni e&apos;lon qilish</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
