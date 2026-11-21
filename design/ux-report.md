# "Mening Uyim" — Foydalanuvchi tajribasi (UX) hisoboti

> **Versiya:** 1.0 · **Metod:** evristik baholash (kod va interfeys auditi) + foydalanuvchi sinovi rejasi
> **Tegishli hujjat:** [Dizayn spetsifikatsiyasi](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/design-spec.md)
> **Maketlar:** [index](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/index.html) · [home](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/home.html) · [properties](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/properties.html) · [chat](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/chat.html) · [mobile](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/mobile.html)

---

## 1. Xulosa

Loyihaning `frontend/src` kodi (46+ sahifa/komponent) tahlil qilindi. Interfeys funksional jihatdan to'liq, biroq **vizual izchillik, javobgar (responsive) dizayn va accessibility** sohalarida tizimli muammolar aniqlandi. Ular **dizayn tizimi joriy etilmaganligi** natijasidir: har bir sahifa o'z rangini, o'lchamini va komponentini qo'lda yozgan.

| Soha | Holat (audit) | Yechim |
|------|---------------|--------|
| Vizual izchillik | Hardcoded qiymatlar ustunlik qiladi | Dizayn tokenlari + yagona komponentlar |
| Navigatsiya | 6 ta teng huquqli havola, ustuvorlik yo'q | 3 guruh + CTA, mobil drawer + bottom tab |
| Javobgar dizayn | Gridlar buziladi, touch o'lchamlar kichik | 3 breakpoint, 44px touch, bottom sheet |
| Accessibility | `aria-label` deyarli yo'q, focus holatlari sust | AA kontrast, focus halqasi, ARIA |

---

## 2. Metodologiya

**2.1. Kod/Interfeys auditi.** `frontend/src` bo'ylab izchillik namunalarini qidirish (regex-grep) asosida miqdoriy dalillar to'plandi. Quyida har bir topilma **o'lchangan** natija bilan asoslangan.

**2.2. Evristik baholash.** Nielsenning 10 ta evristikasi bo'yicha interfeys baholandi (§6).

**2.3. Foydalanuvchi sinovi.** Ishlab chiqarishdan oldin o'tkazish uchun *tayyor reja va mezonlar* tuzildi (§7). Haqiqiy ishtirokchilar bilan sinov natijalari ushbu reja bo'yicha yig'iladi — bu bosqichda natijalar **to'qib qo'yilmagan**.

---

## 3. Foydalanuvchi ehtiyojlari

### 3.1. Foydalanuvchi guruhlari

| Persona | Maqsadi (Job-to-be-done) | Asosiy og'riq nuqtasi |
|---------|--------------------------|------------------------|
| **Xaridor (Alisher, 32)** | Mos uyni tez topish, sotuvchi bilan bog'lanish | Ko'p filtrlar, natijalarni taqqoslash qiyin |
| **Sotuvchi (Nodira, 45)** | E'lon joylash, xaridor bilan muloqot | E'lon joylash jarayoni uzun, javoblarni kuzatish qiyin |
| **Usta/Arxitektor (Bekzod, 28)** | Buyurtma topish, mijoz bilan gaplashish | Profil ko'rinmasligi, chat/qo'ng'iroq holati noaniq |
| **Mobil foydalanuvchi (Dilnoza, 24)** | Yo'lda tez qidirish va yozishish | Kichik tugmalar, buzilgan layout, sekin navigatsiya |

### 3.2. Ehtiyojlardan kelib chiqqan talablar

| № | Ehtiyoj | Talab |
|---|---------|-------|
| E1 | Tez tushunish | Bir qarashda guruhlangan navigatsiya (≤ 5 band) |
| E2 | Tez harakat | Har bir vazifa ≤ 3 qadam |
| E3 | Ishonch | Holat ko'rinishi: yuklanish, bo'sh, xato — hammasi aniq |
| E4 | Qulaylik (mobil) | ≥ 44px touch, bir ustunli layout |
| E5 | Barqarorlik | Barcha sahifalarda bir xil tugma/karta/modal |
| E6 | Inklyuzivlik | Klaviatura, ekran o'quvchi, kontrast (AA) |

---

## 4. Audit natijalari (miqdoriy dalillar)

Topilmalar jiddiyligiga ko'ra tartiblangan. "Dalil" ustunidagi raqamlar `frontend/src` da o'lchangan.

| № | Topilma | Jiddiylik | Dalil (o'lchangan) |
|---|---------|-----------|--------------------|
| F1 | **Hardcoded ranglar** — `text-slate-*` tokenlar o'rniga | 🔴 Yuqori | **653** ta holat, **27** ta faylda |
| F2 | **Dark-rejim hardcoded** — `dark:bg-[#...]` | 🔴 Yuqori | **40** ta holat, **10** ta faylda |
| F3 | **Radius nomuvofiqligi** — `rounded-2xl/3xl` shkalada yo'q | 🟠 O'rta | **233** ta holat, **43** ta faylda |
| F4 | **z-index ziddiyati** — `z-[120]`, `z-50` ad-hoc qiymatlar | 🔴 Yuqori | **18** ta holat, **11** ta faylda |
| F5 | **Dublikat komponentlar** — reyting (3×), modal (5×), tugma (4×), karta (6×) | 🟠 O'rta | `RatingStars.tsx`, `RatingSection.tsx`, `PropertyRatingModal.tsx` alohida mavjud |
| F6 | **Accessibility bo'shlig'i** — `aria-label` deyarli yo'q | 🔴 Yuqori | `aria-label` jami **5** ta, faqat **4** faylda (46+ faylga nisbatan) |
| F7 | **Navigatsiya yuki** — 6 ta teng huquqli gorizontal havola | 🟠 O'rta | [Navbar.tsx](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/components/Navbar.tsx) `NAV` massivi — 6 element |
| F8 | **Yetim (orphan) sahifa** — `news/[id]` bor, ro'yxati yo'q | 🟡 Past | `news/[id]/page.tsx` mavjud, `news/page.tsx` yo'q |
| F9 | **Admin havolalari ochiq joyda** — footer'da | 🟠 O'rta | [Footer.tsx](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/components/Footer.tsx) `admin` guruhi — 3 havola |
| F10 | **Bo'sh/yuklanish holatlari izchil emas** | 🟡 Past | Ayrim sahifalarda skeleton/empty yo'q |

**Ustuvorlik:** F1, F2, F4, F6 — birinchi navbatda tuzatiladi (vizual izchillik va inklyuzivlikka to'g'ridan-to'g'ri ta'sir).

---

## 5. Yechimlar va ularning asoslanishi

Har bir yechim aniq foydalanuvchi ehtiyojiga (E1–E6) bog'lanadi.

### 5.1. Dizayn tokenlari tizimi

**Muammo:** F1, F2, F3 — izchillik yo'qligi.
**Yechim:** Barcha rang/o'lcham/radius/soya **CSS custom property** sifatida. Komponentlar faqat tokenlarga murojaat qiladi.
**Asos (E5):** Bir joyda o'zgartirish butun ilovaga tarqaladi; foydalanuvchi barcha sahifada bir xil ko'rinishni ko'radi.
**Dalil:** `styles.css` §1–5.

### 5.2. Navigatsiya IA soddalashtirish

**Muammo:** F7 — 6 ta havola, kognitiv yuk.
**Yechim:** 3 guruh ("Ko'chmas mulk ▾", "Xizmatlar ▾") + Kalkulyator + Yangiliklar + CTA. Mobil uchun drawer + bottom tab.
**Asos (E1, E2):** Miller qonuni — 7±2 emas, vizual guruhlash orqali kamaytirish. Foydalanuvchi 2 bosishda istalgan bo'limga yetadi.
**Dalil:** [home.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/home.html#L42-L67), [mobile.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/mobile.html).

### 5.3. Yagona komponentlar

**Muammo:** F5 — 3× reyting, 5× modal, 4× tugma, 6× karta.
**Yechim:** Har rol uchun bitta komponent: `.rating`, `.modal-card`, `.btn`, `.card`.
**Asos (E5):** Bir xil element turli sahifada turli ko'rinmaydi; foydalanuvchi o'rganish yuki kamayadi.
**Dalil:** `styles.css` §5.

### 5.4. z-index ierarxiyasi

**Muammo:** F4 — modal/toast qatlamlari to'qnashadi (modal ustidan modal, toast ko'rinmay qolishi).
**Yechim:** 7 darajali yagona shkala; barcha modal `--z-modal` (110).
**Asos (E3):** Holat ko'rinishi buzilmaydi — bildirishnoma doim foydalanuvchi ko'z oldida.

### 5.5. Javobgar dizayn

**Muammo:** mobil layout buzilishi, kichik touch.
**Yechim:** 3 breakpoint; mobilda 1 ustun, drawer + bottom tab, filtrlar bottom sheet, touch ≥ 44px.
**Asos (E4):** Mobil trafik odatda ustun; barmoq bilan aniq bosish.
**Dalil:** [mobile.html](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/mobile.html).

### 5.6. Accessibility qatlami

**Muammo:** F6 — ARIA yo'q, focus sust.
**Yechim:** `:focus-visible` halqasi, `aria-label` (icon-only), `role="dialog"/"switch"`, AA kontrast (`--text-3` quyuqlashtirildi).
**Asos (E6):** Klaviatura va ekran o'quvchi foydalanuvchilari uchun inklyuzivlik.

### 5.7. Holatlar (empty/loading/error)

**Muammo:** F10.
**Yechim:** `.empty`, `.skeleton` komponentlari majburiy.
**Asos (E3):** Foydalanuvchi tizim "o'ylayotganini" yoki natija yo'qligini tushunadi.

---

## 6. Evristik baholash (Nielsen 10 ta)

| Evristika | Oldin | Yechimdan keyin |
|-----------|-------|-----------------|
| 1. Tizim holati ko'rinishi | Skeleton/loading izchil emas | `.skeleton`, `.empty`, spinner standart |
| 2. Tizim ↔ real dunyo mosligi | O'zbekcha atamalar izchil, lekin "PRO", "call log" aralashgan | Yagona o'zbekcha lug'at |
| 3. Nazorat va erkinlik | Modal yopilishi noaniq | Barcha modal `Esc` + fon bosish + ✕ |
| 4. Izchillik va standartlar | ❌ Past (F1–F5) | ✅ Token + yagona komponentlar |
| 5. Xatolarning oldini olish | `aria-invalid` bor, lekin nomuvofiq | Standart `.error-text` + inline validatsiya |
| 6. Esga solish o'rniga tanib olish | Navigatsiya yuki ortiq | Guruhlash + breadcrumb |
| 7. Moslashuvchanlik va samaradorlik | Filtrlar har safar qayta kiritiladi | Faol filtr badge'lari, saqlash |
| 8. Estetik va minimalist dizayn | Hardcoded ranglar, ortiqcha bezak | Tokenli, sokin palitra |
| 9. Xatoni aniqlash va tuzatish | Umumiy xato matni | Aniq `.error-text` xabarlar |
| 10. Yordam va hujjat | Yo'q | Bo'sh holatlarda yo'naltiruvchi matn |

---

## 7. Foydalanuvchi sinovi rejasi

> Quyida sinovni o'tkazish uchun **tayyor reja** keltiriladi. Natijalar haqiqiy ishtirokchilar bilan to'ldiriladi (o'lchov ustunlari bo'sh).

### 7.1. Ishtirokchilar

- **Kim:** 5–8 ishtirokchi — 3 xaridor, 2 sotuvchi, 2 usta, 1 mobil foydalanuvchi.
- **Mezon:** kamida 50% mobil qurilmadan.
- **Usul:** moderatsiyalangan, "o'ylab gapirish" (think-aloud), ekran + yuz yozuvi.

### 7.2. Vazifalar (task-based)

| № | Vazifa | Bog'liq yechim | Muvaffaqiyat mezoni |
|---|--------|----------------|---------------------|
| T1 | Bosh sahifadan 2 xonali kvartirani Toshkentda toping | 5.2, 5.5 | ≤ 60 soniya, ≤ 3 bosish |
| T2 | Topilgan e'lon bo'yicha sotuvchiga chatdan yozing | 5.3, 5.5 | ≤ 45 soniya |
| T3 | Ovozli qo'ng'iroqni boshlang va tugating | 5.3 | ≤ 30 soniya, xatosiz |
| T4 | Mobil telefonda e'lonlar filtrini qo'llang | 5.5 | ≤ 90 soniya |
| T5 | Faqat klaviatura bilan "E'lon joylash" tugmasini toping | 5.6 | Fokus ko'rinadi, ≤ 20 soniya |
| T6 | Yangi e'lon joylang (sotuvchi yo'nalishi) | 5.3 | ≤ 3 daqiqa |

### 7.3. O'lchovlar (natijalar ishtirokchilar bilan to'ldiriladi)

| Ko'rsatkich | Maqsad (target) | Natija |
|-------------|-----------------|--------|
| Vazifa muvaffaqiyati (task success) | ≥ 90% | — |
| O'rtacha bajarish vaqti | T1 ≤ 60s, T3 ≤ 30s | — |
| Xato soni / vazifa | ≤ 1 | — |
| SUS (System Usability Scale) | ≥ 80 | — |
| UMUX-Lite | ≥ 85 | — |
| Accessibility (klaviatura) | 100% T5 muvaffaqiyat | — |

### 7.4. Hisoblash usullari

- **SUS:** 10 savol, 5 balli Likert; natija 0–100.
- **Task success:** bajarildi / qisman / bajarilmadi.
- **Xato:** foydalanuvchi noto'g'ri yo'lni tanlashi (masalan, filtr o'rniga qidiruvga qayta yozish).

---

## 8. Kutilayotgan ta'sir (KPI)

| Ko'rsatkich | Oldin (taxminiy, audit asosida) | Maqsad |
|-------------|--------------------------------|--------|
| Kontaktga aylanish (lead) | past (navigatsiya chalkash) | +20% |
| Mobil vazifa muvaffaqiyati | past (layout buzilishi) | ≥ 90% |
| Dizayn izchillik indeksi (token qamrovi) | ~30% | ≥ 95% |
| Accessibility buzilishlari (aria/focus) | ko'p (F6) | 0 kritik |

---

## 9. Cheklovlar

1. **Foydalanuvchi sinovi natijalari** — haqiqiy ishtirokchilar talab qilinadi; §7.3 jadvali shu maqsadda tayyor.
2. **KPIning "oldin" qiymatlari** — analitika ma'lumotlari yo'qligi sababli audit asosida baholangan, o'lchanmagan.
3. **Kod o'zgarishlari** — ushbu hisobot faqat tavsiya va maketlarni beradi; haqiqiy [globals.css](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/globals.css) va komponentlarga o'tkazish alohida bosqich.

---

## 10. Keyingi qadamlar

1. `styles.css` tokenlarini `globals.css` ga ko'chirish (§8.1, [design-spec.md](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/design-spec.md)).
2. Hardcoded ranglarni (F1, F2) tokenlarga almashtirish — 693 ta holat.
3. Dublikat komponentlarni (F5) birlashtirish.
4. z-index (F4) va radiuslarni (F3) tokenga keltirish.
5. Accessibility (F6) — `aria-label` va focus holatlarini qo'shish.
6. Mobil navigatsiya (drawer + bottom tab) ni joriy etish.
7. §7 reja bo'yicha foydalanuvchi sinovini o'tkazish va natijalarni to'ldirish.
