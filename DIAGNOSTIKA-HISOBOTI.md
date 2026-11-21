# Tizim diagnostikasi hisoboti — House Shop (Mening Uyim)

**Sana:** 2026-11-20
**Rejim:** Read-only (faqat o'qish). Hech qanday kod/konfiguratsiya o'zgartirilmadi, serverlar qayta ishga tushirilmadi.
**Maqsad:** `localhost:3000` dagi joriy holatni aniqlash, bosh sahifa yuklanmasligi va dizayn o'zgarishlari aks etmasligi sabablarini topish, barqaror holatni saqlash qoidalarini belgilash va harakatlar rejasini hujjatlashtirish.

---

## 1. Xulosa (Executive summary)

| # | Holat | Muhimlik |
|---|-------|----------|
| RC‑1 | **Cheksiz redirect halqasi**: `localhost:3000` orqali `/api/v1/*` va `/ws/*` ga qilingan har bir so'rov 308↔301 halqasiga tushadi (ERR_TOO_MANY_REDIRECTS). | **Kritik** |
| RC‑2 | **Dizayn o'zgarishlari ilovaga integratsiya qilinmagan**: `design/mockups/*` — mustaqil statik HTML; real ilova (`frontend/src/app/*`, Tailwind + `globals.css`) boshqa dizayn tizimidan foydalanadi. | **Yuqori** |
| RC‑3 | `vercel.json` barcha so'rovlarni `/index.html` ga yo'naltiradi — Next.js ilovasiga mos emas, Vercel deploy'ni buzadi. | O'rta |
| RC‑4 | Joriy loglar mavjud emas (terminal ro'yxati tozalangan) — uzluksiz kuzatuv jurnali yo'q. | O'rta |
| RC‑5 | Ortiqcha dublikat dev-processlar (4 ta `runserver`), commit qilinmagan fayllar. | Past |

**Muhim aniqlik:** HTTP darajasida `GET /` **200** qaytaradi va SSR sog'lom (title to'g'ri, `Application error`/`__next_error__` yo'q). Ya'ni sahifa "ochilmayapti" emas — **ma'lumot yuklash bosqichi** va **dizayn integratsiyasi** muammoli.

---

## 2. Muhit va komponentlar inventari

| Komponent | Versiya / holat | Manzil |
|---|---|---|
| Django | 6.1.3 (`.venv`) | `http://127.0.0.1:8000` |
| Next.js | 16.2.6 (Turbopack, `next dev`) | `http://localhost:3000` |
| React | 19.2.4 | — |
| Backend kalitlari | `django`, `rest_framework`, `corsheaders`, `channels`, `daphne` | [settings.py](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/config/settings.py) |
| API prefiksi | `/api/v1/` | [config/urls.py](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/config/urls.py) |
| Deploy | Railway (bitta service) + Vercel konfiguratsiyasi | [vercel.json](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/vercel.json) |

---

## 3. Runtime holati (server barqaror)

| Port | Jarayon | PID | Buyruq | Holat |
|---|---|---|---|---|
| 3000 | node | 22756 (ota‑ona 28344) | `next dev` (Turbopack) | LISTEN ✔ |
| 3000 | node | 10584 | `postcss.js` worker | ishlayapti |
| 8000 | python | 13408 | `manage.py runserver 0.0.0.0:8000` | LISTEN ✔ |
| 8000 | python | 9224 / 12988 / 23736 | `manage.py runserver` | dublikat (autoreload) |

Frontend ishga tushirish zanjiri: `npm run dev` (PID 4916) → `next dev` (28344) → `start-server.js` (22756).

> **Eslatma:** barcha jarayonlar **2026‑11‑20 15:57** da ishga tushgan va shu holatda barqaror. Ushbu diagnostika davomida ularga tegilmadi.

---

## 4. Kuzatuv snapshot (monitoring data)

Kuzatuv 2026‑11‑20 da, `localhost:3000` va `127.0.0.1:8000` ustida o'tkazildi.

| So'rov | Natija | Vaqt | Izoh |
|---|---|---|---|
| `GET /` (SSR) | **200 OK** | 255 ms | 88 364 bayt, title: `Mening Uyim - Ko'chmas Mulk va Qurilish Platformasi` |
| `GET /design/mockups/index.html` | **200 OK** | 150 ms | 19 548 bayt (route handler) |
| `GET /django-admin/login/` | **200 OK** | 108 ms | Django admin |
| `GET :8000/api/v1/properties/?page_size=6` | **200 OK** | 36 ms | `count: 5` |
| `GET :8000/api/v1/dashboard/home-stats/` | **200 OK** | 11 ms | `{active_properties:5,total_users:15,total_stores:3,total_workers:5}` |
| `GET :8000/api/v1/dashboard/settings/` | **200 OK** | 11 ms | hero matnlari (DB'dan) |
| `GET :8000/api/v1/dashboard/news/?page_size=3` | **200 OK** | 8 ms | `[]` (bo'sh → ilova placeholder ishlatadi) |
| `GET localhost:3000/api/v1/properties/` | **308 → 301 → 308 …** | — | **HALQA** (manzil: `/api/v1/properties?page_size=6`) |
| `GET localhost:3000/ws/chat/` | **308** | — | `/ws/chat` (slash olib tashlanadi) |

**Xulosa:** backend to'g'ridan-to'g'ri sog'lom; Next.js proksisi orqali API/WS **buzilgan**.

---

## 5. Root cause tahlili

### RC‑1 — Cheksiz redirect halqasi (KRITIK)
`localhost:3000` orqali `/api/v1/*` ga murojaat qilinganda:

```
/api/v1/properties/   → 308 (Next.js trailing slash'ni olib tashlaydi) → /api/v1/properties
/api/v1/properties    → 301 (Django APPEND_SLASH slash'ni qaytaradi)  → /api/v1/properties/
/api/v1/properties/   → 308 …
```

**Tasdiqlangan zanjir (7 qadam):**
```
0. http://localhost:3000/api/v1/properties/  -> 308  Loc=/api/v1/properties
1. http://localhost:3000/api/v1/properties   -> 301  Loc=/api/v1/properties/
2. … (cheksiz takrorlanadi)
```

**Sabab:** ikki tomonlama ziddiyat
- Next.js default `trailingSlash: false` — kiruvchi trailing slash'ni **308** bilan olib tashlaydi ([next.config.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/next.config.ts) da `trailingSlash`/`skipTrailingSlashRedirect` yo'q).
- Django default `APPEND_SLASH = True` — slash'siz manzilga **301** bilan slash qo'shadi ([config/urls.py](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/config/urls.py) barcha yo'llar `/` bilan tugaydi).

**Ta'sir doirasi:**
- **Production: 100% buziladi.** `.env.production.example` ga ko'ra `NEXT_PUBLIC_API_URL=/api/v1` build vaqtida kodga singdiriladi → so'rovlar same‑origin bo'lib Next.js proksisidan o'tadi → halqa.
- **WS: buziladi** — `/ws/chat/` ham 308 orqali slash'sizlanadi.
- **Dev:** axios `baseURL` mutlaq (`http://localhost:8000/api/v1`) bo'lgani uchun brauzer proksini chetlab o'tadi va CORS (ruxsat etilgan) orqali ishlaydi. Shuning uchun this holat dev'da "ba'zan ishlaydi, ba'zan yo'q" ko'rinishida namoyon bo'ladi — rejimga qarab.

**Tegishli fayllar:** [useStore.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/store/useStore.ts#L5-L9) · [next.config.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/next.config.ts#L26-L44) · [config/urls.py](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/config/urls.py#L10-L22)

### RC‑2 — Dizayn o'zgarishlari ilovaga integratsiya qilinmagan (YUQORI)
- Yaxshilangan maketlar [design/mockups/](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups) — **mustaqil statik HTML** + o'z [styles.css](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/design/mockups/styles.css).
- Real ilova bosh sahifasi — [frontend/src/app/page.tsx](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/page.tsx) — **Tailwind klasslari** + [globals.css](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/globals.css) tokenlaridan foydalanadi.
- Ular **umumiy kod bazasiga ega emas** (juft `--primary` tokenlari, lekin alohida fayllar).
- Natijada: `/design/mockups/*` dagi yaxshilashlar `localhost:3000/` **da ko'rinmaydi** — bu kutilgan, chunki ular boshqa artefakt.

### RC‑3 — `vercel.json` mos emas (O'RTA)
```
{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}
```
Barcha yo'llarni `/index.html` ga yo'naltiradi. Next.js ilovasida bunday statik fayl yo'q → Vercel'da 404/deploy buzilishi.

### RC‑4 — Kuzatuv jurnali yo'q (O'RTA)
Joriy sessiyada terminal ro'yxati tozalangan; `next dev` va `runserver` chiqishlari hech qaerga yozilmayapti. Shu sababli xato/ogohlantirishlarni faqat HTTP zondlash orqali aniqlash mumkin.

---

## 6. Kod va konfiguratsiya tahlili

### 6.1 Frontend
- [useStore.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/store/useStore.ts#L5-L9): `API_URL = NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'`; 401 uchun response interceptor mavjud (avvalgi bosqichda qo'shilgan).
- [chat/page.tsx](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/chat/page.tsx#L206-L218): WS host `NEXT_PUBLIC_WS_URL || NEXT_PUBLIC_API_URL` dan hosil qilinadi.
- [layout.tsx](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/layout.tsx): Navbar + Footer + ThemeProvider + ClientSessionWrapper + AIAssistantLoader.
- [eslint.config.mjs](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/eslint.config.mjs): bir qator qoidalar o'chirilgan (`no-explicit-any`, `no-unused-vars`, `react-hooks/exhaustive-deps`, `set-state-in-effect`) — lint signali zaif.
- SSR natijasida `Application error`/`__next_error__` yo'q → server-render sog'lom.

### 6.2 Routing konfiguratsiyasi
- [next.config.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/next.config.ts#L26-L44) rewrites: `/api/:path*`, `/django-admin`, `/static`, `/media`, `/ws` → Django. **`trailingSlash`/`skipTrailingSlashRedirect` sozlanmagan** — RC‑1 sababi.
- `/design` uchun route handler: [route.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/design/%5B%5B...path%5D%5D/route.ts) — maketlarni xizmat qiladi (ishlayapti, 200).

### 6.3 Backend
- [config/urls.py](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/config/urls.py): barcha API yo'llari `/api/v1/<app>/`; `django-admin/`; `media/`.
- [settings.py](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/config/settings.py#L195-L200): `CORS_ALLOWED_ORIGINS` = `localhost:3000, 127.0.0.1:3000` (dev uchun to'g'ri).
- `APPEND_SLASH` **override qilinmagan** → Django default `True`.

---

## 7. O'zgartirishlar tarixi (git)

**Branch:** `main` (oxirgi commit: `b73d8c3 Vercel deploy host sozlamalarini qo'shish`)

**Commit qilinmagan (modified):**
- `README.md`
- `apps/accounts/management/commands/seed.py`
- `apps/chat/consumers.py`
- `frontend/src/app/chat/page.tsx`
- `frontend/src/store/useStore.ts`

**O'chirilgan:** `frontend/public/{file,globe,next,vercel,window}.svg`, `frontend/src/lib/utils.ts`

**Kuzatilmaydigan (untracked, `??`):**
- `design/` ← **barcha dizayn maketlari (git'ga kirmagan)**
- `frontend/src/app/design/` ← maketlarni xizmat qiluvchi route handler
- `.vercel/`, `.vercelignore`, `vercel.json`, `.trae-html-share-packages/`

> **Xavf:** dizayn bo'yicha barcha ishlar git'da yo'q. Har qanday `git clean`/checkout ularni o'chirib yuboradi.

> **Kuzatuv izohi:** diagnostika chog'ida eskirgan `.git/index.lock` cheklangan holda o'chirilgani qayd etildi; `git status` hozir ishlayapti.

---

## 8. Barqaror holatni saqlash qoidalari (guardrails)

Hozirgi holatni **o'zgartirmasdan** saqlab qolish uchun:

1. **Serverlarni qayta ishga tushirmaslik** — port 3000 (PID 22756) va 8000 (PID 13408) tegilmasin.
2. **Fayllarni o'zgartirmaslik** — bu bosqich read-only.
3. **Destruktiv git amallari taqiqlanadi:** `git clean`, `git reset --hard`, `git checkout .` — `design/` untracked bo'lgani uchun yo'qoladi.
4. **Commit qilmaslik** (foydalanuvchi so'ramaguncha).
5. **Dublikat processlarni o'ldirmaslik** — Django autoreload zanjiri (PID 9224/12988/23736) normal holat.
6. **`.next` va `node_modules` ga tegmaslik** — dev server ular ustida ishlayapti.

---

## 9. Harakatlar rejasi (taklif — hali qo'llanilmagan)

### P0 — RC‑1 halqasini uzish (kritik)
Variantlar (biri tanlanadi):
- **(A, tavsiya)** [next.config.ts](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/next.config.ts) ga `skipTrailingSlashRedirect: true` qo'shish — Next.js 308 qilmaydi, `/api/v1/properties/` o'z holida Django'ga yetib boradi va mos keladi.
- **(B)** Rewrite'lar oldiga aniq qoidalar: `source: '/api/v1/:path*/'` va `'/api/v1/:path*'` juftligi.
- **(C)** Django tomonda `APPEND_SLASH = False` + URL'larni ikkala shaklda ham qabul qilish.
- **(D)** Production'da `NEXT_PUBLIC_API_URL` ni backend'ning to'liq manziliga o'rnatish (proksini chetlab o'tish) — eng sodda, lekin CORS sozlashni talab qiladi.

*Avval qaysi variantni qo'llashni tasdiqlash kerak (kod o'zgarishi).*

### P1 — RC‑2 dizayn integratsiyasi
- Qaror: maketlar **namuna (deliverable)** sifatida qoladimi yoki Tailwind komponentlariga **ko'chiriladimi**?
- Agar integratsiya: `globals.css` tokenlari `styles.css` bilan birlashtiriladi; `Navbar.tsx` ga drawer + tabbar; `page.tsx`/`properties`/`chat` sahifalari qayta ishlanadi.

### P2 — RC‑3 `vercel.json`
- Next.js uchun catch-all rewrite'ni olib tashlash yoki to'g'ri sozlash.

### P3 — RC‑4 kuzatuv/jurnal
- Serverlar qayta ishga tushirilganda chiqishni faylga yozish: `npm run dev > logs/frontend.log 2>&1`, `python manage.py runserver > logs/backend.log 2>&1`.
- Hozircha (restartsiz) HTTP zondlash orqali kuzatish.

### P4 — Gigiyena
- `design/` va `frontend/src/app/design/` ni git'ga qo'shish (yo'qolishdan saqlash).
- Dublikat `runserver` processlarini tekshirish.

---

## 10. Takrorlanadigan tekshirish buyruqlari

```powershell
# 1) Portlar
Get-NetTCPConnection -State Listen -LocalPort 3000,8000 | Select LocalPort,OwningProcess

# 2) Proksi halqasini tasdiqlash (cheksiz redirect)
#    AllowAutoRedirect=$false bilan /api/v1/properties/ ni kuzatish → 308 ↔ 301

# 3) Backend sog'lomligi (to'g'ridan-to'g'ri)
Invoke-WebRequest 'http://127.0.0.1:8000/api/v1/properties/?page_size=6' -UseBasicParsing

# 4) SSR sog'lomligi
Invoke-WebRequest 'http://localhost:3000/' -UseBasicParsing | Select StatusCode
```

---

## 11. Chuqur tahlil uchun tayyorgarlik (keyingi qadamlar)

Tizim keyingi chuqur tahlillarga tayyor:
1. RC‑1 uchun yechim variantini tanlash (P0) va qo'llash.
2. Brauzer devtools'da Network/Console jurnalini yig'ish (loopni vizual tasdiqlash).
3. Backend loglarini (daphne/runserver) faylga yo'naltirib, 301/404/500 statistikasini kuzatish.
4. `design/` artefaktlarini git'ga kiritish va integratsiya qarorini qabul qilish.

---

## 12. HAL QILINDI — qo'ng'iroq (video/audio) va RC‑1 (2026‑11‑20)

### 12.1 Qo'shimcha aniqlangan ildiz sabab (RC‑1b): WebSocket proxy ishlamaydi

RC‑1 (redirect halqasi) dan tashqari, **video/ovozli qo'ng'iroqlarning ishlamasligining bevosita sababi** topildi:

- Backend WS **sog'lom**: `ws://127.0.0.1:8000/ws/chat/?token=<JWT>` → **OPEN** (daphne ASGI to'g'ri ishlaydi).
- `ws://127.0.0.1:3000/ws/chat/` (Next.js `rewrites` orqali) → **TIMEOUT** — Next.js (bundle qilingan `next dev` ham, `next start` ham) `rewrites` bilan **WebSocket "upgrade" so'rovlarini proxy qilmaydi**.
- Production'da `NEXT_PUBLIC_API_URL=/api/v1` → frontend WS manzili `wss://<domen>/ws/chat/` → Next.js proksisi → **hech qachon ulanmaydi**. Shu sababli qo'ng'iroq signalizatsiyasi (offer/answer/ICE) brauzerlararo yetib bormagan.

### 12.2 Qo'llangan yechim

Yangi **maxsus Next.js serveri** qo'shildi: [frontend/server.js](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/server.js). U:
- Next.js'ni sahifalar uchun xizmat qiladi;
- `/ws/*` WebSocket upgrade'larini to'g'ridan-to'g'ri Django (daphne)ga proxy qiladi;
- `/api`, `/media`, `/static`, `/django-admin` HTTP so'rovlarini **yo'lni o'zgartirmasdan** proxy qiladi — bu RC‑1 halqasini (Next.js slash olib tashlashi ↔ Django APPEND_SLASH) **butunlay yo'q qiladi**.

O'zgargan fayllar:
| Fayl | O'zgarish |
|---|---|
| [frontend/server.js](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/server.js) | **Yangi** — HTTP + WS proxy |
| [frontend/package.json](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/package.json#L5-L10) | `dev`/`start` → `node server.js` |
| [frontend/src/app/chat/page.tsx](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/frontend/src/app/chat/page.tsx#L206-L239) | WS URL hosil qilish mustahkamlandi (same‑origin + env) |
| [Dockerfile](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/Dockerfile#L34-L48) | `CMD` custom server orqali; `NODE_ENV=production` |
| [.env.production.example](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/.env.production.example) | TURN (WebRTC) o'zgaruvchilari hujjatlashtirildi |

### 12.3 Sinov natijalari

**Dev muhiti (port 3000, `node server.js --dev`):**
- Sahifalar: `/` → 200, `/chat` → 200.
- Redirect zanjiri: `/api/v1/properties/` → **200** (halqa yo'q); `/api/v1/properties` → 301 → **200** (bitta redirect).
- Qo'ng'iroq signalizatsiyasi (ikki foydalanuvchi orasida): **8/8 PASS** (video: offer/answer/ICE/end-call; audio: offer/reject/busy).

**Production muhiti (port 3100, `next build` + `NODE_ENV=production node server.js`):**
- Sahifalar: `/`, `/chat`, `/login` → 200.
- API same‑origin (proksi orqali): `/api/v1/properties/`, `/api/v1/chat/conversations/`, `/api/v1/auth/profile/` → 200.
- WS qo'ng'iroq signalizatsiyasi: **11/11 PASS**.

### 12.4 Qolgan tavsiya — TURN (media uchun)

Signallash (signaling) endi to'liq ishlaydi. Audio/video **media oqimi** uchun STUN ko'p hollarda yetarli, ammo **qat'iy NAT/firewall** ortidagi foydalanuvchilar uchun TURN serveri kerak. Kod `NEXT_PUBLIC_TURN_URL/USERNAME/CREDENTIAL` ni qo'llab-quvvatlaydi (build vaqtida berilishi kerak) — batafsil [.env.production.example](file:///d:/loyihalar/House%20Shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/.env.production.example#L29-L37).

> **Eslatma:** `CHANNEL_LAYERS = InMemoryChannelLayer` bitta daphne jarayoni uchun to'g'ri. Kelajakda bir nechta worker/instance ishlatilsa, `channels_redis` ga o'tish kerak.
