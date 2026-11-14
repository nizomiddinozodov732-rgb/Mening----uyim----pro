'use client';

import { useStore, api } from '@/store/useStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Building2, CreditCard, AlertTriangle, 
  Settings, Server, ArrowLeft, LogOut, Menu, X, Bell,
  Clock, Crown, Brain, Map, Briefcase, DollarSign, ShieldCheck,
  Megaphone, FileText, HardHat, Lock, Globe, Wifi,
} from 'lucide-react';

interface MenuGroup {
  label: string;
  items: MenuItem[];
}
interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  access: 'all' | 'super';
  badge?: string;
}

// Live clock — alohida komponent, shunda har soniyadagi yangilanish
// butun admin panelni qayta render qilmaydi (faqat soat qayta chiziladi).
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className="font-mono font-medium">{time}</span>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, logout, setUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
      } else if (!user) {
        api.get('/auth/profile/')
          .then((res) => {
            setUser(res.data);
            const canAccess = Boolean(res.data.is_admin || res.data.is_super_admin || res.data.is_staff || res.data.is_superuser);
            if (!canAccess) {
              router.push('/');
            }
          })
          .catch(() => {
            logout();
            router.push('/login');
          });
      } else {
        const canAccess = Boolean(user.is_admin || user.is_super_admin || (user as any).is_staff || (user as any).is_superuser);
        if (!canAccess) {
          router.push('/');
        }
      }
    }
  }, [user, router, mounted, setUser, logout]);

  const isSuperAdmin = Boolean(user?.is_super_admin || (user as any)?.is_superuser);
  const isAdmin = Boolean(user?.is_admin || user?.is_super_admin || (user as any)?.is_staff || (user as any)?.is_superuser);

  if (!mounted || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#080711]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 font-medium">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  const menuGroups: MenuGroup[] = [
    {
      label: 'Asosiy',
      items: [
        { name: 'Command Center', href: '/admin/command-center', icon: Crown, access: 'super' },
        { name: 'Dashboard',      href: '/admin',               icon: LayoutDashboard, access: 'all' },
        { name: 'AI Yordamchi',   href: '/admin/ai-assistant',  icon: Brain, access: 'all', badge: 'AI' },
      ]
    },
    {
      label: 'Monitoring',
      items: [
        { name: 'Online Foydalanuvchilar', href: '/admin/online-users', icon: Wifi,   access: 'all',   badge: '●' },
        { name: 'Server Holati',           href: '/admin/system',        icon: Server, access: 'super' },
      ]
    },
    {
      label: 'Analitika',
      items: [
        { name: 'AI Monitoring', href: '/admin/ai-monitoring', icon: Brain, access: 'super' },
        { name: 'Biznes Analitika', href: '/admin/business-analytics', icon: Briefcase, access: 'all' },
        { name: 'Daromad Markazi', href: '/admin/revenue', icon: DollarSign, access: 'all' },
        { name: 'Statistik Xarita', href: '/admin/statistics-map', icon: Map, access: 'all' },
      ]
    },
    {
      label: 'Boshqaruv',
      items: [
        { name: 'Foydalanuvchilar', href: '/admin/users', icon: Users, access: 'all' },
        { name: 'Ko\'chmas Mulklar', href: '/admin/properties', icon: Building2, access: 'all' },
        { name: 'Loyihalar', href: '/admin/projects', icon: HardHat, access: 'all' },
        { name: 'To\'lovlar', href: '/admin/payments', icon: CreditCard, access: 'all' },
        { name: 'Shikoyatlar', href: '/admin/complaints', icon: AlertTriangle, access: 'all', badge: '!' },
        { name: 'Verified Markazi', href: '/admin/verified', icon: ShieldCheck, access: 'super' },
      ]
    },
    {
      label: 'Tizim va Sozlamalar',
      items: [
        { name: 'Sayt Kontenti', href: '/admin/content', icon: Globe, access: 'super' },
        { name: 'Marketing', href: '/admin/marketing', icon: Megaphone, access: 'super' },
        { name: 'Xabar Markazi', href: '/admin/notifications', icon: Bell, access: 'super' },
        { name: 'Audit Log', href: '/admin/audit-log', icon: FileText, access: 'super' },
        { name: 'Xavfsizlik', href: '/admin/security', icon: Lock, access: 'super' },
        { name: 'Server Holati', href: '/admin/system', icon: Server, access: 'super' },
        { name: 'Sozlamalar', href: '/admin/settings', icon: Settings, access: 'all' },
      ]
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#060612] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full w-64 bg-white dark:bg-[#0c0c1d] border-r border-slate-200 dark:border-white/5 
        flex flex-col shadow-xl md:shadow-sm transition-transform duration-300 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent tracking-wider">
                MENING UYIM
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest w-fit ${
                isSuperAdmin 
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                  : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
              }`}>
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4 hide-scrollbar">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => 
              item.access === 'all' || (item.access === 'super' && isSuperAdmin)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="flex flex-col gap-1">
                <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  {group.label}
                </span>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-white/5 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className={`ml-auto min-w-[20px] h-5 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-1 ${
                          item.badge === 'AI' ? 'bg-violet-500' :
                          item.badge === '●'  ? 'bg-emerald-500 text-[8px]' :
                          'bg-rose-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
            <ArrowLeft size={18} /> Saytga qaytish
          </Link>
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all w-full text-left"
          >
            <LogOut size={18} /> Tizimdan chiqish
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#0c0c1d] border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400">
              <Menu size={22} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock size={14} />
              <LiveClock />
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-xs">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-600 text-xs font-bold">LIVE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs">
                {user?.first_name?.[0] || 'A'}
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:block">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-8 relative"
          style={{
            backgroundImage:
              'radial-gradient(600px 400px at 100% 0%, rgba(59,130,246,.05), transparent), radial-gradient(500px 400px at 0% 100%, rgba(14,165,233,.04), transparent)',
          }}
        >
          <div className="max-w-[1400px] mx-auto relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
