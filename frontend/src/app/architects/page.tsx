'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/store/useStore';
import { Star, Compass, ShieldCheck, Search, PenTool, Layers } from 'lucide-react';

interface ServiceProvider {
  id: number;
  user: { id: number; username: string; first_name: string; last_name: string; phone: string; avatar: string | null; rating: number; rating_count: number; profession: string; profession_display: string; is_verified?: boolean; };
  specialization: string; experience_years: number; bio: string; hourly_rate: string; skills: string[];
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} className={i <= Math.round(n) ? 'fill-amber-400 text-amber-400' : 'text-[var(--border-2)]'} />
      ))}
    </div>
  );
}

export default function Architects() {
  const router = useRouter();
  const [architects, setArchitects] = useState<ServiceProvider[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search,  setSearch]        = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/services/providers/', { params: { profession: 'architect' } })
      .then(r => {
        const all = r.data.results || r.data || [];
        setArchitects(all.filter((a: ServiceProvider) => a.user.profession === 'architect'));
      })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = architects.filter(a =>
    `${a.user.first_name} ${a.user.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] flex items-center gap-2">
            <Compass size={28} className="text-violet-600" /> Arxitektorlar
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Orzuingizdagi uyning mukammal loyihasini yaratuvchi professionallar</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
          <input type="text" placeholder="Ism bo'yicha izlash..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="glass-input pl-9 pr-3 py-2.5" />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(n => <div key={n} className="skeleton h-96 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card rounded-2xl p-14 text-center text-[var(--text-3)] flex flex-col items-center gap-3">
          <PenTool size={40} className="opacity-30" />
          <p className="font-semibold">Arxitektorlar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((a) => (
            /* ── Karta: div + onClick — <a> ichida <a> muammosi yo'q ── */
            <div key={a.id}
              onClick={() => router.push(`/architects/${a.id}`)}
              className="card card-hover rounded-2xl flex flex-col group cursor-pointer">

              {/* Cover + Avatar */}
              <div className="relative">
                <div className="h-28 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-t-2xl relative">
                  <div className="absolute inset-0 rounded-t-2xl opacity-20"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0z' fill='none'/%3E%3Cpath d='M10 0v20M0 10h20' stroke='%23fff' stroke-width='.5'/%3E%3C/svg%3E\")" }} />
                </div>
                {/* Avatar */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-[var(--surface)] shadow-xl bg-[var(--bg-2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.user.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'}
                      alt={a.user.username} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 pt-14 flex flex-col gap-4 items-center text-center">

                {/* Name */}
                <div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <h3 className="font-bold text-base text-[var(--text)]">{a.user.first_name} {a.user.last_name}</h3>
                    {a.user.is_verified && <ShieldCheck size={16} className="text-emerald-500" />}
                  </div>
                  <span className="badge tag-violet text-[11px] mt-1">{a.user.profession_display}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Stars n={a.user.rating} />
                  <span className="text-sm font-bold text-[var(--text)]">{a.user.rating.toFixed(1)}</span>
                  <span className="text-xs text-[var(--text-3)]">({a.user.rating_count})</span>
                </div>

                {/* Bio */}
                <p className="text-sm text-[var(--text-3)] leading-relaxed line-clamp-3">
                  {a.bio || "Interyer va eksteryer dizayn bo'yicha malakali mutaxassis. Zamonaviy uslublarda loyihalar yarataman."}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {a.skills.slice(0, 4).map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 text-xs font-semibold border border-violet-200 dark:border-violet-500/20">{s}</span>
                  ))}
                  {a.skills.length > 4 && (
                    <span className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 text-xs font-semibold border border-violet-200 dark:border-violet-500/20">
                      +{a.skills.length - 4}
                    </span>
                  )}
                </div>

                {/* Experience + price */}
                <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                  <div className="text-center">
                    <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">Tajriba</p>
                    <p className="text-base font-black text-[var(--text)] mt-1">{a.experience_years} yil</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[var(--text-3)] font-semibold uppercase">Boshlang&apos;ich narx</p>
                    <p className="text-base font-black text-violet-600 mt-1">{parseFloat(a.hourly_rate).toLocaleString()} UZS</p>
                  </div>
                </div>

                {/* CTA — button, NOT Link (karta div ichida) */}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); router.push(`/chat?recipient_id=${a.user.id}`); }}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2">
                  <Layers size={16} /> Loyihani muhokama qilish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
