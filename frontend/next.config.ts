import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  // ── Kompilyatsiya optimallashtirish ────────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'zustand',
    ],
  },

  // ── Rasm optimallashtirish ─────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 1 kun cache
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'http',  hostname: '127.0.0.1' },
    ],
  },

  // ── Backend (Django) ga proxy ──────────────────────────────
  // Bitta domenda: frontend Next.js, API/Django esa ichki 8000-portda.
  async rewrites() {
    const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      { source: '/api/:path*',          destination: `${backend}/api/:path*` },
      { source: '/django-admin',        destination: `${backend}/django-admin/` },
      { source: '/django-admin/:path*', destination: `${backend}/django-admin/:path*` },
      { source: '/static/:path*',       destination: `${backend}/static/:path*` },
      { source: '/media/:path*',        destination: `${backend}/media/:path*` },
      // WebSocket (Django Channels) — Next.js upgrade so'rovini proxy qiladi
      { source: '/ws/:path*',           destination: `${backend}/ws/:path*` },
    ];
  },

  // ── HTTP cache headers ─────────────────────────────────────
  // Eslatma: `/_next/static/*` uchun production cache sarlavhasini Next.js
  // o'zi to'g'ri (immutable) qo'yadi. Bu yerda qo'lda `Cache-Control` berish
  // Next.js ogohlantirishini keltirib chiqaradi va kerak emas.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
