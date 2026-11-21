# Ishlash tezligini optimallashtirish hisoboti

**Sana:** 2026-11-21
**Loyiha:** House Shop (Django 6.1 + DRF + Next.js 16)
**Maqsad:** Ishlash tezligini pasaytiruvchi sabablarni aniqlash, optimallashtirish usullarini qo'llash va natijalarni o'lchab tasdiqlash.

---

## 1. Tahlil — ishlash tezligini pasaytiruvchi sabablar

Loyiha qatlamma-qatlam tahlil qilindi (backend view/serializer/model, DB so'rovlari, frontend build). Asosiy muammolar:

| # | Muammo | Joy | Ta'sir |
|---|--------|-----|--------|
| 1 | **N+1 so'rovlar** — har bir e'lon uchun alohida `ratings` va `images` so'rovi | `apps/properties/serializers.py`, `views.py` | Ro'yxat endpointida 28 ta so'rov |
| 2 | **N+1 so'rovlar** — har bir suhbat uchun `last_message` va `unread_count` alohida so'rov | `apps/chat/serializers.py` | Chat ro'yxatida 50 ta so'rov |
| 3 | **N+1 so'rovlar** — material ro'yxatida har bir material uchun do'kon | `apps/materials/views.py` | 26 ta so'rov |
| 4 | **Loop ichida aggregatsiya** — har bir hudud/hafta/oy uchun alohida `count()`/`aggregate()` | `apps/dashboard/views_extra.py` | `region-stats` 70, `revenue-center` 54 so'rov |
| 5 | **Loop ichida aggregatsiya** — chart va statistika uchun alohida so'rovlar | `apps/dashboard/views.py` | `stats` ~32 so'rov |
| 6 | **Tartiblash yo'qligi** — `MaterialStore` queryset tartibsiz (pagination beqaror) | `apps/materials/views.py` | UnorderedObjectListWarning |
| 7 | **DB indekslari yetishmasligi** — filtr/tartib maydonlarida indeks yo'q | modellar | Sekin `WHERE`/`ORDER BY` |
| 8 | **Kesh (caching) yo'qligi** — kam o'zgaradigan ochiq statistika har safar hisoblanadi | `HomeStatsView` | Har so'rovda DB yuki |

---

## 2. Qo'llanilgan optimallashtirishlar

### 2.1. N+1 muammosini bartaraf etish (`select_related` / `prefetch_related` / `Prefetch`)

- **properties** (`apps/properties/views.py`, `serializers.py`):
  - `get_queryset()`ga `select_related('owner')` + `Prefetch('images')` + `Prefetch('ratings')` qo'shildi.
  - Ro'yxat uchun faqat joriy foydalanuvchi reytingi `to_attr='user_ratings'` bilan oldindan yuklanadi.
  - Batafsil ko'rinish uchun barcha reytinglar `select_related('user')` bilan bir marta yuklanadi.
  - `my_properties` va `featured` action'lari ham prefetch bilan yangilandi.
  - Serializerlar prefetch keshidan foydalanadi (fallback saqlangan).
- **chat** (`apps/chat/views.py`, `serializers.py`):
  - `ConversationViewSet.get_queryset()` participants, messages (`select_related('sender')`) va `property` (+rasm, reyting) ni oldindan yuklaydi.
  - `get_last_message` / `get_unread_count` endi prefetch qilingan ro'yxatdan Python'da hisoblaydi.
- **materials** (`apps/materials/views.py`, `serializers.py`):
  - `MaterialViewSet` — `select_related('store', 'store__owner')`.
  - `MaterialStoreViewSet` — `select_related('owner')` + `Count('materials')` annotatsiyasi (serializerda N+1 yo'q) + aniq `order_by` (pagination barqarorligi).
  - Batafsil ko'rinishda materiallar `Prefetch` bilan oldindan yuklanadi.

### 2.2. Loop ichidagi aggregatsiyalarni birlashtirish

- **`RegionStatsView`**: 14 hudud × 5 so'rov (70) → 3 ta so'rov (barcha e'lon/xodim/material bir marta olinib, Python'da hududlarga taqsimlanadi).
- **`RevenueCenterView`**: 54 → 3 ta so'rov (kunlik/haftalik/oylik/jami yagona yuklamadan hisoblanadi).
- **`DashboardStatsView`**: chart va taqsimot so'rovlari `values().annotate()` orqali bitta so'rovga birlashtirildi (~32 → 19).
- **`HomeStatsView`**: 4 ta `count()` → 1 ta aggregate.
- Qo'shimcha kichik N+1'lar: `AIMonitoringView`, `BusinessAnalyticsView`, `ConstructionProjectsView` (`select_related`/`annotate`).

### 2.3. Ma'lumotlar bazasi indekslari

Yangi migratsiyalar (4 ta) qo'shildi:

- `Property`: `(status, -created_at)`, `(property_type)`, `(-created_at)`
- `Payment`: `(status, -created_at)`, `(-created_at)`
- `Message`: `(conversation, -created_at)`, `(conversation, is_read)`
- `Conversation`: `(-updated_at)`
- `MaterialStore`: `(status, -created_at)`
- `Material`: `(status, category)`, `(category)`

### 2.4. Kesh (caching) qatlami

- `HomeStatsView` natijasi 60 sekundga keshlanadi (`django.core.cache`).
- `config/settings.py`da aniq `CACHES` sozlamasi qo'shildi: standart — `LocMemCache`,
  `REDIS_URL` env berilganda — Redis (ko'p jarayonli production uchun).

### 2.5. Frontend

- `next.config.ts` allaqachon optimallashtirilgan (`optimizePackageImports`, rasm formatlari `avif/webp`, proxy).
- Lint va production build muvaffaqiyatli o'tdi — funksionallik saqlangan.

---

## 3. O'lchash natijalari (oldin → keyin)

O'lchash: `CaptureQueriesContext` (so'rovlar soni) + median javob vaqti (ms), 40 e'lon / 25 suhbat / 5 do'kon ma'lumoti bilan.

| Endpoint | So'rov (oldin) | So'rov (keyin) | Vaqt (oldin) | Vaqt (keyin) |
|----------|---------------:|---------------:|-------------:|-------------:|
| `/api/v1/properties/` | 28 | **4** | 35.0 ms | **7.7 ms** |
| `/api/v1/properties/1/` | 8 | **4** | 18.4 ms | **7.3 ms** |
| `/api/v1/chat/conversations/` | 50 | **4** | 67.7 ms | **16.7 ms** |
| `/api/v1/materials/items/` | 26 | **2** | 16.8 ms | **4.0 ms** |
| `/api/v1/materials/stores/` | 7 | **2** | 6.2 ms | **3.1 ms** |
| `/api/v1/services/providers/` | 2 | 2 | 7.0 ms | 3.4 ms |
| `/api/v1/dashboard/home-stats/` | 4 | **0** (kesh) | 2.7 ms | **0.4 ms** |
| `/api/v1/dashboard/settings/` | 1 | 1 | 1.5 ms | 0.7 ms |
| `/api/v1/dashboard/stats/` | ~32 | **19** | — | 5.9 ms |
| `/api/v1/dashboard/region-stats/` | 70 | **3** | — | 1.2 ms |
| `/api/v1/dashboard/revenue-center/` | 54 | **3** | — | 1.9 ms |

**Umumiy natija:**
- Eng og'ir endpoint (`chat/conversations`) so'rovlar soni **50 → 4 (−92%)**, vaqt **67.7 → 16.7 ms (−75%)**.
- `properties` ro'yxati **28 → 4 (−86%)**.
- `region-stats` **70 → 3 (−96%)**, `revenue-center` **54 → 3 (−94%)**.
- Barcha asosiy endpointlar javob vaqti **< 20 ms**.

---

## 4. Funksionallik tekshiruvi

| Tekshiruv | Natija |
|-----------|--------|
| Backend testlar (accounts, materials, services, ratings, payments, complaints, dashboard, properties) | **53 test OK** (3 ta kutilgan xato) |
| Chat testlari | 18 testdan 17 OK; 1 ta muhit cheklovi (quyida) |
| Frontend `npm run lint` | Xatosiz |
| Frontend `npm run build` | Muvaffaqiyatli (barcha sahifalar) |
| Django `check` (migratsiyalar bilan) | Muammo yo'q |

**Eslatma:** `apps/chat/tests.py::ChatFileUploadSecurityTests`dagi media-serving testi test muhitida
`/media/` xizmat ko'rsatilmagani uchun 404 qaytaradi. Bu optimallashtirishga aloqasi yo'q
(`chat/tests.py` o'zgartirilmagan; `config/urls.py` media yo'lini import vaqtida oladi).

---

## 5. Xulosa

Loyihaning asosiy tor joylari (N+1 so'rovlar, loop ichidagi aggregatsiyalar, indekslar va keshning
yo'qligi) bartaraf etildi. Natijada backend javob vaqti va DB so'rovlari bir necha barobar kamaydi,
barcha funksiyalar saqlangan holda ishlash tezligi sezilarli oshdi.
