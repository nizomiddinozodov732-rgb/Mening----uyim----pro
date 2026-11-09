'use client';

import { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { api, useStore } from '@/store/useStore';
import Link from 'next/link';

interface PropertyRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: number;
  propertyTitle: string;
  initialStars?: number;
  initialComment?: string;
  onRatingSuccess?: (data: { rating: number; rating_count: number; user_rating: any }) => void;
}

export default function PropertyRatingModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  initialStars = 5,
  initialComment = '',
  onRatingSuccess,
}: PropertyRatingModalProps) {
  const { isLoggedIn, user } = useStore();
  const [stars, setStars] = useState<number>(initialStars || 5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(initialComment || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDisplayStars = hoveredStars !== null ? hoveredStars : stars;

  const starLabels = [
    '',
    'Juda yomon (1)',
    'Qoniqarsiz (2)',
    'Yaxshi (3)',
    'Juda yaxshi (4)',
    'A\'lo darajada! (5)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setError("Reyting qo'yish uchun avval tizimga kiring.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post(`/properties/${propertyId}/rate/`, {
        stars,
        comment,
      });

      setSuccessMsg("Rahmat! Reyting qabul qilindi va e'lon topga ko'tarildi! 🎉");
      if (onRatingSuccess) {
        onRatingSuccess(res.data);
      }
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1400);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || "Reyting saqlashda xatolik yuz berdi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[var(--surface)] text-[var(--text)] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[var(--border)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs mb-1 uppercase tracking-wider">
          <Sparkles size={14} /> E&apos;lonni baholash
        </div>

        <h3 className="text-xl font-extrabold text-[var(--text)] line-clamp-1">
          {propertyTitle}
        </h3>
        <p className="text-xs text-[var(--text-3)] mt-1">
          5 ta yulduz orqali reyting bering. Reyting qanchalik yuqori bo&apos;lsa, e&apos;lon shunchalik topga chiqadi!
        </p>

        {!isLoggedIn ? (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              E&apos;longa reyting belgilash uchun profilingizga kiring.
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition"
            >
              Kirish / Ro&apos;yxatdan o&apos;tish
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            {/* Stars Selector */}
            <div className="flex flex-col items-center justify-center gap-2 py-3 bg-[var(--bg-2)] rounded-2xl border border-[var(--border)]">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoveredStars(s)}
                    onMouseLeave={() => setHoveredStars(null)}
                    onClick={() => setStars(s)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform duration-150 focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`${
                        currentDisplayStars >= s
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]'
                          : 'fill-transparent text-gray-300 dark:text-zinc-600'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-amber-500 min-h-[18px]">
                {starLabels[currentDisplayStars]}
              </span>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-2)] mb-1.5">
                Izoh yoki fikringiz (ixtiyoriy):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Mulk va uning sharoitlari haqida fikringizni bildiring..."
                rows={3}
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs resize-none"
              />
            </div>

            {/* Feedback messages */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline flex-1 py-2.5 rounded-xl text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Saqlanmoqda...' : 'Baholash ⭐'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

