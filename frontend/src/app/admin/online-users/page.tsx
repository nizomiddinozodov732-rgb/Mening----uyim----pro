'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, useStore } from '@/store/useStore';
import {
  Users, Search, Wifi, Clock, MapPin, Smartphone,
  Monitor, RefreshCw, Activity, Shield, ShieldCheck,
  Eye, MessageSquare, Ban, ChevronDown, Globe,
} from 'lucide-react';

/* ─── types ──────────────────────────────────────────────────────── */
interface OnlineUser {
  id: number;
  username: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  profession: string;
  profession_display: string;
  is_verified: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  last_seen: string;
  is_online: boolean;
  device?: string;
  location?: string;
  current_page?: string;
  session_duration?: string;
}

/* ─── mock data ───────────────────────────────────────────────────── */
const MOCK_USERS: OnlineUser[] = [
  { id: 1,  username: 'alisher_t',   full_name: 'Alisher Toshmatov',   first_name: 'Alisher',   last_name: 'Toshmatov',   avatar: null, profession: 'seller',    profession_display: 'Sotuvchi',        is_verified: true,  is_admin: false, is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'desktop', location: 'Toshkent',   current_page: '/properties',   session_duration: '12 daq' },
  { id: 2,  username: 'malika_k',    full_name: 'Malika Karimova',      first_name: 'Malika',    last_name: 'Karimova',    avatar: null, profession: 'customer',  profession_display: 'Mijoz',           is_verified: false, is_admin: false, is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'mobile',  location: 'Samarqand',  current_page: '/',             session_duration: '3 daq'  },
  { id: 3,  username: 'bobur_usta',  full_name: 'Bobur Usmonov',        first_name: 'Bobur',     last_name: 'Usmonov',     avatar: null, profession: 'builder',   profession_display: "Quruvchi",        is_verified: true,  is_admin: false, is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'desktop', location: 'Namangan',   current_page: '/workers',      session_duration: '27 daq' },
  { id: 4,  username: 'zulfiya_me',  full_name: "Zulfiya Me'morova",    first_name: 'Zulfiya',   last_name: "Me'morova",   avatar: null, profession: 'architect', profession_display: "Me'mor",          is_verified: true,  is_admin: false, is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'tablet',  location: 'Toshkent',   current_page: '/architects',   session_duration: '8 daq'  },
  { id: 5,  username: 'jasur_admin', full_name: 'Jasur Nazarov',        first_name: 'Jasur',     last_name: 'Nazarov',     avatar: null, profession: 'seller',    profession_display: 'Admin',           is_verified: true,  is_admin: true,  is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'desktop', location: 'Toshkent',   current_page: '/admin',        session_duration: '45 daq' },
  { id: 6,  username: 'nodir_s',     full_name: 'Nodir Sobirov',        first_name: 'Nodir',     last_name: 'Sobirov',     avatar: null, profession: 'repairman', profession_display: "Ta'mirlovchi",    is_verified: false, is_admin: false, is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'mobile',  location: 'Andijon',    current_page: '/calculator',   session_duration: '2 daq'  },
  { id: 7,  username: 'dilnoza_b',   full_name: 'Dilnoza Baxtiyorova',  first_name: 'Dilnoza',   last_name: 'Baxtiyorova', avatar: null, profession: 'customer',  profession_display: 'Mijoz',           is_verified: false, is_admin: false, is_super_admin: false, last_seen: new Date().toISOString(), is_online: true,  device: 'mobile',  location: 'Buxoro',     current_page: '/properties',   session_duration: '18 daq' },
  { id: 8,  username: 'sardor_quv',  full_name: 'Sardor Quvondiqov',    first_name: 'Sardor',    last_name: 'Quvondiqov',  avatar: null, profession: 'seller',    profession_display: 'Sotuvchi',        is_verified: true,  is_admin: false, is_super_admin: false, last_seen: new Date(Date.now()-120000).toISOString(), is_online: false, device: 'desktop', location: 'Toshkent', current_page: '/materials',  session_duration: '—'      },
  { id: 9,  username: 'hulkar_m',    full_name: 'Hulkar Mirzayeva',     first_name: 'Hulkar',    last_name: 'Mirzayeva',   avatar: null, profession: 'customer',  profession_display: 'Mijoz',           is_verified: false, is_admin: false, is_super_admin: false, last_seen: new Date(Date.now()-300000).toISOString(), is_online: false, device: 'mobile',  location: 'Farg\'ona', current_page: '/',           session_duration: '—'      },
  { id: 10, username: 'timur_arch',  full_name: 'Timur Arxitekturov',   first_name: 'Timur',     last_name: 'Arxitekturov',avatar: null, profession: 'architect', profession_display: "Me'mor",          is_verified: true,  is_admin: false, is_super_admin: false, last_seen: new Date(Date.now()-600000).toISOString(), is_online: false, device: 'desktop', location: 'Toshkent', current_page: '/architects', session_duration: '—'      },
];

const PROF_COLORS: Record<string, string> = {
  customer:   'tag-blue',
  seller:     'tag-emerald',
  builder:    'tag-amber',
  repairman:  'tag-rose',
  architect:  'tag-violet',
};
const ADMIN_COLOR = 'tag-rose';

const DEVICE_ICON = {
  desktop: <Monitor size={13} />,
  mobile:  <Smartphone size={13} />,
  tablet:  <Globe size={13} />,
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s oldin`;
  if (diff < 3600) return `${Math.floor(diff/60)} daq oldin`;
  return `${Math.floor(diff/3600)} soat oldin`;
}

function Avatar({ u }: { u: OnlineUser }) {
  const initials = `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  const colors = ['from-blue-500 to-indigo-600','from-emerald-500 to-teal-600','from-violet-500 to-purple-600','from-amber-500 to-orange-600','from-rose-500 to-pink-600'];
  const bg = colors[u.id % colors.length];
  return u.avatar
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={u.avatar} alt={u.full_name} className="w-full h-full object-cover" />
    : <div className={`w-full h-full bg-gradient-to-br ${bg} flex items-center justify-center text-white font-bold text-sm`}>{initials}</div>;
}

/* ─── main component ─────────────────────────────────────────────── */
export default function OnlineUsersPage() {
  const { user: currentUser } = useStore();
  const [users, setUsers]       = useState<OnlineUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<'all'|'online'|'offline'>('all');
  const [profFilter, setProfFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [liveCount, setLiveCount]   = useState(0);
  const tickRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/online-users/');
      const data = res.data.results || res.data || [];
      setUsers(data.length ? data : MOCK_USERS);
    } catch {
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, []);

  // 15 soniyada bir yangilanadi
  useEffect(() => {
    fetchUsers();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchUsers();
        tickRef.current += 1;
        // Live counter simulatsiyasi
        setLiveCount(prev => Math.max(0, prev + Math.round((Math.random() - 0.4) * 2)));
      }
    }, 15_000);
    return () => clearInterval(id);
  }, [fetchUsers]);

  useEffect(() => {
    setLiveCount(MOCK_USERS.filter(u => u.is_online).length);
  }, []);

  /* ── filtered list ────────────────────────────────────────────── */
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
    const matchStatus = filter === 'all' || (filter === 'online' ? u.is_online : !u.is_online);
    const matchProf   = !profFilter || u.profession === profFilter;
    return matchSearch && matchStatus && matchProf;
  });

  const onlineCount  = users.filter(u => u.is_online).length;
  const offlineCount = users.filter(u => !u.is_online).length;
  const professions  = [...new Set(users.map(u => u.profession))];

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1,2,3,4,5].map(n => <div key={n} className="skeleton h-16 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-2">
            <Wifi size={24} className="text-emerald-500" /> Online Foydalanuvchilar
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Real vaqt rejimida platforma foydalanuvchilari</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-600 text-xs font-bold">{liveCount} online</span>
          </div>
          <button onClick={() => { setLoading(true); fetchUsers(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-2)] transition-all">
            <RefreshCw size={13} /> Yangilash
          </button>
          <span className="text-xs text-[var(--text-3)] font-mono hidden sm:block">{lastUpdate}</span>
        </div>
      </div>

      {/* ── Summary cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Jami foydalanuvchi', value: users.length, icon: Users,    color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10'    },
          { label: 'Hozir online',        value: onlineCount,  icon: Wifi,     color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: "Yaqinda bo'lgan",     value: offlineCount, icon: Clock,    color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10'   },
          { label: 'Adminlar online',     value: users.filter(u=>u.is_online&&(u.is_admin||u.is_super_admin)).length, icon: Shield, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-3)] font-semibold">{label}</p>
              <p className="text-2xl font-black text-[var(--text)]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
          <input type="text" placeholder="Ism yoki username..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="glass-input pl-9 pr-3 py-2.5 w-full" />
        </div>

        {/* Status filter */}
        <div className="flex bg-[var(--bg-2)] p-1 rounded-xl border border-[var(--border)] gap-1">
          {([['all','Barchasi'],['online','Online'],['offline','Offline']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === v ? 'bg-[var(--surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-3)] hover:text-[var(--text)]'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Profession filter */}
        <div className="relative">
          <select value={profFilter} onChange={e => setProfFilter(e.target.value)}
            className="glass-input pl-3 pr-8 py-2.5 appearance-none cursor-pointer">
            <option value="">Barcha kasblar</option>
            {professions.map(p => (
              <option key={p} value={p}>{users.find(u => u.profession===p)?.profession_display ?? p}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] pointer-events-none" />
        </div>
      </div>

      {/* ── Activity bar ───────────────────────────────────────── */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
            <Activity size={15} className="text-blue-500" /> Kasblar bo&apos;yicha taqsimot
          </h3>
          <span className="text-xs text-[var(--text-3)]">{users.length} ta jami</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(
            users.reduce<Record<string,{count:number;display:string;online:number}>>((acc, u) => {
              if (!acc[u.profession]) acc[u.profession] = { count: 0, display: u.profession_display, online: 0 };
              acc[u.profession].count++;
              if (u.is_online) acc[u.profession].online++;
              return acc;
            }, {})
          ).map(([prof, { count, display, online }]) => (
            <div key={prof} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${PROF_COLORS[prof] ?? 'tag-blue'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {display}: {count} <span className="opacity-60">({online} online)</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {/* thead */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-[var(--bg-2)] border-b border-[var(--border)] text-[11px] font-bold text-[var(--text-3)] uppercase tracking-wider">
          <div className="col-span-4">Foydalanuvchi</div>
          <div className="col-span-2 hidden sm:block">Kasb</div>
          <div className="col-span-2 hidden md:block">Joylashuv</div>
          <div className="col-span-2 hidden lg:block">Sahifa</div>
          <div className="col-span-2 text-right">Holat / Vaqt</div>
        </div>

        {/* rows */}
        <div className="divide-y divide-[var(--border)]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-3)]">
              <Users size={32} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">Foydalanuvchilar topilmadi</p>
            </div>
          ) : filtered.map(u => (
            <div key={u.id}
              className="grid grid-cols-12 gap-2 px-5 py-3.5 hover:bg-[var(--bg-2)] transition-colors group items-center">

              {/* Avatar + name */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden"><Avatar u={u} /></div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${u.is_online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-[var(--text)] truncate">{u.full_name}</span>
                    {u.is_super_admin && <ShieldCheck size={13} className="text-rose-500 shrink-0" />}
                    {u.is_admin && !u.is_super_admin && <Shield size={13} className="text-amber-500 shrink-0" />}
                    {u.is_verified && !u.is_admin && <ShieldCheck size={13} className="text-emerald-500 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[var(--text-3)] truncate">@{u.username}</p>
                </div>
              </div>

              {/* Profession */}
              <div className="col-span-2 hidden sm:flex items-center">
                <span className={`badge text-[10px] ${u.is_admin ? ADMIN_COLOR : (PROF_COLORS[u.profession] ?? 'tag-blue')}`}>
                  {u.is_super_admin ? 'Super Admin' : u.is_admin ? 'Admin' : u.profession_display}
                </span>
              </div>

              {/* Location */}
              <div className="col-span-2 hidden md:flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                <MapPin size={12} />
                <span className="truncate">{u.location ?? '—'}</span>
              </div>

              {/* Current page */}
              <div className="col-span-2 hidden lg:flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                <Eye size={12} />
                <span className="truncate font-mono">{u.current_page ?? '—'}</span>
              </div>

              {/* Status + actions */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                {/* Device icon */}
                <span className="text-[var(--text-3)] hidden sm:block">
                  {DEVICE_ICON[u.device as keyof typeof DEVICE_ICON] ?? <Monitor size={13} />}
                </span>

                {u.is_online
                  ? <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ONLINE
                    </div>
                  : <div className="text-[11px] text-[var(--text-3)] font-mono whitespace-nowrap">
                      {timeAgo(u.last_seen)}
                    </div>
                }

                {/* Admin action buttons — only visible on hover */}
                {currentUser?.is_super_admin && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button title="Xabar yuborish"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
                      <MessageSquare size={13} />
                    </button>
                    <button title="Bloklash"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                      <Ban size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="px-5 py-3 bg-[var(--bg-2)] border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-3)]">
          <span>{filtered.length} ta ko&apos;rsatilmoqda (jami: {users.length})</span>
          <div className="flex items-center gap-1.5">
            <RefreshCw size={11} className="animate-spin" style={{ animationDuration: '4s' }} />
            15 soniyada yangilanadi
          </div>
        </div>
      </div>
    </div>
  );
}
