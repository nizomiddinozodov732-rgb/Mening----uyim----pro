'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/store/useStore';
import { ArrowLeft, Calendar, Eye, Share2 } from 'lucide-react';
import Link from 'next/link';

interface News {
  id: number;
  title: string;
  content: string;
  image: string | null;
  views: number;
  created_at: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get(`/dashboard/news/?id=${params.id}`);
        setNews(res.data);
      } catch (err) {
        console.error('Error loading news:', err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchNews();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 flex flex-col gap-6 animate-pulse-slow">
        <div className="h-8 bg-slate-200 dark:bg-white/5 rounded-xl w-32"></div>
        <div className="h-64 bg-slate-200 dark:bg-white/5 rounded-3xl w-full"></div>
        <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl w-3/4"></div>
        <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-xl w-1/4"></div>
        <div className="space-y-4 mt-8">
          <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-xl w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-xl w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-xl w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Yangilik topilmadi</h1>
        <p className="text-slate-500 mb-8">Siz qidirayotgan yangilik o'chirilgan yoki mavjud emas.</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
          Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 md:py-12 px-4 flex flex-col gap-6">
      <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold text-sm w-fit bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl">
        <ArrowLeft size={16} /> Bosh sahifa
      </Link>

      {news.image && (
        <div className="w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-white/10 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={news.image} 
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
          {news.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 dark:border-white/10 pb-6 mb-2">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">
            <Calendar size={16} className="text-blue-500" />
            {news.created_at}
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">
            <Eye size={16} className="text-emerald-500" />
            {news.views} marta o'qildi
          </div>
          <button className="ml-auto flex items-center gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
            <Share2 size={16} /> Ulashish
          </button>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
          {news.content}
        </div>
      </div>
    </div>
  );
}
