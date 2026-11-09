'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { FileText, Search } from 'lucide-react';

interface AuditLog {
  id: number;
  user: string;
  action: string;
  action_display: string;
  target_type: string;
  target_name: string;
  details: string;
  ip: string;
  time: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard/audit-logs/?action=${filter}`)
      .then(res => setLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <FileText className="text-slate-500" /> Audit Log Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Tizimda bajarilgan barcha amallar tarixi (kim, nima qildi)</p>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between">
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)}
          className="glass-input rounded-xl px-4 py-2 text-sm max-w-xs"
        >
          <option value="">Barcha amallar</option>
          <option value="user_verified">Verified qilinganlar</option>
          <option value="password_changed">Parol o'zgarganlar</option>
          <option value="ip_blocked">IP Bloklash</option>
          <option value="banner_created">Banner qo'shilganlar</option>
          <option value="notification_sent">Xabarlar</option>
          <option value="project_created">Loyihalar</option>
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="p-4 font-semibold">Vaqt</th>
                  <th className="p-4 font-semibold">Foydalanuvchi/Admin</th>
                  <th className="p-4 font-semibold">Amal</th>
                  <th className="p-4 font-semibold">Tafsilot</th>
                  <th className="p-4 font-semibold text-right">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loglar yo'q</td></tr> : logs.map(l => (
                  <tr key={l.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="p-4 text-xs font-mono text-slate-500">{l.time}</td>
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{l.user}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                        {l.action_display}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <div className="text-xs">
                        {l.target_name && <span className="font-semibold">{l.target_name}</span>}
                        {l.details && <span> - {l.details}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-slate-400">{l.ip || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
