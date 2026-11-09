'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import {
  Star, Sparkles, AlertCircle, CheckCircle2,
  Trash2, MessageSquare,
} from 'lucide-react';

interface RatingItem {
  id: number;
  stars: number;
  comment: string;
  created_at: string;
  user_detail?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
  };
}

interface UserRating {
  id: number;
  stars: number;
  comment: string;
}

interface Props {
  /** API endpoint prefiksi, masalan:
   *  - property:  '/properties/5'         → POST /properties/5/rate/
   *  - provider:  '/services/providers/3' → POST /services/providers/3/rate/
   */
  endpoint: string;
  /** Joriy o'rtacha reyting */
  rating: number;
  /** Baholar soni */
  ratingCount: number;
  /** Egasining user id — o'ziga baho bermasin */
  ownerId?: number;
  /** Ranglar sxemasi */
  color?: 'blue' | 'violet' | 'amber' | 'emerald';
  /** Yangilanish callbacki */
  onUpdate?: (rating: number, count: number) => void;
}

const LABELS = ['', 'Juda yomon', 'Qoniqarsiz', 'Yaxshi', 'Juda yaxshi', "A'lo!"];

const COLORS = {
  blue:    { badge: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',   btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' },
  violet:  { badge: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20', btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20' },
  amber:   { badge: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',  btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'  },
  emerald: { badge: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function RatingSection({
  endpoint, rating, ratingCount, ownerId, color = 'blue', onUpdate,
}: Props) {
  const router  = useRouter();
  const { isLoggedIn, user } = useStore();

  const [ratings,    setRatings]    = useState<RatingItem[]>([]);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [avgRating,  setAvgRating]  = useState(rating);
  const [totalCount, setTotalCount] = useState(ratingCount);
  const [loading,    setLoading]    = useState(true);

  const [stars,     setStars]     = useState(5);
  const [hovered,   setHovered]   = useState<number | null>(null);
  const [comment,   setComment]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');

  const c = COLORS[color];
  const dispStars = hovered ?? stars;

  const fetchRatings = useCallback(async () => {
    try {
      const res = await api.get(`${endpoint}/ratings/`);
      // endpoint /properties/5/ratings/ → array
      // endpoint /services/providers/3/ratings/ → {ratings, user_rating}
      if (Array.isArray(res.data)) {
        setRatings(res.data);
        // user_rating ni topamiz
        if (user) {
          const ur = res.data.find((r: RatingItem & { user?: number }) =>
            r.user_detail?.id === user.id
          );
          if (ur) { setUserRating({ id: ur.id, stars: ur.stars, comment: ur.comment }); setStars(ur.stars); setComment(ur.comment); }
        }
      } else {
        setRatings(res.data.ratings || []);
        if (res.data.user_rating) {
          const ur = res.data.user_rating;
          setUserRating(ur);
          setStars(ur.stars);
          setComment(ur.comment || '');
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [endpoint, user]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) { router.push('/login'); return; }
    if (user?.id === ownerId) { setError("O'zingizga baho bera olmaysiz."); return; }

    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await api.post(`${endpoint}/rate/`, { stars, comment });
      setSuccess("Reyting saqlandi! 🎉");
      const newRating = res.data.rating ?? avgRating;
      const newCount  = res.data.rating_count ?? totalCount;
      setAvgRating(newRating);
      setTotalCount(newCount);
      setUserRating({ id: res.data.user_rating?.id ?? 0, stars, comment });
      onUpdate?.(newRating, newCount);
      await fetchRatings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await api.delete(`${endpoint}/delete_rating/`);
      setUserRating(null);
      setStars(5); setComment('');
      const newRating = res.data.rating ?? 0;
      setAvgRating(newRating);
      setSuccess("Reyting o'chirildi");
      onUpdate?.(newRating, totalCount - 1);
      await fetchRatings();
      setTimeout(() => setSuccess(''), 2500);
    } catch { /* silent */ }
  };

  const isOwner = user?.id === ownerId;

  return (
    <div className="card rounded-2xl p-6 flex flex-col gap-6 border border-amber-200 dark:border-amber-500/20">

      {/* ── Sarlavha ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <p className="flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-wide mb-1">
            <Sparkles size={15} /> Reyting va Sharhlar
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[var(--text)]">
              {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
            </span>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={18}
                  className={s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-[var(--border-2)]'} />
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--text-3)] mt-1">{totalCount} ta foydalanuvchi baho bergan</p>
        </div>

        {userRating && (
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${c.badge}`}>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              Sizning bahoingiz: {userRating.stars} ⭐
            </span>
            <button type="button" onClick={handleDelete}
              className="p-1 text-[var(--text-3)] hover:text-rose-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Baho berish ─────────────────────────────────────── */}
      <div className="card rounded-xl p-5 flex flex-col gap-4">
        <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
          <MessageSquare size={16} className="text-amber-500" />
          {userRating ? 'Bahoyingizni yangilash' : 'Baho bering va izoh qoldiring'}
        </h3>

        {isOwner ? (
          <p className="text-sm text-amber-500 italic">O&apos;z profilingizga baho bera olmaysiz.</p>
        ) : !isLoggedIn ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-[var(--text-2)]">Baho berish uchun tizimga kiring</p>
            <button type="button" onClick={() => router.push('/login')}
              className={`btn px-4 py-2 rounded-xl text-sm text-white ${c.btn} shadow-lg`}>
              Kirish
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Yulduzlar */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-2)] font-semibold">Baho:</span>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setStars(s)}
                    className="p-1 hover:scale-125 transition-transform">
                    <Star size={28} className={dispStars >= s
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,.6)]'
                      : 'fill-transparent text-[var(--border-2)]'} />
                  </button>
                ))}
              </div>
              {dispStars > 0 && (
                <span className="text-sm font-bold text-amber-500">{LABELS[dispStars]}</span>
              )}
            </div>

            {/* Izoh */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-3)] mb-1.5 block">
                Izoh (ixtiyoriy)
              </label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                placeholder="Tajriba va sifat haqida fikringizni yozing..."
                className="glass-input px-4 py-2.5 resize-none w-full" />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 text-sm flex items-center gap-2">
                <CheckCircle2 size={14} /> {success}
              </div>
            )}

            <button type="submit" disabled={saving}
              className={`btn text-white self-end px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg disabled:opacity-60 ${c.btn}`}>
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saqlanmoqda...</>
                : <><Star size={14} className="fill-white" />{userRating ? 'Yangilash' : 'Baho yuborish'}</>
              }
            </button>
          </form>
        )}
      </div>

      {/* ── Sharhlar ro'yxati ────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h3 className="font-bold text-sm text-[var(--text)]">
          Barcha sharhlar ({loading ? '...' : ratings.length})
        </h3>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1,2].map(n => <div key={n} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : ratings.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-3)] bg-[var(--bg-2)] rounded-xl text-sm">
            Hali hech kim baho bermagan. Birinchi bo&apos;ling!
          </div>
        ) : (
          ratings.map(rev => (
            <div key={rev.id} className="p-4 rounded-xl bg-[var(--bg-2)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {rev.user_detail?.avatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={rev.user_detail.avatar} alt="" className="w-full h-full object-cover" />
                      : (rev.user_detail?.first_name?.[0] || '?')
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text)]">
                      {rev.user_detail?.first_name
                        ? `${rev.user_detail.first_name} ${rev.user_detail.last_name}`
                        : rev.user_detail?.username || 'Foydalanuvchi'}
                    </p>
                    <p className="text-[10px] text-[var(--text-3)]">{fmt(rev.created_at)}</p>
                  </div>
                </div>
                {/* Yulduzlar */}
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={13}
                      className={s <= rev.stars ? 'fill-amber-400 text-amber-400' : 'text-[var(--border-2)]'} />
                  ))}
                  <span className="text-xs font-bold text-amber-500 ml-1">{rev.stars}</span>
                </div>
              </div>
              {rev.comment && (
                <p className="text-sm text-[var(--text-2)] leading-relaxed pl-10">{rev.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
