# "Mening Uyim" — Dizayn spetsifikatsiyasi

> **Versiya:** 1.0 · **Holat:** amalga oshirish uchun tayyor
> **Qamrov:** rang, tipografiya, radius, bo'shliq, soya, z-index, breakpointlar, barcha UI komponentlar va navigatsiya IA.
> **Manba fayllar:** [styles.css](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/styles.css) (yagona haqiqat manbasi), maketlar: [index.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/index.html), [home.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/home.html), [properties.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/properties.html), [chat.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/chat.html), [mobile.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/mobile.html).

---

## 1. Maqsad va tamoyillar

Bu spetsifikatsiya loyihadagi **vizual izchillikni** ta'minlash uchun yagona qoidalar to'plamidir. Har qanday yangi sahifa yoki komponent shu qoidalarga bo'ysunadi.

### 1.1. Dizayn tamoyillari

| № | Tamoyil | Amaliy ifodasi |
|---|---------|----------------|
| T1 | **Bitta haqiqat manbasi** | Barcha rang/o'lcham qiymatlar faqat CSS custom property (token) orqali. Hardcoded `#hex` yoki `text-slate-500` taqiqlanadi. |
| T2 | **Semantik nomlash** | Tokenlar maqsad bo'yicha nomlanadi (`--primary`, `--danger`), holat bo'yicha emas (`--blue-500` emas). |
| T3 | **Izchil rol → qiymat** | Har bir vizual rol (karta, tugma, modal) uchun **bitta** radius, **bitta** soya, **bitta** padding. |
| T4 | **Kontrast — majburiy** | Matn/fon kontrasti WCAG AA (≥4.5:1 oddiy matn, ≥3:1 katta matn). |
| T5 | **Barmoq-birinchi** | Interaktiv element ≤ 44×44px bo'lmaydi (mobil). |
| T6 | **Kam harakat** | Har bir vazifa 3 qadamdan oshmaydi; navigatsiya 5–7 banddan ko'p emas. |

---

## 2. Dizayn tokenlari

Barcha tokenlar `styles.css` → `:root` va `.dark` bloklarida e'lon qilinadi. Ishlab chiqarishda ular [globals.css](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/globals.css) ga to'g'ridan-to'g'ri ko'chiriladi.

### 2.1. Rang tokenlari (semantik)

| Token | Yorug' rejim | Qorong'u rejim | Ishlatilishi |
|-------|--------------|----------------|--------------|
| `--bg` | `#f4f6fb` | `#070b14` | Sahifa foni |
| `--bg-2` | `#eef1f8` | `#0c1120` | Ikkilamchi fon, hover |
| `--surface` | `#ffffff` | `#111a2c` | Karta, panel, input |
| `--surface-2` | `#f8faff` | `#0f172a` | Footer, ajratilgan blok |
| `--border` | `#e4e9f4` | `rgba(255,255,255,.08)` | Standart chegara |
| `--border-2` | `#cfd8ee` | `rgba(255,255,255,.14)` | Kuchliroq chegara |
| `--text` | `#0d1117` | `#eef2fa` | Asosiy matn |
| `--text-2` | `#46536b` | `#a3b1c9` | Ikkilamchi matn |
| `--text-3` | `#6d7c95` | `#78889f` | Uchinchi daraja (AA uchun quyuqlashtirilgan) |
| `--primary` | `#2563eb` | `#3b82f6` | Asosiy harakat |
| `--primary-h` | `#1d4ed8` | `#60a5fa` | Hover holati |
| `--primary-l` | `#e3edfe` | `rgba(59,130,246,.14)` | Faol fon, yorug' fon |
| `--accent` | `#6366f1` | `#818cf8` | Gradient urg'u |
| `--success` | `#10b981` | bir xil | Muvaffaqiyat, tasdiq |
| `--warning` | `#f59e0b` | bir xil | Ogohlantirish, kutilmoqda |
| `--danger` | `#ef4444` | bir xil | Xatolik, o'chirish, rad etish |
| `--info` | `#0ea5e9` | bir xil | Ma'lumot |
| `--ring` | `0 0 0 3px rgba(37,99,235,.28)` | `0 0 0 3px rgba(59,130,246,.35)` | Focus halqasi (AA) |

**Qoida:** gradient faqat `linear-gradient(135deg, var(--primary), var(--accent))` ko'rinishida (logo, hero, CTA). Boshqa gradient taqiqlanadi.

### 2.2. Tipografiya shkalasi (8 daraja)

Shrift: `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`.

| Token | O'lcham | Og'irlik | Klass | Ishlatilishi |
|-------|---------|----------|-------|--------------|
| `--fs-display` | 32px | 800 | `.t-display` | Hero sarlavha |
| `--fs-h1` | 24px | 800 | `.t-h1` | Sahifa sarlavhasi |
| `--fs-h2` | 20px | 700 | `.t-h2` | Bo'lim/karta sarlavhasi |
| `--fs-h3` | 16px | 700 | `.t-h3` | Kichik sarlavha |
| `--fs-body` | 14px | 400 | `.t-body` | Asosiy matn |
| `--fs-cap` | 12px | 400/600 | `.t-cap` | Ikkilamchi ma'lumot |
| `--fs-micro` | 11px | 700 | `.t-micro` | Badge, metka |

**Qoida:** jami 8 ta darajadan ko'p emas. Sarlavhalar `letter-spacing: -.01em` (display uchun `-.02em`), satr balandligi `1.2`; matn satr balandligi `1.55`.

### 2.3. Radius shkalasi (rolga qat'iy bog'langan)

| Token | Qiymat | Rol |
|-------|--------|-----|
| `--r-sm` | 8px | Badge, kichik chip, ichki element |
| `--r-md` | 12px | Input, tugma, icon-btn, avatar-thumb |
| `--r-lg` | 16px | Karta, media, dropdown |
| `--r-xl` | 24px | Modal, hero, katta panel, bottom sheet |
| `--r-full` | 999px | Avatar, pill, badge (dumaloq) |

**Qoida:** `rounded-lg/xl/2xl/3xl` aralashmasi **taqiqlanadi** — faqat shu 5 ta token.

### 2.4. Bo'shliq shkalasi (4px asosida)

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 20 · `--sp-6` 24 · `--sp-8` 32 · `--sp-10` 40 · `--sp-12` 48

| Kontekst | Qiymat |
|----------|--------|
| Karta ichki padding | 20px (`--sp-5`) |
| Karta ichida elementlar orasi | 8–12px |
| Bo'limlar orasi | 32–48px |
| Sahifa cheti (container) | 20px (mobil 16px) |

### 2.5. Soyalar

| Token | Ishlatilishi |
|-------|--------------|
| `--shadow-sm` | Karta (tinç holat) |
| `--shadow` | Dropdown, ko'tarilgan element |
| `--shadow-lg` | Karta hover, drawer |
| `--shadow-xl` | Modal, hero qidiruv satri, telefon ramkasi |

### 2.6. z-index ierarxiyasi (yagona)

| Token | Qiymat | Ishlatiladi |
|-------|--------|-------------|
| `--z-base` | 0 | Oddiy kontent |
| `--z-dropdown` | 40 | Navbar dropdown, kontekst menyu |
| `--z-sticky` | 50 | Navbar, sticky panel |
| `--z-overlay` | 100 | Mobil drawer foni (scrim) |
| `--z-modal` | 110 | **Barcha** modallar (shu jumladan qo'ng'iroq) |
| `--z-toast` | 120 | Bildirishnomalar |
| `--z-tooltip` | 130 | Tooltip |

**Qoida:** `z-[120]`, `z-50` kabi ad-hoc qiymatlar **taqiqlanadi**. Barcha modal `--z-modal` da.

---

## 3. Responsive breakpointlar

| Nom | Diapazon | Container | Grid | Navigatsiya | Filtrlar |
|-----|----------|-----------|------|-------------|----------|
| **Mobil** | ≤ 640px | 100% − 32px | 1 ustun | Drawer + bottom tab (5 band) | Bottom sheet |
| **Planshet** | 641–1024px | 100% − 40px | 2 ustun | Logo + drawer + asosiy havolalar | Yon panel (statik) |
| **Desktop** | > 1024px | 1200px | 3–4 ustun | Guruhlangan gorizontal | Sticky yon panel |

Amalga oshirish: `@media (max-width: 1024px)` va `@media (max-width: 640px)` — `styles.css` 8-bo'lim.

---

## 4. Navigatsiya IA (informatsion arxitektura)

### 4.1. Oldin (6 ta alohida havola)

`Bosh sahifa · Ko'chmas mulk · Materiallar · Ustalar · Arxitektorlar · Kalkulyator`

Muammo: gorizontal joy yetmaydi, kognitiv yuk ortiqcha, ustuvorlik yo'q.

### 4.2. Endi (3 ta guruh + CTA)

| Guruh | Ichida |
|-------|--------|
| Bosh sahifa | (yagona havola) |
| **Ko'chmas mulk ▾** | Sotib olish · Ijara · Hovli/Kottedj · Yer maydoni |
| **Xizmatlar ▾** | Ustalar · Arxitektorlar · Qurilish materiallari |
| Kalkulyator | (yagona havola) |
| Yangiliklar | (yagona havola) |
| **+ E'lon joylash** | Asosiy CTA |

- Desktop: dropdown (`--z-dropdown`), hover va `focus-within` bilan ochiladi (klaviatura uchun).
- Mobil: yon drawer (akkordeon guruhlar) + pastki 5 bandli tab panel.

---

## 5. Komponent spetsifikatsiyalari

### 5.1. Tugma (`.btn`)

| Variant | Fon | Matn | Ishlatilishi |
|---------|-----|------|--------------|
| `.btn-primary` | `--primary` | #fff | Asosiy harakat (bitta sahifada 1 ta dominant) |
| `.btn-outline` | shaffof + chegara | `--text-2` | Ikkilamchi |
| `.btn-ghost` | shaffof | `--text-2` | Uchinchi daraja, navigatsiya |
| `.btn-danger` | `--danger` | #fff | O'chirish, rad etish |
| `.btn-success` | `--success` | #fff | Qabul qilish |

O'lchamlar: standart balandlik **38px**, `.btn-sm` **32px**, `.btn-lg` **46px**. Radius `--r-md` (sm uchun `--r-sm`). Holatlar: hover (rang + `-1px` ko'tarilish), active (`+1px` bosilish), disabled (`opacity:.5`, `pointer-events:none`).

### 5.2. Maydon (`.field` + `.input/.select/.textarea`)

Balandlik 40px, radius `--r-md`, chegara `1.5px solid var(--border)`. Focus: `border-color: var(--primary)` + `box-shadow: var(--ring)`. Xato: `aria-invalid="true"` → chegara `--danger` + `.error-text`. Yorliq `.label` (12px/600), izoh `.hint` (12px `--text-3`).

### 5.3. Karta (`.card`)

Fon `--surface`, chegara `1px var(--border)`, radius `--r-lg`, padding 20px, soya `--shadow-sm`. `.card-hover`: hover'da chegara `--primary` 35% aralashmasi, soya `--shadow-lg`, `translateY(-3px)`. `.card-flat` — soyasiz.

### 5.4. Badge (`.badge`) va Chip (`.chip`)

- Badge: 11px/700, pill, ichki padding 3×9px. Variantlar: `badge-primary` (Yangi), `badge-success` (Tasdiqlangan), `badge-warning` (Kutilmoqda), `badge-danger` (Rad etilgan), neytral (default).
- Chip: 12px/600, pill, balandlik ~34px, filtr tanlovi uchun. `.chip-active` — to'liq `--primary` fon, oq matn.

### 5.5. Avatar (`.avatar`)

38px dumaloq, gradient fon (`--primary`→`--accent`), oq bosh harflar. O'lchamlar: `avatar-sm` 30px, `avatar-lg` 56px, `avatar-xl` 92px. `.dot-online` — 11px yashil nuqta, oq chegara bilan.

### 5.6. Modal (yagona pattern)

`.modal-backdrop` — `position:fixed; inset:0; z-index:var(--z-modal); rgba(8,12,22,.58)` + blur. `.modal-card` — `max-width:480px`, radius `--r-xl`, soya `--shadow-xl`, padding 24px, `animation: pop`. Yopish: fon bosilishi yoki ✕ tugmasi. Majburiy atributlar: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.

### 5.7. Toast (`.toast`)

`position:fixed; right/bottom:20px; z-index:var(--z-toast)`. Chap chegara 4px (`--success`/`--danger`/`--warning`) — tur bo'yicha rang.

### 5.8. Reyting (`.rating`) — yagona komponent

Yulduzlar 15×15px, rang `--warning`, `.rating-value` — qiymat 12px/700. Avvalgi 3 ta mustaqil implementatsiya o'rniga bitta.

### 5.9. Switch (`.switch`)

40×22px, pill. `aria-checked="true"` → `--primary` fon, tugma 18px o'ngga suriladi.

### 5.10. Bo'sh holat (`.empty`) va Skelet (`.skeleton`)

- Empty: markazlashgan ustun, `.empty-icon` 64px kvadrat (`--primary-l` fon), sarlavha + izoh + harakat tugmasi.
- Skeleton: shimmer animatsiyasi, yuklanish davrida kontent o'lchamini ushlab turadi.

### 5.11. Chat bubble (`.chat-bubble`)

`max-width:74%`, radius `--r-lg` (kiruvchi pastki-chap, chiquvchi pastki-o'ng `--r-sm`). `.in` — oq fon + chegara; `.out` — `--primary` fon, oq matn.

### 5.12. Qo'ng'iroq UI (`.call-stage`, `.call-btn`)

- `.call-stage` — to'liq ekran, `z-index:var(--z-modal)`, `rgba(8,12,22,.9)` + blur.
- `.call-video` — 16:9 (mobil 3:4), `.call-pip` — 104×76px kichik oyna.
- `.call-btn` — 56px dumaloq: `.mute` (shaffof-oq), `.mute.off` (kulrang), `.end` (qizil), `.accept` (yashil).
- 4 holat: kiruvchi, chiquvchi, ovozli (ulangan), video (ulangan).

### 5.13. Mobil komponentlar (yangi)

| Komponent | Spetsifikatsiya |
|-----------|-----------------|
| **Drawer** | Kenglik 80% (max 280px), chapdan suriladi, `translateX(-102%)` → `0`, `--z-overlay`/`--z-modal`, scrim bilan. |
| **Bottom tab** | 5 bandli grid, balandlik ~64px, faol band `--primary`, badge `--danger`. |
| **Bottom sheet** | Pastdan ochiladi, yuqori radius `--r-xl`, grip chizig'i 40×4px, `--z-modal`. |
| **Touch target** | Barcha interaktiv element ≥ 44×44px. |

---

## 6. Accessibility talablari (majburiy)

1. **Focus ko'rinishi:** `:focus-visible` → `box-shadow: var(--ring)`. Hech bir interaktiv elementda `outline:none` yolg'iz qoldirilmaydi.
2. **Kontrast:** `--text-3` AA uchun quyuqlashtirildi (`#8896ab` → `#6d7c95`).
3. **ARIA:** icon-only tugmalarda `aria-label`; modalda `role="dialog"` + `aria-modal`; switch'da `role="switch"` + `aria-checked`; input'da `<label>` yoki `aria-label`.
4. **Klaviatura:** dropdown `focus-within` bilan ochiladi; drawer/modal `Esc` bilan yopiladi.
5. **Harakat:** `prefers-reduced-motion` e'tiborga olinadi (animatsiyalar o'chiriladi).
6. **Semantik HTML:** `nav`, `main`, `footer`, `article`, `aside`; sarlavhalar ierarxiyasi h1→h2→h3.

---

## 7. Dark / Light rejim

- Almashtirish: `documentElement` ga `.dark` klassi (mavjud [ThemeProvider.tsx](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/components/ThemeProvider.tsx) bilan mos).
- Barcha ranglar token orqali — `.dark` blokida faqat o'zgaruvchilar qayta e'lon qilinadi, komponentlar o'zgarmaydi.
- Qorong'u rejimda `--border` `rgba(255,255,255,.08)` — chegara ko'rinishi saqlanadi.

---

## 8. Ishlab chiqishga o'tkazish (mapping)

| Mockup | Manba fayl | Izoh |
|--------|-----------|------|
| Tokenlar + komponentlar | `styles.css` §1–5 | `globals.css` ga to'g'ridan-to'g'ri ko'chiriladi |
| Navigatsiya | [Navbar.tsx](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/components/Navbar.tsx) | `NAV` massivini 3 guruhga qayta tuzish |
| Footer | [Footer.tsx](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/components/Footer.tsx) | Admin havolalari alohida bo'limga (orphan sahifa muammosi) |
| Chat + qo'ng'iroq | [chat/page.tsx](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/chat/page.tsx) | Modal holatlarini `--z-modal` ga keltirish |
| Responsive | barcha sahifalar | Tailwind breakpointlari shu jadvalga moslashadi |

### 8.1. Birinchi navbatdagi refaktoring qadamlari

1. `globals.css` dagi hardcoded ranglarni (`text-slate-*`, `bg-white dark:bg-[#...]`) tokenlarga o'tkazish.
2. 3 ta reyting, 5 ta modal, 4 ta tugma, 6 ta karta implementatsiyasini bitta komponentga birlashtirish.
3. z-index qiymatlarini `--z-*` tokenlariga keltirish.
4. Radiuslarni 5 ta semantik tokenga cheklash.
5. Mobil navigatsiya (drawer + bottom tab) ni qo'shish.

---

## 9. Design QA checklist

- [ ] Hardcoded rang yo'q — hammasi token orqali.
- [ ] Radius faqat 5 ta tokendan.
- [ ] z-index faqat `--z-*` tokendan.
- [ ] Har bir interaktiv elementda `:focus-visible` holati.
- [ ] Barcha icon-only tugmalarda `aria-label`.
- [ ] Modal `role="dialog"` + `aria-modal="true"`.
- [ ] Touch target ≥ 44px (mobil).
- [ ] Kontrast AA dan o'tadi (light + dark).
- [ ] ≤640px / 641–1024px / >1024px da buzilish yo'q.
- [ ] Empty + loading (skeleton) + error holatlari mavjud.
