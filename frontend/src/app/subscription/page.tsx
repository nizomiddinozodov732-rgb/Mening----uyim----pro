'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, useStore } from '@/store/useStore';
import {
  Check, CreditCard, Sparkles, AlertCircle,
  ArrowRight, Shield, Zap, Star, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    id: 'monthly',
    name: 'Oylik',
    price: '50 000',
    period: 'oy',
    save: null,
    perks: [
      "Cheksiz e'lonlar joylash",
      'Mijozlar bilan to\'g\'ridan-to\'g\'ri chat',
      'Shaxsiy profil sahifasi',
      'Reyting tizimi',
      'Statistika va tahlil',
    ],
  },
  {
    id: 'yearly',
    name: 'Yillik',
    price: '500 000',
    period: 'yil',
    save: '100 000 UZS tejaladi',
    perks: [
      'Oylik obunaning barcha imkoniyatlari',
      '2 oy bepul (12 oy narxida 14 oy)',
      "Katalogda yuqoriroq o'rin",
      'Premium "Verified" belgisi',
      'Maxsus qo\'llab-quvvatlash',
    ],
  },
] as const;

const METHODS = [
  { id: 'payme',  label: 'Payme',     color: '#00BFFF' },
  { id: 'click',  label: 'Click',     color: '#00C800' },
  { id: 'uzum',   label: 'Uzum Bank', color: '#8B5CF6' },
  { id: 'visa',   label: 'Visa',      color: '#1A1F71' },
  { id: 'master', label: 'Mastercard',color: '#EB001B' },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [plan,    setPlan]    = useState<'monthly' | 'yearly'>('monthly');
  const [method,  setMethod]  = useState('payme');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Allaqachon obuna bor
  if (user?.is_subscribed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 gap-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Obunangiz faol!</h1>
          <p className="text-[var(--text-3)] mt-2 max-w-sm">
            Barcha premium imkoniyatlardan foydalanishingiz mumkin.
            {user.subscription_end && (
              <> Muddat: <b>{new Date(user.subscription_end).toLocaleDateString('uz-UZ')}</b></>
            )}
          </p>
        </div>
        <Link href="/" className="btn btn-primary px-8 py-3 rounded-2xl text-sm">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const handleSubscribe = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payments/subscribe/', { plan, method });
      if (res.data.status === 'success') {
        setUser({ ...user, is_subscribed: true, subscription_end: res.data.subscription_end });
        router.push('/profile');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string; message?: string } } };
      setError(e.response?.data?.error || e.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col gap-10">

      {/* Header */}
      <div className="text-center flex flex-col gap-3">
        <div className="inline-flex items-center gap-1.5 mx-auto px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 text-xs font-bold">
          <Sparkles size={13} /> Mutaxassislar uchun
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text)]">
          Obuna Tariflari
        </h1>
        <p className="text-[var(--text-3)] max-w-lg mx-auto text-sm">
          {user
            ? <>Salom, <b>{user.first_name}</b>! Platformada to&apos;liq ishlash uchun obunani xarid qiling.</>
            : "Platformada to'liq ishlash uchun obunani xarid qiling."
          }
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 text-sm flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto w-full">
        {PLANS.map(p => {
          const active = plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`relative text-left p-6 rounded-3xl border-2 transition-all duration-200 flex flex-col gap-4 hover:-translate-y-1 ${
                active
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-xl shadow-blue-500/15'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:border-blue-300'
              }`}
            >
              {p.save && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Tejamkor
                </div>
              )}
              {active && (
                <Check size={18} className="absolute top-4 right-4 text-blue-600" />
              )}

              <div>
                <p className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">{p.name} Obuna</p>
                <p className="text-3xl font-black text-[var(--text)] mt-1">
                  {p.price} <span className="text-base font-semibold text-[var(--text-3)]">UZS / {p.period}</span>
                </p>
                {p.save && (
                  <p className="text-xs text-emerald-600 font-bold mt-1">✓ {p.save}</p>
                )}
              </div>

              <ul className="flex flex-col gap-2">
                {p.perks.map(perk => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-[var(--text-2)]">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Ustunliklar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
        {[
          { icon: Shield,   text: 'Xavfsiz to\'lov' },
          { icon: Zap,      text: 'Darhol faollashadi' },
          { icon: Star,     text: 'Istalgan vaqt bekor qilish' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text-2)]">
            <Icon size={16} className="text-[var(--primary)] shrink-0" />
            {text}
          </div>
        ))}
      </div>

      {/* To'lov usuli */}
      <div className="max-w-md mx-auto w-full card rounded-3xl p-6 flex flex-col gap-5">
        <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
          <CreditCard size={18} className="text-[var(--primary)]" />
          To&apos;lov usulini tanlang
        </h3>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {METHODS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`p-3 rounded-xl border-2 flex items-center justify-center font-bold text-xs transition-all ${
                method === m.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                  : 'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--border-2)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Xulosa */}
        <div className="flex justify-between items-center py-3 border-t border-[var(--border)] text-sm">
          <span className="text-[var(--text-3)]">
            {plan === 'monthly' ? 'Oylik' : 'Yillik'} obuna
          </span>
          <span className="font-extrabold text-[var(--text)]">
            {plan === 'monthly' ? '50 000' : '500 000'} UZS
          </span>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn btn-primary w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-600/20"
        >
          {loading
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Amalga oshirilmoqda...</>
            : <>To&apos;lovni amalga oshirish <ArrowRight size={17} /></>
          }
        </button>

        {!user && (
          <p className="text-center text-xs text-rose-500">
            To&apos;lov qilish uchun avval{' '}
            <Link href="/login" className="underline">kirish</Link> kerak
          </p>
        )}
      </div>
    </div>
  );
}
