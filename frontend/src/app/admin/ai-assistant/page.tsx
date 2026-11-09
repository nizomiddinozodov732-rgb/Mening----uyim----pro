'use client';

import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import {
  Bot, Send, RotateCcw, Sparkles, User, Loader2, Copy, Check,
  TrendingUp, Users, Building2, AlertTriangle, Brain,
  BarChart3, MessageSquare, Lightbulb, ShieldAlert, Activity,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

function uid() { return Math.random().toString(36).slice(2); }
function now() { return new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }); }

// ─── Admin-specific AI responses ───────────────────────────────────────────────
function getAdminResponse(msg: string): string {
  const t = msg.toLowerCase();
  if (t.match(/foydalanuvchi|user/))
    return "👥 **Foydalanuvchilar tahlili:**\n\nTizimingizda faollik darajasini oshirish uchun:\n1. **Yangi ro'yxatdan o'tganlar** — birinchi 24 soatda email jo'nating\n2. **Faol bo'lmaganlar** — 7 kundan keyin eslatma\n3. **Verified foydalanuvchilar** — maxsus imkoniyatlar bering\n\n📊 `/admin/users` sahifasida batafsil statistika ko'ring.";
  if (t.match(/e'lon|mulk|property/))
    return "🏠 **E'lonlar boshqaruvi:**\n\nE'lonlarni optimallashtirish:\n1. **Moderatsiya vaqti** — 24 soat ichida ko'rib chiqing\n2. **Premium e'lonlar** — oldinga chiqarilsin\n3. **Eskirgan e'lonlar** — 30 kundan keyin ogohlantirib archiv qiling\n\n📌 Shikoyat ko'p kelgan e'lonlarni tekshiring!";
  if (t.match(/daromad|revenue|pul|to'lov/))
    return "💰 **Daromad tahlili:**\n\nDaromadni oshirish yo'llari:\n1. **Subscription narxini** optimizatsiya qiling\n2. **Premium e'lon xizmati** qo'shing (oy 300k UZS)\n3. **Reklama bannerlari** sotish (haftalik 500k UZS)\n4. **Ko'plama chegirma** sxemalari yarating\n\n📈 `/admin/revenue` da to'liq tahlil ko'ring.";
  if (t.match(/shikoyat|complaint/))
    return "⚠️ **Shikoyatlar menejment:**\n\nShikoyatlarni tez hal qilish:\n1. **24 soat qoidasi** — har bir shikoyat 24 soatda ko'rib chiqilsin\n2. **Qayta shikoyat** — ikkinchi marta kelib tushganda foydalanuvchi ban\n3. **Yolg'on shikoyat** — jo'natuvchiga ogohlantirish\n\n🔴 Kutayotgan shikoyatlar: `/admin/complaints`";
  if (t.match(/security|xavfsizlik|ip|ban/))
    return "🔒 **Xavfsizlik tavsiyalari:**\n\n1. **Brute force** — bir IP dan 5 marta noto'g'ri kirish = avtoblok\n2. **Shubhali faoliyat** — bir foydalanuvchi 100+ e'lon/kun = tekshirish\n3. **API rate limit** — 1 daqiqada 60 so'rovdan oshsa bloklash\n4. **Admin log** — barcha admin harakatlarini kuzating\n\n🛡️ `/admin/security` sahifasida sozlang.";
  if (t.match(/statistik|analitika|analytics|tahlil/))
    return "📊 **Platforma Tahlili:**\n\n**Muhim KPI-lar:**\n- DAU (Kunlik faol foydalanuvchilar)\n- MAU (Oylik faol foydalanuvchilar)\n- E'lon konversiya koeffitsienti\n- O'rtacha sessiya davomiyligi\n- Bounce rate\n\n💡 Bu ko'rsatkichlarni haftalik kuzatib boring.";
  if (t.match(/marketing|reklama|banner|promo/))
    return "📣 **Marketing tavsiyalari:**\n\n1. **Mavsumiy aksiyalar** — Navro'z, yangi yil, yoz\n2. **Referral dastur** — har bir yangi foydalanuvchi uchun bonus\n3. **Email newsletter** — haftalik eng yaxshi e'lonlar\n4. **Promo kodlar** — birinchi e'lon uchun 20% chegirma\n\n🎯 `/admin/marketing` da boshqaring.";
  if (t.match(/server|tizim|system/))
    return "🖥️ **Server holati:**\n\n**Kuzatish kerak bo'lgan parametrlar:**\n- CPU: 80% dan oshmasin\n- RAM: 85% dan oshmasin\n- Disk: 90% dan oshmasin\n- API javob vaqti: 200ms dan kam\n\n⚡ `/admin/system` sahifasida real-vaqt monitoring ko'ring.";
  if (t.match(/maslahat|yordam|help|nima|qanday/))
    return "💡 **Admin panel bo'yicha yordam:**\n\nBunday so'rash mumkin:\n- **\"Foydalanuvchilar tahlili\"** — statistika va tavsiyalar\n- **\"Daromadni oshirish\"** — monetizatsiya g'oyalari\n- **\"Shikoyatlarni hal qilish\"** — jarayonni optimallashtirish\n- **\"Xavfsizlik tavsiyalari\"** — tizim himoyasi\n- **\"Marketing g'oyalari\"** — foydalanuvchilarni jalb qilish\n- **\"Server monitoring\"** — texnik holat";
  return "🤖 Bu savol bo'yicha aniqroq javob bera olmayman.\n\n**Maslahat so'rash mumkin bo'lgan mavzular:**\n- Foydalanuvchilar tahlili\n- Daromad oshirish yo'llari\n- Shikoyat menejment\n- Xavfsizlik\n- Marketing\n- Server holati\n\nBirini yozing!";
}

const QUICK = [
  { icon: Users,         text: 'Foydalanuvchilar tahlili' },
  { icon: TrendingUp,    text: 'Daromadni oshirish' },
  { icon: AlertTriangle, text: 'Shikoyat menejment' },
  { icon: ShieldAlert,   text: 'Xavfsizlik tavsiyalari' },
  { icon: BarChart3,     text: 'Statistik tahlil' },
  { icon: MessageSquare, text: 'Marketing g\'oyalari' },
];

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-400 underline">$1</a>')
    .replace(/\n/g, '<br/>');
}

export default function AdminAIPage() {
  const { user } = useStore();
  const [messages, setMessages] = useState<Message[]>([{
    id: uid(), role: 'assistant', time: now(),
    content: `Assalomu alaykum, **${user?.first_name || 'Admin'}**! 🤖\n\nMen platforma AI yordamchisiman. Sizga **tahlil**, **tavsiyalar** va **strategik qarorlar** qabul qilishda yordam beraman.\n\nQuyidagi mavzulardan birini tanlang yoki o'z savolingizni yozing!`,
  }]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [copied,  setCopied]  = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (parent) parent.scrollTop = parent.scrollHeight;
  }, [messages, typing]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    setMessages(p => [...p, { id: uid(), role: 'user', content: msg, time: now() }]);
    setTyping(true);
    await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
    setMessages(p => [...p, { id: uid(), role: 'assistant', content: getAdminResponse(msg), time: now() }]);
    setTyping(false);
  };

  const copy = (id: string, c: string) => {
    navigator.clipboard.writeText(c).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };

  const reset = () => setMessages([{ id: uid(), role: 'assistant', time: now(), content: "Suhbat tozalandi. Yangi savolingizni yozing! 🚀" }]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain size={26} className="text-violet-500" /> AI Yordamchi
          </h1>
          <p className="text-slate-500 text-sm mt-1">Platforma uchun aqlli tavsiyalar va tahlil</p>
        </div>
        <button onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
          <RotateCcw size={15} /> Yangi suhbat
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick actions sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Tez so'rash</p>
          {QUICK.map(({ icon: Icon, text }) => (
            <button key={text} onClick={() => send(text)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[#10101f] border border-slate-100 dark:border-white/5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all text-left group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-violet-100 dark:group-hover:bg-violet-500/10 transition-all shrink-0">
                <Icon size={15} />
              </div>
              {text}
            </button>
          ))}

          {/* AI info card */}
          <div className="mt-2 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-500/10 dark:to-indigo-500/10 border border-violet-200 dark:border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-violet-500" />
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400">AI quvvati</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Platforma ma'lumotlari asosida tahlil va tavsiyalar taqdim etadi. Real vaqt rejimida ishlaydi.
            </p>
          </div>
        </div>

        {/* Chat window */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-[#10101f] rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden" style={{ height: '70vh', minHeight: '500px' }}>

          {/* Chat header */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800 dark:text-white">Platforma AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-xs text-slate-400">Faol • Doim javob beradi</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
              <Activity size={12} className="text-violet-500" />
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">AI POWERED</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  m.role === 'assistant'
                    ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                    : 'bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10'
                }`}>
                  {m.role === 'assistant'
                    ? <Bot size={15} className="text-white" />
                    : <User size={15} className="text-slate-500 dark:text-slate-400" />}
                </div>
                <div className={`group flex flex-col gap-1 max-w-[80%] ${m.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-white/5 rounded-tl-sm'
                  }`} dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400">{m.time}</span>
                    {m.role === 'assistant' && (
                      <button onClick={() => copy(m.id, m.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                        {copied === m.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-white" />
                </div>
                <div className="px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 dark:border-white/5">
            <form onSubmit={e => { e.preventDefault(); send(); }}
              className="flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Savol yozing... (masalan: daromadni qanday oshirish mumkin?)"
                className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all"
              />
              <button type="submit" disabled={!input.trim() || typing}
                className="w-12 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-lg shadow-violet-600/20">
                {typing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
