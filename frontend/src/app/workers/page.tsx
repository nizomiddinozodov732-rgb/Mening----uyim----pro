'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/store/useStore';
import { Star, Hammer, ShieldCheck, Search, Clock, Wrench, MessageSquare } from 'lucide-react';

interface ServiceProvider {
  id: number;
  user: { id: number; username: string; first_name: string; last_name: string; phone: string; avatar: string | null; rating: number; rating_count: number; profession: string; profession_display: string; is_verified?: boolean; };
  specialization: string; experience_years: number; bio: string; hourly_rate: string; skills: string[];
}

const PROFS = [
  { value: '',          label: 'Barchasi' },
  { value: 'builder',   label: 'Quruvchilar' },
  { value: 'repairman', label: "Ta'mirlovchilar" },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= Math.round(n) ? 'fill-amber-400 text-amber-400' : 'text-[var(--border-2)]'} />
      ))}
    </div>
  );
}

export default function Workers() {
  const router = useRouter();
  const [workers, setWorkers] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [prof,    setProf]    = useState('');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/services/providers/', { params: { profession: prof || undefined } })
      .then(r => {
        const all = r.data.results || r.data || [];
        setWorkers(all.filter((w: ServiceProvider) => ['builder','repairman'].includes(w.user.profession)));
      })
      .catch(console.error).finally(() => setLoading(false));
  }, [prof]);

  const filtered = workers.filter(w =>
    `${w.user.first_name} ${w.user.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] flex items-center gap-2">
            <Hammer size={28} className="text-blue-600" /> Qurilish va Ta&apos;mirlash Ustalari
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Ishonchli quruvchilar, santexnik, elektrik va boshqa ustalar</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
            <input type="text" placeholder="Ism bo'yicha izlash..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="glass-input pl-9 pr-3 py-2.5" />
          </div>
          <div className="flex bg-[var(--bg-2)] p-1 rounded-xl border border-[var(--border)] gap-1">
            {PROFS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => setProf(value)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${prof === value ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(n => <div key={n} className="skeleton h-80 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card rounded-2xl p-14 text-center text-[var(--text-3)] flex flex-col items-center gap-3">
          <Wrench size={40} className="opacity-30" />
          <p className="font-semibold">Ustalar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((w) => (
            /* ── Karta: div + onClick — <a> ichida <a> muammosi yo'q ── */
            <div key={w.id}
              onClick={() => router.push(`/workers/${w.id}`)}
              className="card card-hover rounded-2xl flex flex-col group cursor-pointer">

              {/* Cover + Avatar */}
              <div className="relative">
                <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
                <div className="absolute bottom-0 left-6 translate-y-1/2">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-[var(--surface)] shadow-lg shrink-0 bg-[var(--bg-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                      alt={w.user.username} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 pt-12 flex flex-col gap-5">
                {/* Name */}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-base text-[var(--text)]">{w.user.first_name} {w.user.last_name}</h3>
                    {w.user.is_verified && <ShieldCheck size={16} className="text-emerald-500 shrink-0" />}
                  </div>
                  <span className="badge tag-blue text-[11px] mt-1">{w.user.profession_display}</span>
                </div>

                {/* Bio */}
                <p className="text-sm text-[var(--text-3)] leading-relaxed line-clamp-2">
                  {w.bio || "Mijozlarga sifatli qurilish va ta'mirlash xizmatlarini taqdim etaman."}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {w.skills.slice(0, 4).map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-200 dark:border-blue-500/20">{s}</span>
                  ))}
                  {w.skills.length > 4 && (
                    <span className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-semibold border border-blue-200 dark:border-blue-500/20">
                      +{w.skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg tag-amber flex items-center justify-center shrink-0">
                      <Clock size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">Tajriba</p>
                      <p className="text-sm font-bold text-[var(--text)]">{w.experience_years} yil</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase mb-1.5">Reyting</p>
                    <div className="flex items-center gap-2">
                      <Stars n={w.user.rating} />
                      <span className="text-xs font-bold text-[var(--text)]">{w.user.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">Soatlik narx</p>
                    <p className="text-lg font-black text-blue-600">
                      {parseFloat(w.hourly_rate).toLocaleString()}
                      <span className="text-xs font-semibold text-[var(--text-3)]"> UZS</span>
                    </p>
                  </div>
                  {/* button — <a> ichida <a> yo'q */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); router.push(`/chat?recipient_id=${w.user.id}`); }}
                    className="btn btn-primary px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5">
                    <MessageSquare size={14} /> Bog&apos;lanish
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
