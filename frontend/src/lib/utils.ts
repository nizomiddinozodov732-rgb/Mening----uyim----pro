// ─── Debounce ────────────────────────────────────────────────────────────────
export function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

// ─── Format price ─────────────────────────────────────────────────────────────
export function fmtPrice(price: string | number): string {
  const n = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(n)) return '0';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} mlrd`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)} mln`;
  return n.toLocaleString('uz-UZ');
}

// ─── Format date ─────────────────────────────────────────────────────────────
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Clamp ───────────────────────────────────────────────────────────────────
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
