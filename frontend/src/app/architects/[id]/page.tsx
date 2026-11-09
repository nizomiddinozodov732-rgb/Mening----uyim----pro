'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import {
  Star, ShieldCheck, Clock, Phone, MessageSquare, Compass,
  ChevronLeft, CheckCircle2, Award, Briefcase,
  Calendar, TrendingUp, Eye, Zap, PenTool, Layers,
  Building2, Ruler, Lightbulb,
} from 'lucide-react';
import RatingSection from '@/components/RatingSection';

interface Provider {
  id: number;
  specialization: string;
  experience_years: number;
  bio: string;
  hourly_rate: string;
  completed_projects: number;
  is_available: boolean;
  portfolio_images: string[];
  skills: string[];
  created_at: string;
  user: {
    id: number; username: string; first_name: string; last_name: string;
    phone: string; avatar: string | null; rating: number; rating_count: number;
    profession: string; profession_display: string;
    is_verified: boolean; is_online: boolean; bio: string;
  };
}

export default function ArchitectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoggedIn } = useStore();
  const [provider, setProvider]   = useState<Provider | null>(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');

  useEffect(() => {
    api.get(`/services/providers/${id}/`)
      .then(r => setProvider(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleChat = () => {
    if (!isLoggedIn) { router.push('/login'); return; }
    router.push(`/chat?recipient_id=${provider?.user.id}`);
  };

  if (loading) return (
    <div className="flex flex-col gap-6 py-6">
      <div className="skeleton h-48 rounded-3xl" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (!provider) return (
    <div className="text-center py-20 text-[var(--text-3)] flex flex-col items-center gap-4">
      <PenTool size={40} className="opacity-30" />
      <p className="font-semibold">Arxitektor topilmadi</p>
      <Link href="/architects" className="text-violet-600 hover:underline">Ro&apos;yxatga qaytish →</Link>
    </div>
  );

  const u = provider.user;
  const fullName = `${u.first_name} ${u.last_name}`;
  const avatar = u.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300';

  const stats = [
    { icon: Clock,      label: 'Tajriba',   value: `${provider.experience_years} yil`, color: 'tag-violet' },
    { icon: Layers,     label: 'Loyihalar', value: `${provider.completed_projects} ta`, color: 'tag-blue' },
    { icon: Star,       label: 'Reyting',    value: u.rating.toFixed(1),                color: 'tag-amber' },
    { icon: TrendingUp, label: 'Baholar',    value: `${u.rating_count} ta`,              color: 'tag-emerald' },
  ];

  const specialties = [
    { icon: Building2, label: 'Bino loyihalashi',  desc: "Ko'p qavatli va yakka tartibdagi binolar" },
    { icon: Ruler,     label: 'Interyer dizayn',   desc: 'Zamonaviy va klassik interyer yechimlari' },
    { icon: Lightbulb, label: 'Eksteryer dizayn',  desc: 'Fasad va landshaft dizayn' },
    { icon: Layers,    label: '3D vizualizatsiya', desc: 'Realistik 3D renderlar va maketlar' },
  ];

  return (
    <div className="flex flex-col gap-6 py-6 max-w-4xl mx-auto w-full">

      <Link href="/architects" className="flex items-center gap-1.5 text-[var(--text-3)] hover:text-[var(--text)] text-sm font-medium">
        <ChevronLeft size={18} /> Arxitektorlar ro&apos;yxatiga qaytish
      </Link>

      {/* Hero Card */}
      <div className="card rounded-3xl">
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-t-3xl relative">
            <div className="absolute inset-0 rounded-t-3xl opacity-10"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0z' fill='none'/%3E%3Cpath d='M10 0v20M0 10h20' stroke='%23fff' stroke-width='.5'/%3E%3C/svg%3E\")" }} />
            {u.is_online && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Online
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-6 sm:left-8 translate-y-1/2">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-[var(--surface)] shadow-xl bg-[var(--bg-2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 pt-16 pb-4 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[var(--text)]">{fullName}</h1>
              {u.is_verified && <ShieldCheck size={20} className="text-emerald-500" />}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="badge tag-violet">{u.profession_display}</span>
              <span className="badge tag-blue">{provider.specialization}</span>
              {provider.is_available && <span className="badge tag-emerald flex items-center gap-1"><CheckCircle2 size={10} /> Mavjud</span>}
            </div>
          </div>
          <div className="shrink-0">
            <p className="text-[11px] text-[var(--text-3)] font-semibold uppercase">Boshlang&apos;ich narx</p>
            <p className="text-2xl font-black text-violet-600 mt-0.5">
              {parseFloat(provider.hourly_rate).toLocaleString()} <span className="text-sm font-semibold text-[var(--text-3)]">UZS</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 sm:px-8 pb-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">{label}</p>
                <p className="text-sm font-black text-[var(--text)] truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 sm:px-8 pb-6">
          <button type="button" onClick={handleChat}
            className="flex-1 py-3 rounded-2xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all">
            <MessageSquare size={16} /> Loyihani muhokama qilish
          </button>
          <a href={`tel:${u.phone}`}
            className="py-3 px-5 rounded-2xl text-sm font-bold border border-[var(--border)] text-[var(--text-2)] hover:border-violet-400 hover:text-violet-600 flex items-center justify-center gap-2 transition-all">
            <Phone size={16} /> Qo&apos;ng&apos;iroq
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-2)] p-1 rounded-xl border border-[var(--border)]">
        {([['about', "Ma'lumot"], ['portfolio', 'Portfolio'], ['reviews', 'Sharhlar']] as const).map(([tab, label]) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-[var(--surface)] text-violet-600 shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text)]'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="flex flex-col gap-5">
          <div className="card rounded-2xl p-6">
            <h2 className="font-bold text-[var(--text)] flex items-center gap-2 mb-3">
              <Compass size={18} className="text-violet-500" /> Arxitektor haqida
            </h2>
            <p className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
              {provider.bio || u.bio || "Interyer va eksteryer dizayn bo'yicha malakali mutaxassis."}
            </p>
          </div>

          {/* Specialties */}
          <div className="card rounded-2xl p-6">
            <h2 className="font-bold text-[var(--text)] flex items-center gap-2 mb-4">
              <PenTool size={18} className="text-violet-500" /> Xizmat yo&apos;nalishlari
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specialties.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">{label}</p>
                    <p className="text-[11px] text-[var(--text-3)] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {provider.skills.length > 0 && (
            <div className="card rounded-2xl p-6">
              <h2 className="font-bold text-[var(--text)] flex items-center gap-2 mb-4">
                <Layers size={18} className="text-blue-500" /> Ko&apos;nikmalar
              </h2>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map((s, i) => (
                  <span key={i} className="px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 text-xs font-bold border border-violet-200 dark:border-violet-500/20">{s}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Award,     color: 'text-violet-500', label: 'Ixtisoslik',           value: provider.specialization },
              { icon: Calendar,  color: 'text-emerald-500', label: "Ro'yxatdan o'tgan",   value: new Date(provider.created_at).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { icon: Briefcase, color: 'text-blue-500',   label: 'Bajarilgan loyihalar', value: `${provider.completed_projects} ta loyiha` },
              { icon: Zap,       color: 'text-amber-500',  label: 'Mavjudligi',            value: provider.is_available ? 'Yangi loyihalar qabul qiladi' : 'Hozir band' },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="card rounded-2xl p-5">
                <h3 className="font-bold text-[var(--text)] flex items-center gap-2 mb-2 text-sm">
                  <Icon size={16} className={color} /> {label}
                </h3>
                <p className="text-sm text-[var(--text-2)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="card rounded-2xl p-6">
          <h2 className="font-bold text-[var(--text)] flex items-center gap-2 mb-4">
            <Eye size={18} className="text-violet-500" /> Portfolio
          </h2>
          {provider.portfolio_images?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {provider.portfolio_images.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--text-3)] flex flex-col items-center gap-3">
              <Eye size={32} className="opacity-30" />
              <p className="text-sm font-semibold">Portfolio hozircha bo&apos;sh</p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab — RatingSection */}
      {activeTab === 'reviews' && (
        <RatingSection
          endpoint={`/services/providers/${provider.id}`}
          rating={u.rating}
          ratingCount={u.rating_count}
          ownerId={u.id}
          color="violet"
          onUpdate={(r, c) => {
            setProvider(prev => prev ? { ...prev, user: { ...prev.user, rating: r, rating_count: c } } : prev);
          }}
        />
      )}
    </div>
  );
}
