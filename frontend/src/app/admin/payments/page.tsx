'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/store/useStore';
import { 
  CreditCard, Search, CheckCircle2, XCircle, Clock,
  ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface AdminPayment {
  id: number;
  user_id: number;
  user_name: string;
  user_phone: string;
  property_title: string;
  amount: string;
  method: string;
  method_display: string;
  status: string;
  status_display: string;
  transaction_id: string;
  created_at: string;
}

interface PaymentStats {
  completed_total: number;
  completed_count: number;
  pending_total: number;
  pending_count: number;
  failed_total: number;
  failed_count: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      
      const res = await api.get('/dashboard/payments/', { params });
      setPayments(res.data.payments);
      setStats(res.data.stats);
      setLastUpdate(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    fetchPayments();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const statuses = [
    { code: '', label: 'Barcha holatlar' },
    { code: 'completed', label: 'Muvaffaqiyatli' },
    { code: 'pending', label: 'Kutilmoqda' },
    { code: 'failed', label: 'Xato' },
  ];

  const methods = [
    { code: '', label: 'Barcha usullar' },
    { code: 'payme', label: 'Payme' },
    { code: 'click', label: 'Click' },
    { code: 'uzum', label: 'Uzum Bank' },
    { code: 'visa', label: 'Visa' },
    { code: 'mastercard', label: 'MasterCard' },
  ];

  if (loading && !stats) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(n => <div key={n} className="h-28 bg-white dark:bg-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
        <div className="h-96 bg-white dark:bg-white/5 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Muvaffaqiyatli To\'lovlar', 
      amount: stats?.completed_total || 0, 
      count: stats?.completed_count || 0,
      icon: CheckCircle2, 
      color: 'text-emerald-500'
    },
    { 
      title: 'Kutilayotgan', 
      amount: stats?.pending_total || 0, 
      count: stats?.pending_count || 0,
      icon: Clock, 
      color: 'text-amber-500'
    },
    { 
      title: 'Bekor Qilingan', 
      amount: stats?.failed_total || 0, 
      count: stats?.failed_count || 0,
      icon: XCircle, 
      color: 'text-rose-500'
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="text-violet-500" size={28} /> To&apos;lovlar
          </h1>
          <p className="text-slate-500 text-sm">Platformadagi barcha moliyaviy tranzaksiyalar tarixi</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={fetchPayments} className="hover:text-blue-500 transition-colors p-1" title="Yangilash">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <span>Oxirgi yangilanish: {lastUpdate}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-[#10101f] p-5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 ${card.color}`}>
                <Icon size={24} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-slate-500 truncate">{card.title}</span>
                <span className="text-xl font-black text-slate-800 dark:text-white truncate">
                  {card.amount.toLocaleString()} UZS
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{card.count} ta tranzaksiya</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20"
        >
          {statuses.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
        <select 
          value={methodFilter} 
          onChange={(e) => setMethodFilter(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-500/20"
        >
          {methods.map(m => <option key={m.code} value={m.code}>{m.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#10101f] border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-3">Tranzaksiya / Sana</th>
                <th className="px-6 py-3">To&apos;lovchi</th>
                <th className="px-6 py-3">Xizmat turi</th>
                <th className="px-6 py-3">Usul</th>
                <th className="px-6 py-3">Miqdor</th>
                <th className="px-6 py-3 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {loading && payments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Yuklanmoqda...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">To&apos;lovlar topilmadi.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300" title={p.transaction_id}>
                          {p.transaction_id.substring(0, 13)}...
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock size={10} /> {p.created_at}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-white text-sm">{p.user_name}</span>
                        <span className="text-xs text-slate-500">{p.user_phone || 'Telefon yo\'q'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      {p.property_title !== '—' ? (
                        <div className="max-w-[200px] truncate" title={p.property_title}>E&apos;lon: {p.property_title}</div>
                      ) : (
                        <span>Balans to&apos;ldirish</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-6 rounded flex items-center justify-center font-black text-[9px] uppercase
                          ${p.method === 'payme' ? 'bg-[#33cccc] text-white' : 
                            p.method === 'click' ? 'bg-[#00a1ff] text-white' : 
                            p.method === 'uzum' ? 'bg-[#7000ff] text-white' : 
                            'bg-slate-800 text-white'}`}
                        >
                          {p.method}
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{p.method_display}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-800 dark:text-white whitespace-nowrap">
                        {parseFloat(p.amount).toLocaleString()} UZS
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 size={12} /> {p.status_display}
                        </span>
                      ) : p.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 text-xs font-bold">
                          <Clock size={12} /> {p.status_display}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-xs font-bold">
                          <XCircle size={12} /> {p.status_display}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
