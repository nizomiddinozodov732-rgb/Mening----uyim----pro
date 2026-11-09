'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import {
  Home, Calculator, MessageSquare, User, LogOut, LogIn, UserPlus,
  Menu, X, ShieldAlert, Store, Hammer, Compass, MapPin, Sun, Moon, Heart,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const NAV = [
  { name: 'Bosh sahifa',   href: '/',            icon: Home },
  { name: "Ko'chmas mulk", href: '/properties',   icon: MapPin },
  { name: 'Materiallar',   href: '/materials',    icon: Store },
  { name: 'Ustalar',       href: '/workers',      icon: Hammer },
  { name: 'Arxitektorlar', href: '/architects',   icon: Compass },
  { name: 'Kalkulyator',   href: '/calculator',   icon: Calculator },
];

export default function Navbar() {
  const pathname             = usePathname();
  const { user, logout, isLoggedIn, theme, setTheme, wishlist } = useStore();
  const [open,    setOpen]   = useState(false);
  const [mounted, setMounted]= useState(false);
  const [scrolled,setScrolled]=useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const active = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className={`
      sticky top-0 z-50 w-full transition-all duration-300
      ${scrolled
        ? 'bg-[var(--surface)]/95 backdrop-blur-xl shadow-sm border-b border-[var(--border)]'
        : 'bg-[var(--surface)] border-b border-[var(--border)]'}
    `}>

      {/* ── inner: full width, no max-width restriction on the bar itself ── */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
            <Home size={15} className="text-white" />
          </div>
          <span className="text-base font-black tracking-tight gradient-text whitespace-nowrap">Mening Uyim</span>
          <span className="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 border border-blue-200 dark:border-blue-500/25 shrink-0">
            PRO
          </span>
        </Link>

        {/* Desktop nav links — центр */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {NAV.map(({ name, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold
                whitespace-nowrap transition-all duration-150
                ${active(href)
                  ? 'bg-[var(--primary-l)] text-[var(--primary)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-2)]'}
              `}
            >
              <Icon size={14} />
              {name}
            </Link>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {/* Theme */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] transition-all"
            aria-label="Tema"
          >
            {mounted && (theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />)}
          </button>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <Heart size={17} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {wishlist.length > 9 ? '9+' : wishlist.length}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/chat"
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                <MessageSquare size={17} />
              </Link>

              {(user?.is_admin || user?.is_super_admin) && (
                <Link href="/admin"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/25 whitespace-nowrap">
                  <ShieldAlert size={12} /> Admin
                </Link>
              )}

              <Link href="/profile"
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl border border-[var(--border)] hover:border-blue-300 hover:bg-[var(--primary-l)] transition-all">
                {user?.avatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <User size={13} className="text-white" />
                    </div>
                }
                <span className="text-sm font-semibold text-[var(--text-2)] whitespace-nowrap">
                  {user?.first_name || 'Profil'}
                </span>
              </Link>

              <button onClick={logout}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 ml-1">
              <Link href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--bg-2)] transition-all whitespace-nowrap">
                <LogIn size={14} /> Kirish
              </Link>
              <Link href="/register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all whitespace-nowrap">
                <UserPlus size={14} /> Ro&apos;yxatdan o&apos;tish
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right */}
        <div className="flex lg:hidden items-center gap-1.5">
          <Link href="/wishlist" className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-3)]">
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-2)] hover:bg-[var(--bg-2)] transition-all">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden w-full bg-[var(--surface)] border-t border-[var(--border)] shadow-xl">
          <div className="px-4 py-3 flex flex-col gap-1">
            {NAV.map(({ name, href, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active(href)
                    ? 'bg-[var(--primary-l)] text-[var(--primary)]'
                    : 'text-[var(--text-2)] hover:bg-[var(--bg-2)]'
                }`}>
                <Icon size={17} />
                {name}
              </Link>
            ))}

            <div className="h-px bg-[var(--border)] my-2" />

            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-2)] transition-all w-full">
              {mounted && (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}
              {mounted && (theme === 'dark' ? 'Yorqin rejim' : "Qorong'u rejim")}
            </button>

            {isLoggedIn ? (
              <>
                <Link href="/chat" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-2)] transition-all">
                  <MessageSquare size={17} /> Xabarlar
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-2)] transition-all">
                  <User size={17} /> Profil
                </Link>
                <button onClick={() => { logout(); setOpen(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all w-full">
                  <LogOut size={17} /> Chiqish
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1 pb-2">
                <Link href="/login" onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-2)] hover:border-blue-300 transition-all">
                  <LogIn size={16} /> Kirish
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all">
                  <UserPlus size={16} /> Ro&apos;yxatdan o&apos;tish
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
