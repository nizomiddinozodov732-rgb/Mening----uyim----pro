'use client';

import { useState, useEffect } from 'react';
import { api } from '@/store/useStore';
import { ShieldCheck, Search, ShieldX } from 'lucide-react';

interface User {
  id: number;
  name: string;
  profession: string;
  profession_code: string;
  rating: number;
  is_verified: boolean;
  joined: string;
}

export default function VerifiedCenter() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    api.get(`/dashboard/verified-center/?profession=${filter}`)
      .then(res => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const toggleVerified = async (id: number) => {
    try {
      const res = await api.patch('/dashboard/verified-center/', { user_id: id });
      if (res.data.success) {
        setUsers(users.map(u => u.id === id ? { ...u, is_verified: res.data.is_verified } : u));
      }
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi');
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="text-blue-500" /> Verified Markazi
        </h1>
        <p className="text-sm text-slate-500 mt-1">Foydalanuvchilarga rasmiy ishonch belgisini berish</p>
      </div>

      <div className="glass p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {['', 'seller', 'builder', 'repairman', 'architect'].map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === p 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              {p === '' ? 'Barchasi' : p === 'seller' ? 'Sotuvchilar' : p === 'builder' ? 'Quruvchilar' : p === 'repairman' ? "Ta'mirlovchilar" : 'Arxitektorlar'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Ism bo'yicha qidiruv..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl glass-input text-sm"
          />
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="p-4 font-semibold">Foydalanuvchi</th>
                  <th className="p-4 font-semibold">Kasb</th>
                  <th className="p-4 font-semibold">Reyting</th>
                  <th className="p-4 font-semibold">Sana</th>
                  <th className="p-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Topilmadi</td></tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="p-4 font-bold flex items-center gap-2">
                      {u.name}
                      {u.is_verified && <ShieldCheck size={16} className="text-blue-500" />}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{u.profession}</td>
                    <td className="p-4 font-mono font-medium">{u.rating.toFixed(1)}</td>
                    <td className="p-4 text-xs text-slate-500">{u.joined}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleVerified(u.id)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ml-auto ${
                          u.is_verified 
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20'
                        }`}
                      >
                        {u.is_verified ? <><ShieldX size={14} /> Olib tashlash</> : <><ShieldCheck size={14} /> Belgilash</>}
                      </button>
                    </td>
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
