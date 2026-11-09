'use client';

import { useState, useEffect, Suspense, lazy } from 'react';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import {
  Search, MapPin, Bed, Bath, Expand, ArrowRight, ArrowUpRight,
  Home, Store, Hammer, Compass, Calculator, TrendingUp,
  Star, Shield, Zap, Users, Building2, Newspaper,
  ChevronRight, Calendar, CheckCircle2, Edit3, X, Check
} from 'lucide-react';
import WishlistButton from '@/components/WishlistButton';
import RatingStars from '@/components/RatingStars';

const MapComponent = lazy(() => import('@/components/MapComponent'));

interface Property {
  id: number; title: string; price: string; location: string;
  property_type: string; type_display: string;
  bedrooms: number; bathrooms: number; area: number; primary_image: string | null;
  rating?: number; rating_count?: number;
}
interface NewsItem {
  id: number; title: string; content: string;
  image: string | null; created_at: string;
}

const STATS = [
  { icon: Building2, label: "Faol e'lonlar",    value: '12 000+', color: 'blue'   },
  { icon: Users,     label: 'Foydalanuvchilar', value: '8 500+',  color: 'violet' },
  { icon: Store,     label: "Do'konlar",         value: '340+',    color: 'cyan'   },
  { icon: Hammer,    label: 'Ustalar',            value: '1 200+',  color: 'amber'  },
];

const CATEGORIES = [
  { label: 'Uylar',          icon: Home,        href: '/properties?type=house',      tag: 'blue',    desc: 'Hovli, kottedj' },
  { label: 'Kvartiralar',    icon: Building2,   href: '/properties?type=apartment',  tag: 'violet',  desc: 'Yangi va ikkilamchi' },
  { label: 'Yer maydonlari', icon: MapPin,       href: '/properties?type=land',       tag: 'emerald', desc: 'Qurilish uchun' },
  { label: 'Ijara',          icon: TrendingUp,  href: '/properties?type=rental',     tag: 'amber',   desc: 'Oylik va kunlik' },
  { label: 'Materiallar',    icon: Store,        href: '/materials',                  tag: 'cyan',    desc: 'Qurilish do\'konlari' },
  { label: 'Ustalar',        icon: Hammer,       href: '/workers',                    tag: 'rose',    desc: 'Ta\'mirlash, qurilish' },
  { label: 'Arxitektorlar',  icon: Compass,      href: '/architects',                 tag: 'blue',    desc: 'Loyiha va dizayn' },
  { label: 'Kalkulyator',    icon: Calculator,   href: '/calculator',                 tag: 'violet',  desc: 'Xarajat hisoblash' },
];

const WHY = [
  { icon: Shield,     tag: 'blue',    title: "Tasdiqlangan e'lonlar",  desc: "Barcha e'lonlar moderatsiyadan o'tadi. Soxta e'lonlarga yo'l qo'yilmaydi." },
  { icon: Zap,        tag: 'amber',   title: 'Tezkor qidiruv',         desc: 'Ilg\'or filtrlar va interaktiv xarita orqali daqiqada toping.' },
  { icon: Star,       tag: 'violet',  title: 'Reyting tizimi',         desc: "Har bir sotuvchi, usta va arxitektor foydalanuvchilar tomonidan baholanadi." },
  { icon: MapPin,     tag: 'emerald', title: 'Xarita integratsiyasi',  desc: "Barcha e'lonlar O'zbekiston xaritasida ko'rsatiladi." },
  { icon: Calculator, tag: 'cyan',    title: 'Bepul kalkulyator',      desc: "Qurilish va ta'mirlash xarajatlarini aniq va tez hisoblang." },
  { icon: Users,      tag: 'rose',    title: 'Katta hamjamiyat',       desc: '8 500+ faol foydalanuvchi, 1 200+ usta va me\'mor bir platformada.' },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

const PLACEHOLDER_NEWS = [
  { id: 1, title: "2026-yilda ko'chmas mulk narxlari 15% oshdi", content: "Mutaxassislar ta'kidlashicha, Toshkent, Samarqand va Buxoro shaharlarida turar-joy narxlari barqaror o'sib bormoqda.", image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', created_at: '2026-10-20' },
  { id: 2, title: 'Ekologik uylar yangi trend sifatida ommaviylashmoqda', content: 'Energiya tejamkor va ekologik toza materiallardan qurilgan uylar O\'zbekiston bozorida ommabop bo\'lib bormoqda.', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', created_at: '2026-10-15' },
  { id: 3, title: "Ipoteka kreditlari bo'yicha yangi imkoniyatlar", content: "Davlat banklari yosh oilalar uchun imtiyozli ipoteka shartlarini yangilab, foiz stavkasini pasaytirishdi.", image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', created_at: '2026-10-10' },
];

export default function HomePage() {
  const { user } = useStore();
  const isAdmin = Boolean(user?.is_admin || user?.is_super_admin);

  const [properties,   setProperties]  = useState<Property[]>([]);
  const [news,         setNews]        = useState<NewsItem[]>([]);
  const [loadingProps, setLp]          = useState(true);
  const [loadingNews,  setLn]          = useState(true);
  const [search,       setSearch]      = useState('');
  const [activeMapId,  setActiveMapId] = useState<number | undefined>();

  // Real stats
  const [statsData, setStatsData] = useState({
    active_properties: 0,
    total_users: 0,
    total_stores: 0,
    total_workers: 0,
  });

  // Dynamic Site Settings from Admin
  const [siteSettings, setSiteSettings] = useState({
    hero_badge: "O'zbekistoning №1 ko'chmas mulk platformasi",
    hero_title: "Orzuingizdagi uyni\nbugun toping",
    hero_subtitle: "Ko'chmas mulk, qurilish materiallari, ustalar va arxitektorlar — hammasi bir joyda.",
    announcement_text: "",
    contact_email: "info@houseshop.uz",
    contact_phone: "+998 90 123 45 67",
    telegram_url: "https://t.me/houseshop_uz",
    instagram_url: "https://instagram.com/houseshop_uz",
  });

  // Admin edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ ...siteSettings });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    api.get('/properties/', { params: { page_size: 6 } })
      .then((r) => setProperties(r.data.results || r.data || []))
      .catch(console.error).finally(() => setLp(false));

    api.get('/dashboard/news/', { params: { page_size: 3 } })
      .then((r) => setNews(r.data.results || r.data || []))
      .catch(() => setNews([])).finally(() => setLn(false));

    // Real dynamic stats
    api.get('/dashboard/home-stats/')
      .then((r) => setStatsData(r.data))
      .catch((err) => console.error('Error fetching home stats:', err));

    // Dynamic site settings
    api.get('/dashboard/settings/')
      .then((r) => {
        if (r.data) {
          setSiteSettings(r.data);
          setEditForm(r.data);
        }
      })
      .catch((err) => console.error('Error fetching site settings:', err));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.put('/dashboard/settings/', editForm);
      if (res.data?.settings) {
        setSiteSettings(res.data.settings);
      } else {
        setSiteSettings(editForm);
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Sozlamalarni saqlashda xatolik yuz berdi");
    } finally {
      setSavingSettings(false);
    }
  };

  const goSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/properties?search=${encodeURIComponent(search)}`;
  };

  const displayNews = news.length > 0 ? news : PLACEHOLDER_NEWS;

  return (
    <div className="flex flex-col gap-20 pb-10">

      {/* ══════════════════ HERO ══════════════════════════════════════════ */}
      <section className="hero-bg rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 -mx-4 sm:-mx-6 lg:-mx-8 relative">
        {/* Admin Edit Shortcut Button */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                setEditForm({ ...siteSettings });
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold border border-white/30 transition-all shadow-lg"
              title="Admin bosh sahifa matnlarini tahrirlash"
            >
              <Edit3 size={13} /> Bosh sahifani tahrirlash (Admin)
            </button>
          </div>
        )}

        <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-16 md:py-20 lg:py-24">
          <div className="max-w-2xl flex flex-col gap-7">

            {/* Announcement Banner (if any) */}
            {siteSettings.announcement_text && (
              <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-300/40 text-yellow-200 text-xs font-bold backdrop-blur-md animate-pulse">
                📢 {siteSettings.announcement_text}
              </div>
            )}

            {/* Eyebrow */}
            <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              <Zap size={13} className="text-yellow-300" />
              {siteSettings.hero_badge || "O'zbekistoning №1 ko'chmas mulk platformasi"}
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight whitespace-pre-line">
              {siteSettings.hero_title || "Orzuingizdagi uyni bugun toping"}
            </h1>

            <p className="text-blue-100 text-base sm:text-lg leading-relaxed max-w-xl">
              {siteSettings.hero_subtitle || "Ko'chmas mulk, qurilish materiallari, ustalar va arxitektorlar — hammasi bir joyda."}
            </p>

            {/* Search form */}
            <form onSubmit={goSearch} className="flex gap-2 w-full max-w-xl">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Shahar, tuman, manzil..."
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white text-slate-800 placeholder-slate-400 text-sm font-medium shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60"
                />
              </div>
              <button type="submit"
                className="px-6 py-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold text-sm shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap">
                Qidirish
              </button>
            </form>

            {/* Quick city links */}
            <div className="flex flex-wrap gap-2">
              {['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Nukus'].map((c) => (
                <Link key={c} href={`/properties?search=${c}`}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all">
                  {c}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap gap-4">
            {[
              { icon: CheckCircle2, text: 'Bepul ro\'yxatdan o\'tish' },
              { icon: Shield,       text: "Tasdiqlangan e'lonlar"     },
              { icon: Star,         text: 'Ishonchli sotuvchilar'     },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/80 text-xs font-semibold">
                <Icon size={14} className="text-green-300" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative floating cards (purely visual) */}
        <div className="absolute top-8 right-8 hidden xl:block pointer-events-none select-none animate-float">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-52">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider mb-1">Bugun qo&apos;shildi</p>
            <p className="text-white font-bold text-sm">Toshkent, Yunusobod</p>
            <p className="text-yellow-300 font-black text-base mt-1">320 000 000 UZS</p>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS (Aniq real sonlar) ══════════════════════════════════════════ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: "Faol e'lonlar",    value: statsData.active_properties.toLocaleString(), color: 'blue'   },
          { icon: Users,     label: 'Foydalanuvchilar', value: statsData.total_users.toLocaleString(),       color: 'violet' },
          { icon: Store,     label: "Do'konlar",         value: statsData.total_stores.toLocaleString(),      color: 'cyan'   },
          { icon: Hammer,    label: 'Ustalar',            value: statsData.total_workers.toLocaleString(),     color: 'amber'  },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`card rounded-2xl p-6 flex flex-col items-center gap-3 text-center hover:shadow-lg transition-all`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center tag-${color}`}>
              <Icon size={22} />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--text)]">{value}</p>
            <p className="text-xs font-semibold text-[var(--text-3)]">{label}</p>
          </div>
        ))}
      </section>

      {/* ══════════════════ CATEGORIES ════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="section-title">Kategoriyalar</h2>
            <p className="section-sub">Kerakli bo&apos;limni tanlang</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map(({ label, icon: Icon, href, tag, desc }) => (
            <Link key={label} href={href}
              className="card card-hover rounded-2xl p-5 flex flex-col gap-3 group cursor-pointer">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center tag-${tag} transition-all group-hover:scale-110`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-[var(--text)]">{label}</p>
                <p className="text-[11px] text-[var(--text-3)] mt-0.5">{desc}</p>
              </div>
              <ArrowUpRight size={14} className="text-[var(--text-3)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════ SO'NGGI E'LONLAR ══════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="section-title">Top E&apos;lonlar</h2>
            <p className="section-sub">Eng yuqori reytingli ko&apos;chmas mulklar</p>
          </div>
          <Link href="/properties"
            className="flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline">
            Barchasi <ArrowRight size={15} />
          </Link>
        </div>

        {loadingProps ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(n => <div key={n} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="card rounded-2xl p-14 text-center text-[var(--text-3)] flex flex-col items-center gap-3">
            <Building2 size={40} className="opacity-30" />
            <p className="font-semibold">Backend ishga tushgandan keyin e&apos;lonlar ko&apos;rinadi</p>
            <Link href="/properties" className="text-sm font-bold text-[var(--primary)] hover:underline">
              Barcha e&apos;lonlar →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <article key={p.id}
                className="card card-hover rounded-2xl overflow-hidden flex flex-col group">
                {/* Image */}
                <div className="h-52 relative overflow-hidden bg-[var(--bg-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.primary_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'}
                    alt={p.title} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {/* gradient overlay */}
                  <div className="absolute inset-0 img-overlay" />
                  {/* Type badge */}
                  <span className="absolute top-3 left-3 badge tag-blue">{p.type_display}</span>
                  {(p.rating || 0) >= 4.0 && (p.rating_count || 0) > 0 && (
                    <span className="absolute top-3 right-12 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                      <Star size={10} className="fill-white" /> TOP
                    </span>
                  )}
                  {/* Price */}
                  <p className="absolute bottom-3 left-3 text-white font-black text-lg drop-shadow-lg">
                    {parseFloat(p.price).toLocaleString()} <span className="text-sm font-semibold opacity-80">UZS</span>
                  </p>
                  {/* Wishlist */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <WishlistButton item={{ id: p.id, type: 'property', title: p.title, price: p.price, image: p.primary_image, location: p.location, addedAt: new Date().toISOString() }} />
                  </div>
                </div>
                {/* Body */}
                <div className="p-5 flex flex-col gap-2.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-[var(--text)] line-clamp-1">{p.title}</h3>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <RatingStars value={p.rating || 0} count={p.rating_count || 0} size={12} />
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                    <MapPin size={12} className="text-blue-500 shrink-0" />
                    <span className="line-clamp-1">{p.location}</span>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-3)]">
                    {p.bedrooms  > 0 && <span className="flex items-center gap-1"><Bed  size={13} className="text-blue-400" />{p.bedrooms} xona</span>}
                    {p.bathrooms > 0 && <span className="flex items-center gap-1"><Bath size={13} className="text-blue-400" />{p.bathrooms}</span>}
                    <span className="flex items-center gap-1"><Expand size={13} className="text-blue-400" />{p.area} m²</span>
                  </div>
                  <div className="mt-auto pt-3 border-t border-[var(--border)]">
                    <Link href={`/properties/${p.id}`}
                      className="w-full btn btn-outline text-sm py-2 rounded-xl border-[var(--border)] hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1.5">
                      Batafsil <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════ XARITA ════════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="section-title">Xaritada qidiring</h2>
          <p className="section-sub">Shahar yoki tumanni kiriting va e&apos;lonlarni xaritadan toping</p>
        </div>
        <div className="h-[500px] relative rounded-3xl overflow-hidden shadow-xl border border-[var(--border)]">
          <Suspense fallback={<div className="skeleton absolute inset-0 rounded-3xl" />}>
            <MapComponent activeId={activeMapId} onSelect={setActiveMapId} className="absolute inset-0 rounded-none border-none" />
          </Suspense>
        </div>
      </section>

      {/* ══════════════════ YANGILIKLAR ════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Newspaper size={24} className="text-[var(--primary)]" />
              Yangiliklar
            </h2>
            <p className="section-sub">Ko&apos;chmas mulk bozaridagi so&apos;nggi voqealar</p>
          </div>
          <Link href="/news" className="flex items-center gap-1 text-sm font-bold text-[var(--primary)] hover:underline">
            Barchasini ko&apos;rish <ArrowRight size={15} />
          </Link>
        </div>

        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(n => <div key={n} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayNews.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <article className="card card-hover rounded-2xl overflow-hidden flex flex-col h-full group cursor-pointer">
                  <div className="h-44 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 img-overlay" />
                  </div>
                  <div className="p-5 flex flex-col gap-2.5 flex-1">
                    <div className="flex items-center gap-1.5 text-[var(--text-3)] text-xs">
                      <Calendar size={11} />
                      {typeof item.created_at === 'string' && item.created_at.includes('T')
                        ? fmt(item.created_at) : item.created_at}
                    </div>
                    <h3 className="font-bold text-sm text-[var(--text)] line-clamp-2 leading-snug flex-1">{item.title}</h3>
                    <p className="text-xs text-[var(--text-3)] line-clamp-2">{item.content}</p>
                    <span className="flex items-center gap-1 text-[var(--primary)] text-xs font-bold mt-1">
                      Batafsil <ArrowRight size={12} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════ NIMA UCHUN HOUSESHOP ══════════════════════════ */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="section-title">Nega Mening Uyim?</h2>
          <p className="section-sub mt-1">Minglab foydalanuvchilar bizga ishonishining sabablari</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY.map(({ icon: Icon, tag, title, desc }) => (
            <div key={title} className="card rounded-2xl p-6 flex gap-4 items-start hover:shadow-lg transition-all group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 tag-${tag} group-hover:scale-110 transition-transform`}>
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text)] mb-1">{title}</h3>
                <p className="text-xs text-[var(--text-3)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ CTA ════════════════════════════════════════════ */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 p-10 md:p-14 text-white text-center flex flex-col items-center gap-7 shadow-2xl shadow-blue-900/30">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative z-10 flex flex-col items-center gap-5 max-w-xl">
          <span className="badge bg-white/10 text-white border border-white/20 text-xs px-4 py-1.5">Bepul boshlang</span>
          <h2 className="text-3xl md:text-4xl font-black leading-tight">
            E&apos;lon joylashtiring,<br />mijoz toping!
          </h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Uyingizni, materiallaringizni yoki xizmatlaringizni 8 500+ potentsial
            mijozga ko&apos;rsating. Ro&apos;yxatdan o&apos;tish bepul!
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/register"
              className="px-8 py-3.5 rounded-2xl bg-white text-blue-700 font-extrabold text-sm hover:bg-yellow-300 hover:text-slate-900 transition-all shadow-xl active:scale-95">
              Ro&apos;yxatdan o&apos;tish
            </Link>
            <Link href="/properties"
              className="px-8 py-3.5 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all">
              E&apos;lonlarni ko&apos;rish <ArrowRight size={15} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ ADMIN EDIT MODAL ═════════════════════════════ */}
      {isAdmin && isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
          <div className="bg-white dark:bg-[#12122a] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit3 className="text-blue-600" size={20} /> Bosh sahifa ma&apos;lumotlarini tahrirlash (Admin)
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Yuqori nishon (Hero Badge)
                </label>
                <input
                  type="text"
                  value={editForm.hero_badge}
                  onChange={(e) => setEditForm({ ...editForm, hero_badge: e.target.value })}
                  placeholder="O'zbekistoning №1 ko'chmas mulk platformasi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Asosiy sarlavha (Hero Title) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editForm.hero_title}
                  onChange={(e) => setEditForm({ ...editForm, hero_title: e.target.value })}
                  placeholder="Orzuingizdagi uyni bugun toping"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Kichik sarlavha / Ta&apos;rif (Hero Subtitle) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={editForm.hero_subtitle}
                  onChange={(e) => setEditForm({ ...editForm, hero_subtitle: e.target.value })}
                  placeholder="Ko'chmas mulk, qurilish materiallari, ustalar va arxitektorlar..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  E&apos;lon / Aksiya matni (Announcement banner - ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={editForm.announcement_text}
                  onChange={(e) => setEditForm({ ...editForm, announcement_text: e.target.value })}
                  placeholder="Masalan: Bahorgi chegirmalar boshlandi!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Telegram havolasi</label>
                  <input
                    type="text"
                    value={editForm.telegram_url}
                    onChange={(e) => setEditForm({ ...editForm, telegram_url: e.target.value })}
                    placeholder="https://t.me/houseshop_uz"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Instagram havolasi</label>
                  <input
                    type="text"
                    value={editForm.instagram_url}
                    onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/houseshop_uz"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5 transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {savingSettings ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
