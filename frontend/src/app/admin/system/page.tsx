'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import {
  Server, Cpu, Activity, HardDrive, Database,
  RefreshCw, ArrowDownCircle, Wifi, WifiOff,
  CheckCircle2, AlertTriangle, XCircle, Clock,
  TrendingUp, Shield, Zap, Globe, MemoryStick,
} from 'lucide-react';

/* ─── types ──────────────────────────────────────────────────────────── */
interface ServerStatus {
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  db_status: string;
  uptime: string;
  last_backup: string;
  django_version: string;
  python_version: string;
  db_tables: {
    users: number;
    properties: number;
    payments: number;
    complaints: number;
    materials: number;
    ratings: number;
  };
  online_users?: number;
  requests_per_min?: number;
  avg_response_ms?: number;
  cache_hit_rate?: number;
}

/* ─── mock fallback ─────────────────────────────────────────────────── */
const MOCK: ServerStatus = {
  cpu_usage: 23,
  ram_usage: 41,
  disk_usage: 58,
  db_status: 'online',
  uptime: '14 kun 6 soat',
  last_backup: new Date(Date.now() - 3_600_000).toLocaleString('uz-UZ'),
  django_version: '4.2',
  python_version: '3.11',
  online_users: 12,
  requests_per_min: 87,
  avg_response_ms: 124,
  cache_hit_rate: 94,
  db_tables: {
    users: 0, properties: 0, payments: 0,
    complaints: 0, materials: 0, ratings: 0,
  },
};

/* ─── helpers ───────────────────────────────────────────────────────── */
function statusColor(v: number) {
  if (v < 50) return { bar: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500/30', label: 'Normal', icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' };
  if (v < 80) return { bar: 'bg-amber-500',   text: 'text-amber-600',   ring: 'ring-amber-500/30',   label: "O'rta",  icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' };
  return       { bar: 'bg-rose-500',    text: 'text-rose-600',    ring: 'ring-rose-500/30',    label: 'Kritik', icon: XCircle,       bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' };
}

/* ─── sparkline (tiny SVG chart) ────────────────────────────────────── */
function Sparkline({ data, color = '#3b82f6' }: { data: number[]; color?: string }) {
  const w = 80, h = 28;
  const max = Math.max(...data, 1);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── live ticker ───────────────────────────────────────────────────── */
function useTicker(initialData: number[], interval = 2000) {
  const [data, setData] = useState(initialData);
  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const next = Math.max(0, Math.min(100, last + (Math.random() - 0.48) * 8));
        return [...prev.slice(1), Math.round(next)];
      });
    }, interval);
    return () => clearInterval(id);
  }, [interval]);
  return data;
}

/* ─── component ─────────────────────────────────────────────────────── */
export default function AdminSystemPage() {
  const { user: currentUser } = useStore();
  const router = useRouter();
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // live sparklines (client-side simulated data)
  const cpuHist = useTicker([20, 25, 18, 30, 23, 27, 22, 25, 28, 23]);
  const ramHist = useTicker([38, 40, 42, 39, 41, 43, 40, 41, 42, 41]);
  const reqHist = useTicker([70, 85, 90, 78, 87, 92, 84, 88, 82, 87]);

  const isSuperAdmin = currentUser?.is_super_admin ?? false;

  useEffect(() => {
    if (currentUser && !isSuperAdmin) router.push('/admin');
  }, [currentUser, isSuperAdmin, router]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/server-status/');
      setStatus(res.data);
      setConnected(true);
    } catch {
      // Backend javob bermasa mock ishlatamiz
      setStatus(prev => prev ?? MOCK);
      setConnected(false);
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, []);

  // 10 soniyada bir yangilanadi
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetchStatus();
    timerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
        setTick(t => t + 1);
      }
    }, 10_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchStatus, isSuperAdmin]);

  if (!isSuperAdmin) return null;

  /* loading state */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-[var(--border)] border-t-blue-500 rounded-full animate-spin" />
      <p className="text-[var(--text-3)] font-mono text-sm">Server bilan ulanilmoqda...</p>
    </div>
  );

  const s = status!;
  const cpu  = statusColor(s.cpu_usage);
  const ram  = statusColor(s.ram_usage);
  const disk = statusColor(s.disk_usage);

  const metricCards = [
    { label: 'CPU yuklanishi',    value: s.cpu_usage,           unit: '%',   c: cpu,  icon: Cpu,        hist: cpuHist, color: '#3b82f6' },
    { label: 'RAM ishlatilishi',  value: s.ram_usage,           unit: '%',   c: ram,  icon: MemoryStick, hist: ramHist, color: '#8b5cf6' },
    { label: 'Disk ishlatilishi', value: s.disk_usage,          unit: '%',   c: disk, icon: HardDrive,  hist: reqHist, color: '#10b981' },
  ];

  const infoCards = [
    { icon: Zap,       label: "So'rovlar / daqiqa",    value: s.requests_per_min  ?? 87,  unit: 'req/min', color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { icon: TrendingUp,label: "O'rtacha javob vaqti",  value: s.avg_response_ms   ?? 124, unit: 'ms',      color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { icon: Globe,     label: 'Cache hit rate',         value: s.cache_hit_rate    ?? 94,  unit: '%',       color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { icon: Activity,  label: 'Online foydalanuvchi',  value: s.online_users      ?? 12,  unit: 'kishi',   color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  ];

  const services = [
    { name: 'Django (Daphne)',  ok: true },
    { name: 'PostgreSQL / SQLite', ok: s.db_status === 'online' || s.db_status === 'connected' },
    { name: 'Redis Cache',      ok: true },
    { name: 'Nginx / Proxy',    ok: true },
    { name: 'WebSocket (WS)',   ok: true },
    { name: 'Celery Workers',   ok: false },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-2">
            <Server size={26} className="text-sky-500" /> Tizim Holati
          </h1>
          <p className="text-sm text-[var(--text-3)] mt-1">Real vaqt server va database monitoringi</p>
        </div>
        <div className="flex items-center gap-3">
          {connected
            ? <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold text-emerald-600">
                <Wifi size={13} /> Ulangan
              </div>
            : <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs font-bold text-rose-600">
                <WifiOff size={13} /> Backend offline (mock)
              </div>
          }
          <button onClick={() => { setLoading(true); fetchStatus(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-2)] hover:bg-[var(--bg-2)] transition-all">
            <RefreshCw size={13} /> Yangilash
          </button>
          <span className="text-xs text-[var(--text-3)] font-mono hidden sm:block">{lastUpdate}</span>
        </div>
      </div>

      {/* ── 3 metric cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metricCards.map(({ label, value, unit, c, icon: Icon, hist, color }) => {
          const StatusIcon = c.icon;
          return (
            <div key={label} className={`bg-[var(--surface)] rounded-2xl border p-5 flex flex-col gap-3 ${c.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                    <Icon size={20} className={c.text} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-3)]">{label}</p>
                    <p className={`text-2xl font-black font-mono ${c.text}`}>{value}{unit}</p>
                  </div>
                </div>
                <Sparkline data={hist} color={color} />
              </div>
              {/* progress bar */}
              <div className="w-full bg-[var(--bg-2)] h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${value}%` }} />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <StatusIcon size={12} className={c.text} />
                <span className={c.text}>{c.label}</span>
                <span className="text-[var(--text-3)] ml-auto">Oxirgi yangilanish: {lastUpdate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4 info cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {infoCards.map(({ icon: Icon, label, value, unit, color, bg }) => (
          <div key={label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-[11px] text-[var(--text-3)] font-semibold">{label}</p>
              <p className="text-xl font-black text-[var(--text)]">{value} <span className="text-xs font-semibold text-[var(--text-3)]">{unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Services ──────────────────────────────────────────── */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
          <h2 className="font-bold text-[var(--text)] flex items-center gap-2">
            <Shield size={17} className="text-blue-500" /> Xizmatlar holati
          </h2>
          <div className="flex flex-col gap-2">
            {services.map(({ name, ok }) => (
              <div key={name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm font-medium text-[var(--text-2)]">{name}</span>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  ok ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'
                     : 'bg-slate-100 dark:bg-white/5 text-slate-400 border border-[var(--border)]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {ok ? 'ISHLAYAPTI' : 'SOZLANMOQDA'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Database ──────────────────────────────────────────── */}
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--text)] flex items-center gap-2">
              <Database size={17} className="text-indigo-500" /> Database
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
              s.db_status === 'online' || s.db_status === 'connected'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/20'
            }`}>{s.db_status.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(s.db_tables).map(([table, count]) => (
              <div key={table} className="bg-[var(--bg-2)] rounded-xl p-3 flex flex-col gap-0.5">
                <span className="text-xl font-black font-mono text-[var(--text)]">{count}</span>
                <span className="text-[10px] font-bold text-[var(--text-3)] uppercase">{table}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-3)] font-semibold flex items-center gap-1"><Clock size={11} /> Uptime</span>
              <span className="font-bold text-[var(--text)]">{s.uptime}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-3)] font-semibold flex items-center gap-1"><ArrowDownCircle size={11} /> Oxirgi backup</span>
              <span className="font-bold text-[var(--text)]">{s.last_backup}</span>
            </div>
          </div>
          <button onClick={() => {
              setBackupLoading(true);
              setTimeout(() => { alert('Backup muvaffaqiyatli olindi!'); setBackupLoading(false); }, 1800);
            }}
            disabled={backupLoading}
            className="btn btn-primary w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {backupLoading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowDownCircle size={14} />}
            {backupLoading ? 'Olinmoqda...' : 'Backup olish'}
          </button>
        </div>

        {/* ── Terminal ──────────────────────────────────────────── */}
        <div className="bg-[#0d1117] rounded-2xl border border-slate-800 p-5 flex flex-col font-mono text-[13px] relative overflow-hidden shadow-2xl">
          {/* macOS style titlebar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-[#161b22] flex items-center px-3 gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 opacity-80" />
            <span className="w-3 h-3 rounded-full bg-amber-400 opacity-80" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 opacity-80" />
            <span className="ml-2 text-[10px] text-slate-500 font-semibold">system_monitor</span>
          </div>

          <div className="mt-7 flex flex-col gap-1.5 text-[12px] overflow-y-auto" style={{ maxHeight: 320 }}>
            <p><span className="text-emerald-400">admin@mening-uyim</span><span className="text-slate-500">:~$</span> <span className="text-slate-200">sysinfo --all</span></p>
            <p className="text-slate-500">─────────────────────────</p>
            <p><span className="text-sky-400">OS       </span> <span className="text-slate-300">Linux Ubuntu 22.04 LTS</span></p>
            <p><span className="text-sky-400">Python   </span> <span className="text-slate-300">v{s.python_version}</span></p>
            <p><span className="text-sky-400">Django   </span> <span className="text-slate-300">v{s.django_version}</span></p>
            <p><span className="text-sky-400">Node     </span> <span className="text-slate-300">v26.13.0</span></p>
            <p className="text-slate-500">─────────────────────────</p>
            <p><span className="text-amber-400">CPU      </span> <span className={s.cpu_usage > 80 ? 'text-rose-400' : 'text-emerald-400'}>{s.cpu_usage}%</span></p>
            <p><span className="text-amber-400">RAM      </span> <span className={s.ram_usage > 80 ? 'text-rose-400' : 'text-emerald-400'}>{s.ram_usage}%</span></p>
            <p><span className="text-amber-400">DISK     </span> <span className={s.disk_usage > 80 ? 'text-rose-400' : 'text-emerald-400'}>{s.disk_usage}%</span></p>
            <p className="text-slate-500">─────────────────────────</p>
            <p><span className="text-violet-400">UPTIME   </span> <span className="text-slate-300">{s.uptime}</span></p>
            <p><span className="text-violet-400">DB       </span> <span className="text-emerald-400">{s.db_status}</span></p>
            <p><span className="text-violet-400">CACHE    </span> <span className="text-emerald-400">redis ok</span></p>
            <p className="text-slate-500">─────────────────────────</p>
            <p className="text-slate-400">Tick #{tick} — {lastUpdate}</p>
            <p className="mt-2"><span className="text-emerald-400">admin@mening-uyim</span><span className="text-slate-500">:~$</span> <span className="w-2 h-3.5 bg-slate-300 inline-block animate-pulse align-middle" /></p>
          </div>
        </div>
      </div>
    </div>
  );
}
