'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { Bell, Send, Users } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  audience: string;
  recipients: number;
  sent_by: string;
  created_at: string;
}

export default function NotificationCenter() {
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '', audience: 'all' });
  const [sending, setSending] = useState(false);

  const fetchHistory = () => {
    api.get('/dashboard/notifications/')
      .then(res => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Xabar yuborishni tasdiqlaysizmi?')) return;
    setSending(true);
    try {
      const res = await api.post('/dashboard/notifications/', form);
      alert(`Xabar ${res.data.recipients_count} kishiga yuborildi!`);
      setForm({ title: '', message: '', audience: 'all' });
      fetchHistory();
    } catch (err) {
      alert('Xato yuz berdi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Bell className="text-amber-500" /> Ommaviy Xabar Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Foydalanuvchilarga push va tizim ichidagi xabarlarni yuborish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass p-6 rounded-2xl flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Send size={18} className="text-blue-500" /> Yangi Xabar Yuborish</h2>
          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Auditoriya (Kimg)</label>
              <select value={form.audience} onChange={e => setForm({...form, audience: e.target.value})} className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-medium">
                <option value="all">Barcha foydalanuvchilar</option>
                <option value="sellers">Sotuvchilar</option>
                <option value="workers">Ustalar</option>
                <option value="architects">Arxitektorlar</option>
                <option value="verified">Verified foydalanuvchilar</option>
                <option value="admins">Adminlar</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sarlavha</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="w-full glass-input rounded-xl px-4 py-2 text-sm" placeholder="Masalan: Yangi yil aksiyasi!" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Xabar matni</label>
              <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows={5} className="w-full glass-input rounded-xl px-4 py-2 text-sm resize-none" placeholder="Xabaringizni yozing..."></textarea>
            </div>
            <button type="submit" disabled={sending} className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              {sending ? 'Yuborilmoqda...' : <><Send size={18} /> Yuborish</>}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-white/5">
            <h2 className="text-lg font-bold flex items-center gap-2"><Users size={18} className="text-emerald-500" /> Yuborilgan xabarlar tarixi</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                    <th className="p-4 font-semibold">Sarlavha</th>
                    <th className="p-4 font-semibold">Auditoriya</th>
                    <th className="p-4 font-semibold text-right">Qabul qiluvchilar</th>
                    <th className="p-4 font-semibold text-right">Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tarix bo'sh</td></tr> : history.map(h => (
                    <tr key={h.id} className="border-b border-slate-100 dark:border-white/5">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{h.title}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{h.message}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-semibold">
                          {h.audience}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-amber-600">{h.recipients} ta</td>
                      <td className="p-4 text-right text-xs text-slate-500">{h.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
