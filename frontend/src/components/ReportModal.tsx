'use client';

import { useState } from 'react';
import { api, useStore } from '@/store/useStore';
import { AlertTriangle, X, ShieldAlert, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'property' | 'material' | 'store' | 'user';
  targetId?: number;
  targetTitle: string;
  accusedId?: number;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  accusedId,
}: ReportModalProps) {
  const router = useRouter();
  const { isLoggedIn } = useStore();

  const [complaintType, setComplaintType] = useState('fraud');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setError("Iltimos, mavzu va shikoyat tafsilotlarini to'liq kiriting");
      return;
    }

    setSubmitting(true);
    setError('');

    const payload: any = {
      subject: subject.trim(),
      description: description.trim(),
      complaint_type: complaintType,
    };

    if (accusedId) payload.accused = accusedId;
    if (targetType === 'property' && targetId) payload.property = targetId;
    if (targetType === 'material' && targetId) payload.material = targetId;
    if (targetType === 'store' && targetId) payload.store = targetId;
    if (targetType === 'user' && targetId && !accusedId) payload.accused = targetId;

    try {
      await api.post('/complaints/', payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setDescription('');
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      setError(err.response?.data?.error || "Shikoyatni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-[var(--text)] text-base">Shikoyat yuborish</h3>
              <p className="text-xs text-[var(--text-3)] line-clamp-1">{targetTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-3)] hover:bg-[var(--bg-2)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
              <Check size={28} />
            </div>
            <h4 className="font-bold text-base text-[var(--text)]">Shikoyatingiz qabul qilindi!</h4>
            <p className="text-xs text-[var(--text-3)] max-w-xs">
              Moderatorlarimiz tez orada ushbu shikoyatni ko&apos;rib chiqib, zarur choralarni ko&apos;rishadi.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--text-2)] mb-1.5">
                Shikoyat sababi *
              </label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] text-xs font-semibold text-[var(--text)] outline-none focus:border-rose-500 transition-colors"
              >
                <option value="fraud">Firibgarlik / Aldov</option>
                <option value="fake">Soxta / Noto&apos;g&apos;ri ma&apos;lumot</option>
                <option value="inappropriate">Nomaqbul yoki haqoratomuz kontent</option>
                <option value="poor_quality">Sifatsiz xizmat yoki tovar</option>
                <option value="spam">Spam yoki ruxsatsiz reklama</option>
                <option value="other">Boshqa muammo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-2)] mb-1.5">
                Mavzu *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Qisqacha mazmuni (masalan: Narx soxta ko'rsatilgan)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] text-xs text-[var(--text)] outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-2)] mb-1.5">
                Batafsil izoh *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Muammoni batafsil tasvirlab bering..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-2)] text-xs text-[var(--text)] outline-none focus:border-rose-500 transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)] mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--text-3)] hover:bg-[var(--bg-2)] transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <AlertTriangle size={14} />
                {submitting ? "Yuborilmoqda..." : "Shikoyatni yuborish"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

