'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, Sparkles, User, Loader2, RotateCcw, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

// ─── built-in cavob logikasi (backend AI yo'q bo'lsa) ─────────────────────────
const RESPONSES: Record<string, string> = {
  salom: "Assalomu alaykum! 👋 Men **Mening Uyim** AI yordamchisiman. Sizga qanday yordam bera olaman?\n\n📌 So'rash mumkin:\n- Ko'chmas mulk narxlari\n- Qurilish materiallari\n- Ustalar va arxitektorlar\n- Kalkulyator\n- Sayt bo'yicha yordam",
  uy: "🏠 **Uy sotib olish bo'yicha maslahat:**\n\n1. **Narx tekshiring** — bozor o'rtacha narxini solishtiring\n2. **Joylashuvni baholang** — infratuzilma, transport, maktab yaqinligi\n3. **Hujjatlarni tekshiring** — kadastr raqami, egasi, yuklar yo'qligi\n4. **Texnik ko'rikdan o'tkizing** — devorlar, tom, kommunikatsiyalar\n\n👉 [Ko'chmas mulklarni ko'rish](/properties)",
  kvartira: "🏢 **Kvartira izlash bo'yicha:**\n\nToshkentda o'rtacha narxlar (2026):\n- 1 xonali: 60–100 mln UZS\n- 2 xonali: 100–180 mln UZS\n- 3 xonali: 180–300 mln UZS\n\n💡 Yangi qurilish vs ikkilamchi bozorni solishtirib ko'ring.\n\n👉 [Kvartiralarni ko'rish](/properties?type=apartment)",
  narx: "💰 **Narx haqida:**\n\nUy narxiga ta'sir etuvchi omillar:\n- 📍 Joylashuv (tuman, ko'cha)\n- 📐 Maydon (m²)\n- 🏗️ Qurilish yili va holati\n- 🔧 Ta'mir darajasi\n- 🚇 Transportga yaqinlik\n\nAniq narx hisoblash uchun **Kalkulyator**dan foydalaning 👇",
  material: "🧱 **Qurilish materiallari:**\n\nEng ko'p ishlatiladigan materiallar:\n- **Sement**: 70 000–90 000 UZS/qop\n- **G'isht**: 800–1200 UZS/dona\n- **Armirovka**: 12 000–15 000 UZS/kg\n- **Temir**: bozor narxiga ko'ra\n\n📦 [Barcha materiallarni ko'rish](/materials)",
  usta: "🔨 **Usta topish bo'yicha:**\n\nSifatli usta tanlash qoidalari:\n1. ✅ Reytingini tekshiring (5 yulduz tizimi)\n2. 💬 Avvalgi mijozlar sharhlarini o'qing\n3. 📋 Portfolio va tajribasini ko'ring\n4. 💰 Narxlarni solishtirib ko'ring\n\n👉 [Barcha ustalarni ko'rish](/workers)",
  arxitektor: "✏️ **Arxitektor tanlash:**\n\nYaxshi arxitektor uchun:\n- Kamida 5 yil tajriba\n- Portfolio namunalari\n- Litsenziya mavjudligi\n- Aloqa bog'lash qulayligi\n\n👉 [Arxitektorlarni ko'rish](/architects)",
  kalkulator: "🧮 **Qurilish kalkulyatori:**\n\nMening Uyim kalkulyatori bilan hisoblang:\n- 🏗️ Yangi uy qurilishi xarajati\n- 🔧 Ta'mirlash (remont) narxi\n- 📊 Detal breakdown: poydevor, devorlar, tom, pardozlash\n\n💡 Economy, Standard, Premium sifat darajalarida hisoblash mumkin.\n\n👉 [Kalkulyatorga o'tish](/calculator)",
  ijara: "🏠 **Ijara bo'yicha maslahat:**\n\nToshkentda o'rtacha oylik ijara (2026):\n- 1 xonali: 3–6 mln UZS/oy\n- 2 xonali: 5–10 mln UZS/oy\n- 3 xonali: 8–15 mln UZS/oy\n\n📋 Shartnoma tuzishni unutmang!\n\n👉 [Ijara e'lonlarini ko'rish](/properties?type=rental)",
  default: "🤔 Tushundim! Ammo bu mavzu bo'yicha batafsil ma'lumot berishim qiyin.\n\nSiz bunday so'rashingiz mumkin:\n- **\"Uy sotib olish\"** — maslahat\n- **\"Kvartira narxi\"** — taxminiy narxlar\n- **\"Usta topish\"** — qanday tanlash\n- **\"Kalkulyator\"** — xarajat hisoblash\n- **\"Material narxlari\"** — qurilish materiallari\n\nYoki to'g'ridan-to'g'ri [e'lonlarni ko'ring](/properties) 👈",
};

function getResponse(msg: string): string {
  const text = msg.toLowerCase();
  if (text.match(/salom|assalom|xayr|yordam/)) return RESPONSES.salom;
  if (text.match(/kvartira|flat|xonadon/)) return RESPONSES.kvartira;
  if (text.match(/uy|house|kottedj|hovli/)) return RESPONSES.uy;
  if (text.match(/narx|pul|sum|cost|qancha/)) return RESPONSES.narx;
  if (text.match(/material|sement|g'isht|gisht|temir|qurilish/)) return RESPONSES.material;
  if (text.match(/usta|master|quruvchi|ta'mir|tamir/)) return RESPONSES.usta;
  if (text.match(/arxitektor|dizayn|loyiha/)) return RESPONSES.arxitektor;
  if (text.match(/kalkulator|hisob|smeta|xarajat/)) return RESPONSES.kalkulator;
  if (text.match(/ijara|rent|ijaraga/)) return RESPONSES.ijara;
  return RESPONSES.default;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function now() {
  return new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

// simple markdown renderer: **bold**, *italic*, line breaks, [link](url)
function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-400 underline hover:text-blue-300">$1</a>')
    .replace(/\n/g, '<br/>');
}

const SUGGESTIONS = [
  "Uy sotib olish maslahat",
  "Kvartira narxlari",
  "Usta topish",
  "Kalkulyator",
];

export default function AIAssistant() {
  const [open,     setOpen]     = useState(false);
  const [mini,     setMini]     = useState(false);
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: 'assistant',
      content: "Assalomu alaykum! 👋 Men **Mening Uyim** AI yordamchisiman.\n\nKo'chmas mulk, qurilish, ustalar yoki sayt bo'yicha savollaringizga javob beraman!",
      time: now(),
    },
  ]);
  const [typing,  setTyping]   = useState(false);
  const [copied,  setCopied]   = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (parent) parent.scrollTop = parent.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (open && !mini) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, mini]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');

    const userMsg: Message = { id: uid(), role: 'user', content: msg, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // simulate delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

    const reply = getResponse(msg);
    setMessages(prev => [...prev, { id: uid(), role: 'assistant', content: reply, time: now() }]);
    setTyping(false);
  };

  const copyMsg = (id: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const reset = () => {
    setMessages([{
      id: uid(), role: 'assistant',
      content: "Suhbat tozalandi. Yangi savolingizni yozing! 😊",
      time: now(),
    }]);
  };

  /* ── floating button ─────────────────────────────────────────── */
  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-600/40 hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center group"
      aria-label="AI Yordamchi"
    >
      <Bot size={26} />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
      {/* tooltip */}
      <span className="absolute right-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
        AI Yordamchi
      </span>
    </button>
  );

  /* ── chat window ─────────────────────────────────────────────── */
  return (
    <div className={`
      fixed bottom-6 right-6 z-50 flex flex-col rounded-3xl overflow-hidden
      bg-[var(--surface)] border border-[var(--border)] shadow-2xl shadow-black/20
      transition-all duration-300
      ${mini ? 'w-72 h-16' : 'w-[360px] sm:w-[400px] h-[560px]'}
    `}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Bot size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">AI Yordamchi</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <p className="text-blue-100 text-[10px] font-medium">Doim tayyor</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={reset}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all"
            title="Tozalash">
            <RotateCcw size={14} />
          </button>
          <button onClick={() => setMini(!mini)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all">
            {mini ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all">
            <X size={14} />
          </button>
        </div>
      </div>

      {!mini && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  m.role === 'assistant'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-[var(--bg-2)] border border-[var(--border)]'
                }`}>
                  {m.role === 'assistant'
                    ? <Bot size={14} className="text-white" />
                    : <User size={14} className="text-[var(--text-3)]" />}
                </div>

                {/* Bubble */}
                <div className={`group flex flex-col gap-1 max-w-[78%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-[var(--bg-2)] text-[var(--text)] border border-[var(--border)] rounded-tl-sm'
                  }`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                  />
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-[var(--text-3)]">{m.time}</span>
                    {m.role === 'assistant' && (
                      <button onClick={() => copyMsg(m.id, m.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-3)] hover:text-[var(--text)]">
                        {copied === m.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="px-4 py-3 bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 bg-[var(--text-3)] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="px-3 py-1.5 rounded-full bg-[var(--primary-l)] text-[var(--primary)] text-xs font-semibold whitespace-nowrap border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all shrink-0 flex items-center gap-1">
                  <Sparkles size={10} />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl px-4 py-2.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Savol yozing..."
                className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder-[var(--text-3)] outline-none"
              />
              <button type="submit" disabled={!input.trim() || typing}
                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shrink-0">
                {typing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
