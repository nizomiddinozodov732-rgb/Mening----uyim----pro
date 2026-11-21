'use client';

import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import {
  Search, MapPin, Bed, Bath, Expand, ArrowRight, ArrowUpRight,
  Home, Store, Hammer, Compass, Calculator, TrendingUp,
  Star, Zap, Users, Building2, Newspaper,
  Calendar, CheckCircle2, ShieldCheck, Sparkles, Edit3, X,
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

const CATEGORIES = [
  { label: 'Uylar',          icon: Home,        href: '/properties?type=house',     tag: 'blue',    desc: 'Hovli, kottedj' },
  { label: 'Kvartiralar',    icon: Building2,   href: '/properties?type=apartment', tag: 'violet',  desc: 'Yangi va ikkilamchi' },
  { label: 'Yer maydonlari', icon: MapPin,      href: '/properties?type=land',      tag: 'emerald', desc: 'Qurilish uchun' },
  { label: 'Ijara',          icon: TrendingUp,  href: '/properties?type=rental',    tag: 'amber',   desc: 'Oylik va kunlik' },
  { label: 'Materiallar',    icon: Store,       href: '/materials',                 tag: 'cyan',    desc: "Qurilish do'konlari" },
  { label: 'Ustalar',        icon: Hammer,      href: '/workers',                   tag: 'rose',    desc: "Ta'mirlash, qurilish" },
  { label: 'Arxitektorlar',  icon: Compass,     href: '/architects',                tag: 'blue',    desc: 'Loyiha va dizayn' },
  { label: 'Kalkulyator',    icon: Calculator,  href: '/calculator',                tag: 'violet',  desc: 'Xarajat hisoblash' },
];

const WHY = [
  { icon: ShieldCheck, tag: 'blue',    title: "Tasdiqlangan e'lonlar",  desc: "Barcha e'lonlar moderatsiyadan o'tadi. Soxta e'lonlarga yo'l qo'yilmaydi." },
  { icon: Zap,         tag: 'amber',   title: 'Tezkor qidiruv',         desc: "Ilg'or filtrlar va interaktiv xarita orqali daqiqada toping." },
  { icon: Star,        tag: 'violet',  title: 'Reyting tizimi',         desc: 'Har bir sotuvchi, usta va arxitektor foydalanuvchilar tomonidan baholanadi.' },
  { icon: MapPin,      tag: 'emerald', title: 'Xarita integratsiyasi',  desc: "Barcha e'lonlar O'zbekiston xaritasida ko'rsatiladi." },
  { icon: Calculator,  tag: 'cyan',    title: 'Bepul kalkulyator',      desc: "Qurilish va ta'mirlash xarajatlarini aniq va tez hisoblang." },
  { icon: Users,       tag: 'rose',    title: 'Katta hamjamiyat',       desc: "8 500+ faol foydalanuvchi, 1 200+ usta va me'mor bir platformada." },
];

const CITIES = ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Andijon', 'Nukus'];

const TRUST = [
  { icon: CheckCircle2, text: "Bepul ro'yxatdan o'tish" },
  { icon: ShieldCheck,  text: "Tasdiqlangan e'lonlar"   },
  { icon: Star,         text: 'Ishonchli sotuvchilar'   },
];

const PROPERTY_TYPES = [
  { value: '',          label: 'Barcha turlar' },
  { value: 'house',     label: 'Uylar'         },
  { value: 'apartment', label: 'Kvartiralar'   },
  { value: 'land',      label: 'Yer maydonlari'},
  { value: 'rental',    label: 'Ijara'         },
];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

const PLACEHOLDER_NEWS = [
  { id: 1, title: "2026-yilda ko'chmas mulk narxlari 15% oshdi", content: "Mutaxassislar ta'kidlashicha, Toshkent, Samarqand va Buxoro shaharlarida turar-joy narxlari barqaror o'sib bormoqda.", image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', created_at: '2026-10-20' },
  { id: 2, title: 'Ekologik uylar yangi trend sifatida ommaviylashmoqda', content: "Energiya tejamkor va ekologik toza materiallardan qurilgan uylar O'zbekiston bozorida ommabop bo'lib bormoqda.", image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', created_at: '2026-10-15' },
  { id: 3, title: "Ipoteka kreditlari bo'yicha yangi imkoniyatlar", content: "Davlat banklari yosh oilalar uchun imtiyozli ipoteka shartlarini yangilab, foiz stavkasini pasaytirishdi.", image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800', created_at: '2026-10-10' },
];

/* ── Scroll paytida yumshoq paydo bo'lish ─────────────────────────── */
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Raqamlarni sanash animatsiyasi ───────────────────────────────── */
function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return <span ref={ref}>{val.toLocaleString('ru-RU')}</span>;
}

export default function HomePage() {
  const { user } = useStore();
  const isAdmin = Boolean(user?.is_admin || user?.is_super_admin);

  const [properties,   setProperties]  = useState<Property[]>([]);
  const [news,         setNews]        = useState<NewsItem[]>([]);
  const [loadingProps, setLp]          = useState(true);
  const [loadingNews,  setLn]          = useState(true);
  const [search,       setSearch]      = useState('');
  const [searchType,   setSearchType]  = useState('');
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
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (searchType)    params.set('type', searchType);
    const qs = params.toString();
    window.location.href = `/properties${qs ? `?${qs}` : ''}`;
  };

  const displayNews = news.length > 0 ? news : PLACEHOLDER_NEWS;

  const statItems = [
    { icon: Building2, label: "Faol e'lonlar",     value: statsData.active_properties, color: 'blue'   },
    { icon: Users,     label: 'Foydalanuvchilar',  value: statsData.total_users,       color: 'violet' },
    { icon: Store,     label: "Do'konlar",          value: statsData.total_stores,      color: 'cyan'   },
    { icon: Hammer,    label: 'Ustalar',            value: statsData.total_workers,     color: 'amber'  },
  ];

  return (
    <div className="flex flex-col gap-20 sm:gap-24 pb-10">

      {/* ══════════════════ HERO ══════════════════════════════════════════ */}
      <section className="hero-bg hero-sheen rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/25 -mx-4 sm:-mx-6 lg:-mx-8 relative">

        {/* Dekorativ orblar */}
        <div aria-hidden className="hero-orb animate-orb w-72 h-72 bg-blue-400/40 -top-16 -left-10" />
        <div aria-hidden className="hero-orb animate-orb w-80 h-80 bg-indigo-500/40 top-24 -right-10" style={{ animationDelay: '-5s' }} />
        <div aria-hidden className="hero-orb animate-orb w-64 h-64 bg-cyan-400/25 -bottom-10 left-1/3" style={{ animationDelay: '-9s' }} />

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

        <div className="relative z-10 px-6 sm:px-10 lg:px-14 pt-12 pb-24 sm:pt-16 sm:pb-28">
          <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-12 items-center">

            {/* ── Chap: matn va qidiruv ── */}
            <div className="flex flex-col items-start gap-6">

              {/* Announcement Banner */}
              {siteSettings.announcement_text && (
                <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-300/40 text-yellow-100 text-xs font-bold backdrop-blur-md">
                  <Sparkles size={13} className="text-yellow-300" />
                  {siteSettings.announcement_text}
                </div>
              )}

              {/* Eyebrow */}
              <div className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                <Zap size={13} className="text-yellow-300" />
                {siteSettings.hero_badge || "O'zbekistoning №1 ko'chmas mulk platformasi"}
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight whitespace-pre-line bg-gradient-to-br from-white via-white to-blue-100 bg-clip-text text-transparent">
                {siteSettings.hero_title || 'Orzuingizdagi uyni bugun toping'}
              </h1>

              <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed max-w-xl">
                {siteSettings.hero_subtitle || "Ko'chmas mulk, qurilish materiallari, ustalar va arxitektorlar — hammasi bir joyda."}
              </p>

              {/* Search form */}
              <form onSubmit={goSearch} className="w-full max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl bg-white/95 backdrop-blur shadow-2xl shadow-blue-950/30">
                  <div className="relative flex-1">
                    <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Shahar, tuman, manzil..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 text-sm font-medium border border-transparent focus:bg-white focus:border-blue-400 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="relative sm:w-48">
                    <Home size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="w-full appearance-none pl-10 pr-9 py-3.5 rounded-xl bg-slate-50 text-slate-800 text-sm font-semibold border border-transparent focus:bg-white focus:border-blue-400 focus:outline-none transition-all cursor-pointer"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
                  >
                    <Search size={16} className="sm:hidden" />
                    Qidirish
                  </button>
                </div>
              </form>

              {/* Quick city links */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-white/60 text-xs font-semibold">Mashhur:</span>
                {CITIES.map((c) => (
                  <Link key={c} href={`/properties?search=${c}`}
                    className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all hover:-translate-y-0.5">
                    {c}
                  </Link>
                ))}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
                {TRUST.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-white/80 text-xs font-semibold">
                    <Icon size={14} className="text-green-300" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── O'ng: suzuvchi vizual kartochkalar (faqat lg+) ── */}
            <div className="hidden lg:block relative h-[420px]" aria-hidden>
              {/* Featured property card */}
              <div className="absolute top-2 right-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-blue-950/40 p-3 animate-float">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600" alt=""
                  className="w-full h-32 object-cover rounded-xl mb-3" />
                <div className="flex items-center justify-between gap-2">
                  <span className="badge tag-blue">Yangi</span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                    <Star size={11} className="fill-amber-500 text-amber-500" /> 4.9
                  </span>
                </div>
                <p className="text-slate-800 font-bold text-sm mt-2">Toshkent, Yunusobod</p>
                <p className="text-blue-600 font-black text-base mt-0.5">320 000 000 <span className="text-xs font-semibold">UZS</span></p>
              </div>

              {/* Verified badge card */}
              <div className="absolute bottom-10 left-0 w-52 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 animate-float" style={{ animationDelay: '-2s' }}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-green-300" />
                  <span className="text-white font-bold text-sm">Tasdiqlangan</span>
                </div>
                <p className="text-white/70 text-xs leading-relaxed">Har bir e&apos;lon moderatsiyadan o&apos;tadi</p>
              </div>

              {/* Small stat card */}
              <div className="absolute top-40 left-6 w-40 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-4 shadow-xl shadow-amber-500/30 animate-float" style={{ animationDelay: '-4s' }}>
                <Users size={18} className="text-slate-900/70" />
                <p className="text-slate-900 font-black text-2xl mt-1">8 500+</p>
                <p className="text-slate-900/70 text-[11px] font-bold">Faol foydalanuvchi</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════ STATS (hero ustidan chiqqan holda) ══════════════════════ */}
      <section className="relative z-20 -mt-16 px-2 sm:px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statItems.map(({ icon: Icon, label, value, color }, i) => (
            <Reveal key={label} delay={i * 90}>
              <div className="card card-lift rounded-2xl p-5 sm:p-6 flex items-center gap-4 h-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center tag-${color} shrink-0`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl sm:text-3xl font-black text-[var(--text)] leading-none">
                    <CountUp to={value} />
                  </p>
                  <p className="text-xs font-semibold text-[var(--text-3)] mt-1.5 truncate">{label}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════ CATEGORIES ════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <Reveal>
          <div className="flex flex-col gap-3">
            <span className="eyebrow w-fit"><Sparkles size={12} /> Bo&apos;limlar</span>
            <h2 className="section-title">Kategoriyalar</h2>
            <p className="section-sub">Kerakli bo&apos;limni tanlang va qidiruvni boshlang</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {CATEGORIES.map(({ label, icon: Icon, href, tag, desc }, i) => (
            <Reveal key={label} delay={(i % 4) * 70}>
              <Link href={href}
                className="card card-lift rounded-2xl p-5 flex flex-col gap-3 h-full group cursor-pointer relative overflow-hidden">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center tag-${tag} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-[var(--text)]">{label}</p>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5">{desc}</p>
                </div>
                <ArrowUpRight size={14} className="text-[var(--text-3)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════ TOP E'LONLAR ══════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <Reveal>
          <div className="flex justify-between items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-3">
              <span className="eyebrow w-fit"><TrendingUp size={12} /> Trend</span>
              <h2 className="section-title">Top E&apos;lonlar</h2>
              <p className="section-sub">Eng yuqori reytingli ko&apos;chmas mulklar</p>
            </div>
            <Link href="/properties"
              className="group flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:gap-2.5 transition-all">
              Barchasi <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </Reveal>

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
            {properties.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 80}>
                <article className="card card-lift rounded-2xl overflow-hidden flex flex-col group h-full">
                  {/* Image */}
                  <div className="h-52 relative overflow-hidden bg-[var(--bg-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.primary_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'}
                      alt={p.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 img-overlay" />
                    <span className="absolute top-3 left-3 badge tag-blue">{p.type_display}</span>
                    {(p.rating || 0) >= 4.0 && (p.rating_count || 0) > 0 && (
                      <span className="absolute top-3 right-12 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                        <Star size={10} className="fill-white" /> TOP
                      </span>
                    )}
                    <p className="absolute bottom-3 left-3 text-white font-black text-lg drop-shadow-lg">
                      {parseFloat(p.price).toLocaleString()} <span className="text-sm font-semibold opacity-80">UZS</span>
                    </p>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <WishlistButton item={{ id: p.id, type: 'property', title: p.title, price: p.price, image: p.primary_image, location: p.location, addedAt: new Date().toISOString() }} />
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-5 flex flex-col gap-2.5 flex-1">
                    <h3 className="font-bold text-base text-[var(--text)] line-clamp-1">{p.title}</h3>
                    <div className="pb-1">
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
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════ XARITA ════════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <Reveal>
          <div className="flex flex-col gap-3">
            <span className="eyebrow w-fit"><MapPin size={12} /> Geografiya</span>
            <h2 className="section-title">Xaritada qidiring</h2>
            <p className="section-sub">Shahar yoki tumanni kiriting va e&apos;lonlarni xaritadan toping</p>
          </div>
        </Reveal>
        <div className="h-[500px] relative rounded-3xl overflow-hidden shadow-xl border border-[var(--border)]">
          <Suspense fallback={<div className="skeleton absolute inset-0 rounded-3xl" />}>
            <MapComponent activeId={activeMapId} onSelect={setActiveMapId} className="absolute inset-0 rounded-none border-none" />
          </Suspense>
        </div>
      </section>

      {/* ══════════════════ YANGILIKLAR ════════════════════════════════════ */}
      <section className="flex flex-col gap-6">
        <Reveal>
          <div className="flex justify-between items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-3">
              <span className="eyebrow w-fit"><Newspaper size={12} /> Yangiliklar</span>
              <h2 className="section-title">So&apos;nggi yangiliklar</h2>
              <p className="section-sub">Ko&apos;chmas mulk bozoridagi so&apos;nggi voqealar</p>
            </div>
            <Link href="/news" className="group flex items-center gap-1 text-sm font-bold text-[var(--primary)] hover:gap-2 transition-all">
              Barchasini ko&apos;rish <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </Reveal>

        {loadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(n => <div key={n} className="skeleton h-64 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayNews.map((item, i) => (
              <Reveal key={item.id} delay={i * 90}>
                <Link href={`/news/${item.id}`}>
                  <article className="card card-lift rounded-2xl overflow-hidden flex flex-col h-full group cursor-pointer">
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
                      <span className="flex items-center gap-1 text-[var(--primary)] text-xs font-bold mt-1 group-hover:gap-2 transition-all">
                        Batafsil <ArrowRight size={12} />
                      </span>
                    </div>
                  </article>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════ NEGA MENING UYIM ══════════════════════════════ */}
      <section className="flex flex-col gap-8">
        <Reveal>
          <div className="text-center flex flex-col items-center gap-3">
            <span className="eyebrow"><ShieldCheck size={12} /> Ishonch</span>
            <h2 className="section-title">Nega Mening Uyim?</h2>
            <p className="section-sub max-w-xl">Minglab foydalanuvchilar bizga ishonishining sabablari</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY.map(({ icon: Icon, tag, title, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 80}>
              <div className="card card-lift rounded-2xl p-6 flex gap-4 items-start h-full group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 tag-${tag} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text)] mb-1">{title}</h3>
                  <p className="text-xs text-[var(--text-3)] leading-relaxed">{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════ CTA ════════════════════════════════════════════ */}
      <Reveal>
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 p-10 md:p-14 text-white text-center flex flex-col items-center gap-7 shadow-2xl shadow-blue-900/30">
          <div aria-hidden className="hero-orb animate-orb w-72 h-72 bg-cyan-400/30 -top-16 -left-10" />
          <div aria-hidden className="hero-orb animate-orb w-72 h-72 bg-indigo-400/30 -bottom-20 -right-10" style={{ animationDelay: '-6s' }} />
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")" }} />
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
                className="px-8 py-3.5 rounded-2xl bg-white text-blue-700 font-extrabold text-sm hover:bg-yellow-300 hover:text-slate-900 transition-all shadow-xl active:scale-95 hover:-translate-y-0.5">
                Ro&apos;yxatdan o&apos;tish
              </Link>
              <Link href="/properties"
                className="px-8 py-3.5 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-sm hover:bg-white/20 transition-all hover:-translate-y-0.5">
                E&apos;lonlarni ko&apos;rish <ArrowRight size={15} className="inline ml-1" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

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
                  {savingSettings ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
