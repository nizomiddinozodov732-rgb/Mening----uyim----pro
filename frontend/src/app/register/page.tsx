'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';
import {
  UserPlus, AlertCircle, ChevronRight, ChevronLeft,
  User, Store, Hammer, Wrench, Compass, CheckCircle2,
  Eye, EyeOff,
} from 'lucide-react';

/* ─── Rollar ──────────────────────────────────────────────────── */
const ROLES = [
  {
    value: 'customer',
    label: 'Oddiy Mijoz',
    sub: 'Uy izlayman yoki material xarid qilaman',
    icon: User,
    color: 'blue',
    free: true,
    perks: ["E'lonlarni ko'rish", 'Ustalar bilan bog\'lanish', 'Kalkulyatordan foydalanish'],
  },
  {
    value: 'seller',
    label: 'Sotuvchi / Rieltor',
    sub: "Ko'chmas mulk sotaman yoki ijaraga beraman",
    icon: Store,
    color: 'emerald',
    free: false,
    perks: ["Cheksiz e'lon joylash", 'Mijozlar bilan chat', 'Profil sahifasi'],
  },
  {
    value: 'builder',
    label: 'Quruvchi',
    sub: 'Qurilish ishlari va loyihalar boshqaraman',
    icon: Hammer,
    color: 'amber',
    free: false,
    perks: ['Ishlar portfelini ko\'rsatish', 'Mijozlar buyurtmasi', 'Reyting tizimi'],
  },
  {
    value: 'repairman',
    label: "Ta'mirlovchi Usta",
    sub: "Ta'mirlash va remont xizmatlarini taklif etaman",
    icon: Wrench,
    color: 'orange',
    free: false,
    perks: ['Ko\'nikmalar ro\'yxati', 'Soatlik tarif belgilash', 'Buyurtmalar'],
  },
  {
    value: 'architect',
    label: "Me'mor / Arxitektor",
    sub: 'Loyiha va dizayn xizmatlarini taqdim etaman',
    icon: Compass,
    color: 'violet',
    free: false,
    perks: ['Portfolio namunalari', 'Premium profil', 'Verified belgisi'],
  },
] as const;

type Profession = typeof ROLES[number]['value'];

const COLOR: Record<string, string> = {
  blue:    'border-blue-500 bg-blue-50 dark:bg-blue-500/10',
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  amber:   'border-amber-500 bg-amber-50 dark:bg-amber-500/10',
  orange:  'border-orange-500 bg-orange-50 dark:bg-orange-500/10',
  violet:  'border-violet-500 bg-violet-50 dark:bg-violet-500/10',
};
const ICON_COLOR: Record<string, string> = {
  blue: 'text-blue-600', emerald: 'text-emerald-600',
  amber: 'text-amber-600', orange: 'text-orange-600', violet: 'text-violet-600',
};

/* ─── Component ───────────────────────────────────────────────── */
export default function Register() {
  const router = useRouter();
  const { setToken, setUser } = useStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [profession, setProfession] = useState<Profession>('customer');
  const [showPass, setShowPass]   = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    phone: '', password: '', password2: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  /* Step 1 → Step 2 */
  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError('Parollar mos emas!');
      return;
    }
    if (form.password.length < 8) {
      setError("Parol kamida 8 ta belgidan iborat bo'lishi kerak!");
      return;
    }
    setStep(2);
  };

  /* Final submit */
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register/', { ...form, profession });
      const { user, tokens } = res.data;
      setToken(tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      setUser(user);

      if (profession === 'customer') {
        router.push('/');
      } else {
        router.push('/subscription');
      }
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: Record<string, unknown>; status?: number };
        message?: string;
      };
      console.error('Register error:', e.response?.data || e.message);

      if (!e.response) {
        setError("Server bilan bog'lanib bo'lmadi. Backend ishga tushganini tekshiring (localhost:8000).");
        return;
      }

      const d = e.response.data;
      if (d && typeof d === 'object') {
        const msgs = Object.entries(d)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join('; ');
        setError(msgs);
      } else {
        setError(`Xatolik (${e.response.status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const selected = ROLES.find(r => r.value === profession)!;

  /* ── STEP 1 ─────────────────────────────────────────────────── */
  if (step === 1) return (
    <div className="flex justify-center items-center py-10 min-h-[85vh]">
      <div className="card rounded-3xl p-8 w-full max-w-lg flex flex-col gap-6 shadow-xl">

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30">
            <UserPlus size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Ro&apos;yxatdan o&apos;tish</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Shaxsiy ma&apos;lumotlaringizni kiriting</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-blue-500" />
          <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]" />
          <span className="text-xs text-[var(--text-3)] font-semibold">1 / 2</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={goStep2} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-3)]">Ism *</label>
              <input type="text" required placeholder="Ismingiz"
                value={form.first_name} onChange={set('first_name')}
                className="glass-input px-3 py-2.5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-3)]">Familiya *</label>
              <input type="text" required placeholder="Familiyangiz"
                value={form.last_name} onChange={set('last_name')}
                className="glass-input px-3 py-2.5" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-3)]">Username *</label>
            <input type="text" required placeholder="noyob_username"
              value={form.username} onChange={set('username')}
              className="glass-input px-3 py-2.5" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-3)]">Email *</label>
            <input type="email" required placeholder="email@example.com"
              value={form.email} onChange={set('email')}
              className="glass-input px-3 py-2.5" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-3)]">Telefon *</label>
            <input type="tel" required placeholder="+998901234567"
              value={form.phone} onChange={set('phone')}
              className="glass-input px-3 py-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-3)]">Parol *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required placeholder="Kamida 8 ta belgi"
                  value={form.password} onChange={set('password')}
                  className="glass-input px-3 py-2.5 pr-10 w-full" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)]">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text-3)]">Tasdiqlash *</label>
              <div className="relative">
                <input type={showPass2 ? 'text' : 'password'} required placeholder="Qayta kiriting"
                  value={form.password2} onChange={set('password2')}
                  className="glass-input px-3 py-2.5 pr-10 w-full" />
                <button type="button" onClick={() => setShowPass2(!showPass2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)]">
                  {showPass2 ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit"
            className="btn btn-primary w-full py-3 rounded-xl text-sm mt-2 flex items-center justify-center gap-2">
            Keyingi qadam <ChevronRight size={17} />
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-3)]">
          Hisobingiz bormi?{' '}
          <Link href="/login" className="text-[var(--primary)] hover:underline font-semibold">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );

  /* ── STEP 2 — Rol tanlash ────────────────────────────────────── */
  return (
    <div className="flex justify-center items-center py-10 min-h-[85vh]">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Rolingizni tanlang</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">
            Bu sizning platformadagi imkoniyatlaringizni belgilaydi
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--primary)]" />
          <div className="flex-1 h-1.5 rounded-full bg-[var(--primary)]" />
          <span className="text-xs text-[var(--text-3)] font-semibold">2 / 2</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Rol kartochkalari */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.map(role => {
            const Icon = role.icon;
            const isSelected = profession === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setProfession(role.value)}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col gap-3 hover:-translate-y-0.5 ${
                  isSelected
                    ? COLOR[role.color]
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-2)]'
                }`}
              >
                {/* Tanlangan belgisi */}
                {isSelected && (
                  <CheckCircle2
                    size={18}
                    className={`absolute top-3 right-3 ${ICON_COLOR[role.color]}`}
                  />
                )}

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSelected ? `${ICON_COLOR[role.color]} bg-white dark:bg-white/10` : 'bg-[var(--bg-2)] text-[var(--text-3)]'
                }`}>
                  <Icon size={20} />
                </div>

                {/* Nom */}
                <div>
                  <p className={`font-bold text-sm ${isSelected ? ICON_COLOR[role.color] : 'text-[var(--text)]'}`}>
                    {role.label}
                  </p>
                  <p className="text-[11px] text-[var(--text-3)] mt-0.5 leading-relaxed">
                    {role.sub}
                  </p>
                </div>

                {/* Imtiyozlar */}
                <ul className="flex flex-col gap-1">
                  {role.perks.map(p => (
                    <li key={p} className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)]">
                      <CheckCircle2 size={10} className={isSelected ? ICON_COLOR[role.color] : 'text-[var(--text-3)]'} />
                      {p}
                    </li>
                  ))}
                </ul>

                {/* Bepul / Obuna badge */}
                <div className={`mt-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                  role.free
                    ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600'
                    : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600'
                }`}>
                  {role.free ? '✓ Bepul' : '⚡ Obuna kerak'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Tanlangan rol haqida xabar */}
        {profession !== 'customer' && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3">
            <span className="text-amber-500 text-xl mt-0.5">⚡</span>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {selected.label} uchun obuna talab qilinadi
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                Ro&apos;yxatdan o&apos;tgandan keyin obuna sahifasiga yo&apos;naltirilasiz.
                Oylik 50 000 UZS yoki yillik 500 000 UZS.
              </p>
            </div>
          </div>
        )}

        {profession === 'customer' && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Mijoz sifatida bepul foydalanasiz
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                Obuna kerak emas. Barcha e&apos;lonlarni ko&apos;rish, ustalar bilan bog&apos;lanish va kalkulyatordan foydalanish bepul.
              </p>
            </div>
          </div>
        )}

        {/* Tugmalar */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setStep(1); setError(''); }}
            className="btn btn-outline flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
          >
            <ChevronLeft size={16} /> Orqaga
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yaratilmoqda...</>
            ) : profession === 'customer' ? (
              <><CheckCircle2 size={16} /> Ro&apos;yxatdan o&apos;tish</>
            ) : (
              <><UserPlus size={16} /> Davom etish (obuna →)</>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-[var(--text-3)]">
          Hisobingiz bormi?{' '}
          <Link href="/login" className="text-[var(--primary)] hover:underline font-semibold">Kirish</Link>
        </p>
      </div>
    </div>
  );
}
