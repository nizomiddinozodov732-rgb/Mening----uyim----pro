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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
        ],
      },
      {
        // Next.js o'z statik fayllari — 1 yil cache
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
