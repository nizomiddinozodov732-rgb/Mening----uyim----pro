'use client';

import Link from 'next/link';
import { 
  Home, MapPin, Store, Hammer, Compass, Calculator, Heart, Phone, Mail, 
  Share2, Send, ShieldCheck, Crown, Server, Lock
} from 'lucide-react';

const LINKS = {
  nav: [
    { label: "Ko'chmas mulk",  href: '/properties',  icon: MapPin },
    { label: 'Materiallar',    href: '/materials',    icon: Store },
    { label: 'Ustalar',        href: '/workers',      icon: Hammer },
    { label: 'Arxitektorlar',  href: '/architects',   icon: Compass },
    { label: 'Kalkulyator',    href: '/calculator',   icon: Calculator },
  ],
  types: [
    { label: 'Hovli / Kottedj',   href: '/properties?type=house' },
    { label: 'Kvartira',          href: '/properties?type=apartment' },
    { label: 'Yer maydoni',       href: '/properties?type=land' },
    { label: 'Ijara',             href: '/properties?type=rental' },
    { label: 'Sevimlilar',        href: '/wishlist' },
  ],
  admin: [
    { label: 'Admin Panel',       href: '/admin',               icon: ShieldCheck, badge: 'Moderator' },
    { label: 'Super Admin',       href: '/admin/command-center', icon: Crown,       badge: 'To\'liq nazorat' },
    { label: 'Tizim holati',      href: '/admin/system',        icon: Server,      badge: 'Monitoring' },
  ]
};

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--surface-2)]">
      {/* Top CTA strip */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-white text-center md:text-left">
            <p className="text-sm font-semibold opacity-75 mb-1">Bepul ro&apos;yxatdan o&apos;ting</p>
            <h3 className="text-2xl font-black">E&apos;lon joylash, mijoz toping!</h3>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/register"
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-yellow-300 hover:text-slate-900 transition-all shadow-lg">
              Ro&apos;yxatdan o&apos;tish
            </Link>
            <Link href="/properties"
              className="px-6 py-3 rounded-xl bg-white/15 text-white font-bold text-sm border border-white/25 hover:bg-white/25 transition-all">
              E&apos;lonlarni ko&apos;rish
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">

        {/* Brand */}
        <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Home size={18} className="text-white" />
            </div>
            <span className="text-xl font-black gradient-text">Mening Uyim</span>
          </Link>
          <p className="text-sm leading-relaxed text-[var(--text-3)] max-w-xs">
            O&apos;zbekistoning eng yirik ko&apos;chmas mulk va qurilish platformasi. 12 000+ e&apos;lon, ishonchli sotuvchilar.
          </p>
          {/* Social links */}
          <div className="flex gap-2 mt-1">
            {[
              { icon: Share2, label: 'Ulashish', onClick: () => { if (typeof navigator !== 'undefined' && navigator.share) { navigator.share({ title: 'Mening Uyim', url: window.location.href }); } } },
              { icon: Send, label: 'Telegram', href: 'https://t.me' },
            ].map(({ icon: Icon, label, href, onClick }) => (
              href ? (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-2)] hover:bg-[var(--primary-l)] hover:text-[var(--primary)] text-[var(--text-3)] flex items-center justify-center border border-[var(--border)] transition-all">
                  <Icon size={16} />
                </a>
              ) : (
                <button key={label} type="button" onClick={onClick} aria-label={label}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-2)] hover:bg-[var(--primary-l)] hover:text-[var(--primary)] text-[var(--text-3)] flex items-center justify-center border border-[var(--border)] transition-all">
                  <Icon size={16} />
                </button>
              )
            ))}
          </div>
        </div>

        {/* Nav links */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)] mb-5">Kategoriyalar</p>
          <ul className="flex flex-col gap-3">
            {LINKS.nav.map(({ label, href, icon: Icon }) => (
              <li key={href}>
                <Link href={href}
                  className="flex items-center gap-2.5 text-sm text-[var(--text-2)] hover:text-[var(--primary)] transition-colors group">
                  <span className="w-6 h-6 rounded-lg bg-[var(--bg-2)] group-hover:bg-[var(--primary-l)] flex items-center justify-center transition-all">
                    <Icon size={12} className="group-hover:text-[var(--primary)]" />
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Property types */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)] mb-5">Mulk turlari</p>
          <ul className="flex flex-col gap-3">
            {LINKS.types.map(({ label, href }) => (
              <li key={href}>
                <Link href={href}
                  className="text-sm text-[var(--text-2)] hover:text-[var(--primary)] transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-2)] group-hover:bg-blue-500" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Boshqaruv / Admin & Super Admin */}
        <div>
          <div className="flex items-center gap-1.5 mb-5">
            <Lock size={13} className="text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)]">Boshqaruv</p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {LINKS.admin.map(({ label, href, icon: Icon, badge }) => (
              <li key={href}>
                <Link href={href}
                  className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-blue-500/10 border border-[var(--border)] hover:border-blue-500/30 flex items-center justify-between transition-all group">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon size={13} />
                    </span>
                    <span className="text-xs font-bold text-[var(--text)] group-hover:text-blue-500 transition-colors">
                      {label}
                    </span>
                  </div>
                  {badge && (
                    <span className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            <li>
              <a
                href="/django-admin/"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-[var(--bg-2)] hover:bg-purple-500/10 border border-[var(--border)] hover:border-purple-500/30 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Server size={13} />
                  </span>
                  <span className="text-xs font-bold text-[var(--text)] group-hover:text-purple-500 transition-colors">
                    Django Admin
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">
                  Backend ↗
                </span>
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-3)] mb-5">Aloqa</p>
          <ul className="flex flex-col gap-4">
            <li className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shrink-0">
                <Phone size={15} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">+998 90 123 45 67</p>
                <p className="text-xs text-[var(--text-3)]">Du-Ju: 09:00–18:00</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                <Mail size={15} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">support@houseshop.uz</p>
                <p className="text-xs text-[var(--text-3)]">24/7 javob beramiz</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)] py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-3)]">
          <div className="flex items-center gap-3 flex-wrap">
            <span>© {new Date().getFullYear()} Mening Uyim. Barcha huquqlar himoyalangan.</span>
            <span className="hidden sm:inline text-gray-400">•</span>
            {/* Direct Quick Admin Links in bottom bar */}
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ShieldCheck size={13} /> Admin Panel
            </Link>
            <Link 
              href="/admin/command-center" 
              className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Crown size={13} /> Super Admin
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--primary)] transition-colors">Maxfiylik</Link>
            <Link href="/terms"   className="hover:text-[var(--primary)] transition-colors">Shartlar</Link>
            <span className="flex items-center gap-1">
              Sevgi bilan <Heart size={11} className="text-rose-500 fill-rose-500" /> yasalgan
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
