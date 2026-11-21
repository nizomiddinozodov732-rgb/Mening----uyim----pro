'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
}

/**
 * O'chirishni tasdiqlash oynasi (modal).
 * Barcha muhim o'chirish amallari uchun qayta ishlatiladi.
 */
export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "O'chirishni tasdiqlang",
  message = "Bu amalni qaytarib bo'lmaydi.",
  confirmLabel = "Ha, o'chirish",
  cancelLabel = 'Bekor qilish',
  loading = false,
  error = null,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={() => { if (!loading) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Yopish"
          className="absolute top-4 right-4 p-2 rounded-xl text-[var(--text-3)] hover:bg-[var(--bg-2)] transition-colors disabled:opacity-40"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle size={26} />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--text)]">{title}</h3>
          <p className="text-sm text-[var(--text-2)] leading-relaxed">{message}</p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-outline flex-1 py-3 rounded-xl text-sm disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                O&apos;chirilmoqda...
              </>
            ) : (
              <>
                <Trash2 size={15} /> {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
