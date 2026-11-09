'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, useStore } from '@/store/useStore';
import { 
  AlertTriangle, Search, CheckCircle2, XCircle, Clock,
  Eye, MessageSquare, Trash2, ArrowRight
} from 'lucide-react';

interface AdminComplaint {
  id: number;
  subject: string;
  description: string;
  status: string;
  status_display: string;
  admin_response: string;
  complainant: {
    id: number;
    full_name: string;
    avatar: string | null;
  };
  accused: {
    id: number;
    full_name: string;
    avatar: string | null;
  };
  created_at: string;
  updated_at: string;
}

export default function AdminComplaintsPage() {
  const { user: currentUser } = useStore();
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isSuperAdmin = currentUser?.is_super_admin || false;

  const fetchComplaints = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const res = await api.get('/dashboard/complaints/', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleUpdate = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      await api.patch('/dashboard/complaints/', {
        complaint_id: selectedComplaint.id,
        action: 'update_status',
        status: newStatus,
        admin_response: adminResponse
      });
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Shikoyatni butunlay o'chirishni xohlaysizmi?")) return;
    try {
      await api.patch('/dashboard/complaints/', { complaint_id: id, action: 'delete' });
      fetchComplaints();
    } catch (err: any) {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  const openModal = (c: AdminComplaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setAdminResponse(c.admin_response || '');
  };

  const statuses = [
    { code: '', label: 'Barcha holatlar' },
    { code: 'pending', label: 'Kutilmoqda' },
    { code: 'reviewing', label: "Ko'rib chiqilmoqda" },
    { code: 'resolved', label: 'Hal etildi' },
    { code: 'rejected', label: 'Rad etildi' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-rose-500" size={28} /> Shikoyatlar
          </h1>
          <p className="text-slate-500 text-sm">Foydalanuvchilar o&apos;rtasidagi nizolar va shikoyatlarni boshqarish</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 max-w-sm">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-500/20"
        >
          {statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 text-slate-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Sana</th>
                <th className="px-6 py-4">Shikoyatchi</th>
                <th className="px-6 py-4 text-center">Javobgar</th>
                <th className="px-6 py-4">Mavzu</th>
                <th className="px-6 py-4">Holat</th>
                <th className="px-6 py-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Yuklanmoqda...</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Shikoyatlar topilmadi.</td></tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {c.created_at}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 font-bold text-xs overflow-hidden">
                          {c.complainant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.complainant.avatar} alt={c.complainant.full_name} className="w-full h-full object-cover" />
                          ) : c.complainant.full_name[0]}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{c.complainant.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <ArrowRight size={14} className="text-slate-300 dark:text-slate-600" />
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                          <span className="font-semibold text-rose-700 dark:text-rose-400 text-xs">{c.accused.full_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px] block" title={c.subject}>
                        {c.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === 'resolved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 size={12} /> {c.status_display}
                        </span>
                      ) : c.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-xs font-bold">
                          <Clock size={12} /> {c.status_display}
                        </span>
                      ) : c.status === 'reviewing' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-bold">
                          <Eye size={12} /> {c.status_display}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-xs font-bold">
                          <XCircle size={12} /> {c.status_display}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(c)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          title="Ko'rish va javob yozish"
                        >
                          <MessageSquare size={16} />
                        </button>
                        {isSuperAdmin && (
                          <button 
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white dark:bg-[#0c0c1d] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={20} /> Shikoyat Tafsiloti
              </h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-6">
              {/* Users */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Shikoyatchi</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedComplaint.complainant.full_name}</span>
                </div>
                <ArrowRight className="text-rose-400" />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Javobgar</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">{selectedComplaint.accused.full_name}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mavzu</span>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">{selectedComplaint.subject}</h4>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Batafsil matn</span>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-white/5 whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-white/5 pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col gap-1.5 w-full sm:w-1/3">
                    <label className="text-xs font-bold text-slate-500">Holatni o&apos;zgartirish</label>
                    <select 
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#080711] text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    >
                      {statuses.map(s => {
                        if(s.code === '') return null;
                        return <option key={s.code} value={s.code}>{s.label}</option>
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-bold text-slate-500">Admin javobi (ixtiyoriy)</label>
                    <textarea 
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Shikoyat bo'yicha ko'rilgan chora yoki javob yozing..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#080711] text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 min-h-[80px] resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-2">
                  <button 
                    onClick={() => setSelectedComplaint(null)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    onClick={handleUpdate}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
                  >
                    {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
