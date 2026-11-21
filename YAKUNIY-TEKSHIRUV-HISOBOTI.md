# House Shop — Yakuniy tekshiruv hisoboti

**Loyiha:** House Shop (Ko'chmas mulk va qurilish platformasi)
**Tekshiruv sanasi:** 2026-11-21
**Branch:** `main` · **Boshlang'ich commit:** `bae102a`
**Repository:** `https://github.com/nizomiddinozodov732-rgb/Mening----uyim----pro.git`

---

## 1. Umumiy ma'lumot

| Yo'nalish | Texnologiya |
|---|---|
| Backend | Django 6.1.3, Django REST Framework 3.18.3, Django Channels (WebSocket), Daphne ASGI |
| Frontend | Next.js 16.2.6 (App Router, Turbopack), React 19.2.4, TypeScript, Tailwind CSS v4, Zustand |
| Autentifikatsiya | JWT (SimpleJWT) — refresh rotation + blacklist, brute-force himoyasi |
| Shifrlash | E2E: ECDH P-256 + AES-GCM-256 (Web Crypto API); WebRTC DTLS-SRTP qo'ng'iroqlar |
| Ma'lumotlar bazasi | SQLite (dev) / PostgreSQL (prod, `DATABASE_URL`) |
| Deploy | Railway (bitta Docker service), Vercel config, custom `server.js` proxy (HTTP + WS) |

Tekshiruv uch bosqichda o'tkazildi:
1. **Funksional sinov** — backend avtomatik testlari (Django/DRF) + frontend build va lint.
2. **Kiberxavfsizlik auditi** — kod tahlili va zaifliklarni qayta ishlab chiqaruvchi (PoC) testlar.
3. **Yakuniy hisobot** — natijalar, muammolar va tuzatish tavsiyalari.

---

## 2. Funksional sinov natijalari

### 2.1 Backend avtomatik testlari

Testlar uchta modul uchun yozildi: `apps/accounts`, `apps/properties`, `apps/chat`.

```
$ python manage.py test apps.accounts.tests apps.properties.tests apps.chat.tests
Found 64 test(s)
Ran 64 tests
OK (expected failures=3)
```

| Modul | Testlar soni | Natija |
|---|---:|---|
| `accounts` (auth, profil, brute-force, imtiyozlar) | 26 | 26 o'tdi |
| `properties` (e'lonlar CRUD, filtrlar, reyting) | 27 | 24 o'tdi, 3 ma'lum xato (`expectedFailure`) |
| `chat` (suhbatlar, xabarlar, fayl yuklash) | 11 | 11 o'tdi |
| **Jami** | **64** | **61 o'tdi, 3 hujjatlashtirilgan xato** |

**Tasdiqlangan funksiyalar (qisqacha):**

- Ro'yxatdan o'tish: kuchli parol validatsiyasi, parol mosligi, dublikat username rad etilishi, parol PBKDF2 bilan xeshlanishi, tokenlar qaytarilishi.
- Login: username **va** email bilan kirish, xato parolni rad etish va jurnalga yozish (`SecurityLog`), JWT'ni himoyalangan endpointda qabul qilish.
- Profil: autentifikatsiya talab qilinishi, faqat ruxsat etilgan maydonlarni (`first_name`, `phone`, `bio`, ...) o'zgartirish; `is_admin`/`rating` kabi maydonlarni **o'zgartirib bo'lmasligi**; parolni almashtirish (eski parol tekshiruvi + kuchli parol).
- Brute-force himoyasi: 10 marta xato logindan keyin IP avtomatik bloklanadi va keyingi so'rov 403 qaytaradi.
- E'lonlar: anonim faqat `active` e'lonlarni ko'radi; yashirin e'lonni anonim olmaydi (404), egasi oladi; faqat obuna bo'lgan mutaxassis e'lon joylaydi; mijoz joylay olmaydi; `views_count` ko'rishda oshadi; narx/maydon/xona filtrlar ishlaydi; noto'g'ri filtr qiymatlari 500 bermaydi.
- Egalik huquqi: faqat egasi (yoki admin) e'lonni tahrirlaydi/o'chiradi; boshqalar uchun 403.
- Reyting: o'z e'loniga reyting berib bo'lmaydi; 1–5 oralig'idan tashqari rad etiladi; qayta berilganda yangilanadi; ro'yxat ommaviy.
- Chat: qatnashuvchi bo'lmagan foydalanuvchi suhbatni/xabarlarni ko'ra olmaydi va xabar yubora olmaydi (404); takroriy suhbat qayta ishlatiladi; o'zi bilan suhbat ochib bo'lmaydi; o'qilganlik belgisi (`is_read`) ishlaydi; `users` ro'yxati o'zini chiqarib tashlaydi; faylli xabar yuboriladi.

### 2.2 Frontend tekshiruvi

```
$ npm run lint     →  ✔ 0 xato
$ npm run build    →  ✔ Compiled successfully (6.8s), TypeScript ✔, 37 sahifa generatsiya qilindi
```

- **Build:** muvaffaqiyatli — 37 route (statik va dinamik) xatosiz yig'ildi.
- **Lint:** dastlab `src/app/chat/page.tsx` da 2 ta xato bor edi (React Compiler `useCallback` bog'liqliklarini saqlab qola olmasligi: `[user?.id]` o'rniga kompilyator `user` ni kutgan). Ushbu xatolar tuzatildi (primitiv `userId` orqali bog'liqlik aniqlashtirildi) — endi lint toza.

---

## 3. Kiberxavfsizlik auditi

### 3.1 Aniqlangan zaifliklar

> Har bir topilma uchun avtomatik PoC test mavjud (test nomi ko'rsatilgan). Darajalar: **Kritik / Yuqori / O'rta / Past**.

#### V-1 · Kritik — Imtiyozlarni oshirish (Privilege Escalation)

- **Tavsif:** `AdminUserUpdateView` ruxsatni faqat `is_admin yoki is_super_admin` bo'yicha tekshiradi, lekin `AdminUserSerializer` `is_admin`, `is_super_admin`, `is_active` maydonlarini **yozishga ochiq** qoldiradi. Natijada oddiy `is_admin` foydalanuvchi o'ziga (yoki boshqasiga) `is_super_admin=True` o'rnatib, to'liq boshqaruvga chiqadi.
- **Dalillar:** `test_admin_self_promotion_to_super_admin_vulnerability`, `test_admin_cannot_escalate_other_user_without_super_admin_vulnerability` — ikkalasi ham muvaffaqiyatli (ya'ni zaiflik tasdiqlandi).
- **Fayllar:** [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/accounts/views.py#L176-L184), [serializers.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/accounts/serializers.py#L60-L70)
- **Tavsiya:** `AdminUserSerializer` ga `read_only_fields = ['is_admin', 'is_super_admin', 'is_active']` qo'shish; imtiyoz berishni faqat `SuperAdminManageAdminView` (super-admin) orqali amalga oshirish; `is_super_admin` ni faqat super-admin bera olishini ta'minlash.

#### V-2 · Yuqori — `X-Forwarded-For` soxtalashtirish (brute-force va throttling chetlab o'tilishi)

- **Tavsif:** `get_client_ip()` `X-Forwarded-For` sarlavhasining birinchi qiymatiga ishonadi, DRF throttle esa `NUM_PROXIES` sozlanmagani uchun shu sarlavhaga tayanadi. Soxta XFF yuborib, hisoblagichni IP'lar bo'yicha bo'lib tashlash mumkin — natijada **brute-force bloklash ham, rate-limit ham chetlab o'tiladi**.
- **Dalillar:** `test_x_forwarded_for_spoofing_bypasses_brute_force_blocking_vulnerability`, `test_x_forwarded_for_spoofing_bypasses_drf_throttling_vulnerability` — ikkalasi tasdiqlandi.
- **Fayl:** [middleware.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/accounts/middleware.py#L23-L31)
- **Tavsiya:** ishonchli proksi sonini belgilash (`REST_FRAMEWORK['NUM_PROXIES']`), XFF'ni faqat ichki proksi manzilidan (`REMOTE_ADDR` allowlist) qabul qilish, yoki proksi (Nginx/Next.js) darajasida XFF'ni majburan qayta yozish.

#### V-3 · Yuqori — `@action` darajasidagi ruxsatlar e'tiborsiz qoldirilishi (anonim → 500)

- **Tavsif:** `PropertyViewSet.get_permissions()` `@action(permission_classes=[IsAuthenticated])` dekoratorini **bekor qiladi** va `rate`, `delete_rating`, `upload_images` uchun `AllowAny` qaytaradi. Natijada anonim so'rov `request.user` sifatida `AnonymousUser` bilan ishlaydi va `update_or_create(user=...)` da `TypeError` → **500 Internal Server Error** (xato oqibati va DoS vektori). `DELETE /delete_rating/` ham xuddi shunday.
- **Dalil:** `test_rating_action_is_protected_by_authentication_vulnerability` (kutilgan 401 o'rniga 500) — hujjatlashtirilgan xato sifatida belgilangan.
- **Fayllar:** [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/properties/views.py#L31-L34)
- **Tavsiya:** `get_permissions()` da action-dekorator ruxsatlarini hisobga olish — `rate`, `delete_rating`, `upload_images` uchun `IsAuthenticated`, qolganlari (list/retrieve/featured/ratings) uchun `AllowAny`.

#### V-4 · Yuqori — Shaxsiy ma'lumotlarning oshkor bo'lishi (PII leakage)

- **Tavsif:** `UserListView`, `UserDetailView`, `TopProfessionalsView` `AllowAny` bo'lib, `UserSerializer` orqali `email`, `phone`, `telegram`, `whatsapp`, `instagram`, `public_key` (hamda `is_staff`, `is_superuser`, `is_subscribed`, `subscription_end`) ni **autentifikatsiyasiz** tarqatadi. Bu barcha foydalanuvchilarning email/telefon raqamlarini va E2E ochiq kalitlarini yig'ish (scraping) imkonini beradi.
- **Dalil:** `test_public_user_list_exposes_email_phone_and_public_key_vulnerability` — tasdiqlandi.
- **Fayllar:** [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/accounts/views.py#L125-L161), [serializers.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/accounts/serializers.py#L30-L51)
- **Tavsiya:** ommaviy ro'yxat uchun alohida (minimal) serializer yaratish (`id`, `username`, `avatar`, `rating`, `profession`); kontakt ma'lumotlar va ochiq kalitni faqat autentifikatsiya/ruxsat orqali berish.

#### V-5 · O'rta — Saqlangan XSS (chat fayl yuklash orqali)

- **Tavsif:** Chat fayl yuklashda tur/MIME **tekshirilmaydi**; `/media/` same-origin (Next.js proksisi orqali) xizmat qilinadi va `.html`/`.svg` `Content-Type: text/html` bilan qaytariladi. Zararli `.html` faylni yuklab, uning havolasini ochish orqali **saqlangan XSS** hosil qilinadi. Token `localStorage` da saqlangani uchun bu seansni o'g'irlashga olib kelishi mumkin.
- **Dalil:** `test_uploaded_html_file_is_served_as_text_html_vulnerability` — fayl 201 bilan saqlanadi va `text/html` sifatida 200 qaytariladi.
- **Fayllar:** [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/chat/views.py#L76-L99)
- **Tavsiya:** fayl turi/MIME allowlist (rasm, PDF, hujjat); `Content-Disposition: attachment` va `X-Content-Type-Options: nosniff`; media'ni alohida (cookie'siz) domenga yoki obyekt saqlashga (S3) joylash; SVQ/rasmlarni qayta kodlash.

#### V-6 · O'rta — Yashirin e'lonlarning oshkor bo'lishi (`?all=1`)

- **Tavsif:** `get_queryset()` dagi `all` parametri `status='active'` filtrini olib tashlaydi va **anonim** so'rovchiga nofaol/sotilgan/kutilayotgan e'lonlarni ham ko'rsatadi.
- **Dalil:** `test_all_parameter_reveals_hidden_listings_vulnerability` — tasdiqlandi.
- **Fayl:** [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/properties/views.py#L93-L96)
- **Tavsiya:** `all` parametridan foydalanishni faqat autentifikatsiya qilingan admin/egasiga cheklash.

#### V-7 · O'rta — E'lon egasining telefon raqami ommaviy ko'rinishi

- **Tavsif:** E'lonlar ro'yxatida `owner_phone` har qanday anonim so'rovchiga ko'rinadi (kontakt ma'lumotning ommaviy oshkorligi).
- **Dalil:** `test_public_listing_exposes_owner_phone_number_vulnerability` — tasdiqlandi.
- **Tavsiya:** telefon raqamni faqat autentifikatsiya qilingan foydalanuvchiga (yoki "Qo'ng'iroq qilish" tugmasi orqali) ko'rsatish; maskalash.

#### V-8 · O'rta — Reyting agregati noto'g'ri yangilanishi (funksional xato)

- **Tavsif:** Ikki nuqson birgalikda:
  1. `get_queryset()` `prefetch_related('ratings')` bilan obyektni keshlaydi; `rate` action shu keshli obyektni `update_or_create(property=prop, ...)` ga beradi. `PropertyRating.save()` → `self.property.update_rating()` keshdagi **bo'sh** ro'yxatni o'qiydi → **birinchi reyting agregatga umuman o'tmaydi** (`rating=0`, `rating_count=0`).
  2. `delete_rating` `QuerySet.delete()` dan foydalanadi — bu model `delete()` override'ini **chetlab o'tadi**; keyingi `update_rating()` esa keshdagi eski ro'yxatni o'qiydi → `rating_count` yangilanmaydi.
- **Dalillar:** `test_user_can_rate_and_average_is_updated`, `test_delete_rating_recomputes_aggregate` — ikkalasi hujjatlashtirilgan xato sifatida belgilangan.
- **Fayllar:** [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/properties/views.py#L132-L183), [models.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/properties/models.py#L46-L95)
- **Tavsiya:** reyting yozish/o'chirishda toza (keshsiz) obyekt olish yoki `property_id` orqali ishlash; `update_rating()` dan oldin `refresh_from_db()`/`prefetch` keshini tozalash; `rate`/`delete_rating` action'lari uchun `prefetch_related('ratings')` ni qo'llamaslik.

#### V-9 · O'rta — Fayl yuklashda hajm/tur kvotasi yo'q (DoS/storage abuse)

- **Tavsif:** `DATA_UPLOAD_MAX_MEMORY_SIZE` va `FILE_UPLOAD_MAX_MEMORY_SIZE` 50MB; tur allowlist yo'q. Zararli foydalanuvchi katta hajmdagi fayllarni cheksiz yuklab, diskni/xotirani to'ldirishi mumkin.
- **Tavsiya:** fayl hajmi va turi allowlist'i, foydalanuvchi bo'yicha kvota, xavfsiz saqlash nomi.

### 3.2 Past darajali kuzatuvlar

- **V-10 (Past):** `LoginView` dagi nofaol-akkaunt 403 shoxobchasi amalda **ishlamaydi** — Django `authenticate()` nofaol foydalanuvchi uchun `None` qaytaradi, shuning uchun javob 400 bo'ladi. Xavfsizlikka zarari yo'q (foydalanuvchi mavjudligini oshkor qilmaydi), lekin kod/xato xabari chalg'ituvchi. Fayl: [views.py](file:///d:/loyihalar/House__shop-main%20%E2%80%94%20%D0%BA%D0%BE%D0%BF%D0%B8%D1%8F/apps/accounts/views.py#L59-L61)
- **V-11 (Past):** `python manage.py check --deploy` dev rejimida 6 ogohlantirish beradi (HSTS, SSL redirect, secure cookie, zaif `SECRET_KEY`, `DEBUG=True`). `config/settings.py` da bu sozlamalar `DEBUG=False` bo'lganda shartli ravishda yoqiladi — ya'ni dev muhit uchun normal holat. **Production'da `SECRET_KEY` muhit o'zgaruvchisi va `DEBUG=False` majburiy.**
- **V-12 (Past):** `UserSerializer` `is_staff`, `is_superuser`, `is_subscribed`, `subscription_end` maydonlarini ham oshkor qiladi (kichik info leak).

### 3.3 Yaxshi xavfsizlik amaliyotlari (tasdiqlandi)

- Parollar `set_password()` (PBKDF2) orqali xeshlanadi; kuchli parol validatsiyasi (8+ belgi, umumiy/raqamli parollarni rad etish).
- JWT: qisqa `access` (2 soat), `refresh` rotation + blacklist (`BLACKLIST_AFTER_ROTATION`).
- Brute-force himoyasi + `SecurityLog` jurnali + `BlockedIP` + bloklangan IP'lar middleware'i (keshlangan).
- Egalik tekshiruvlari: `Property`/`ServiceProvider`/`Material` `get_object()` da; chat'da qatnashuvchi tekshiruvi (qatnashmaganlarga 404).
- `SECRET_KEY` production validatsiyasi; xavfsizlik sarlavhalari (`X_FRAME_OPTIONS=DENY`, `Content-Type-nosniff`, HSTS/SSL redirect); cheklangan CORS allowlist; whitenoise bilan statik fayllar.
- E2E shifrlash (ECDH P-256 + AES-GCM-256) va WebRTC DTLS-SRTP; ochiq kalitlar almashinuvi orqali.

---

## 4. Cheklovlar va qoplanmagan sohalar

- Avtomatik testlar faqat 3 ta modulni qamrab oladi (`accounts`, `properties`, `chat`). Quyidagi modullar hozircha **qoplanmagan**: `materials`, `services`, `ratings`, `payments`, `complaints`, `calculator`, `dashboard`.
- WebSocket (`ChatConsumer`), WebRTC qo'ng'iroqlar va E2E shifrlash oqimi avtomatik testlar bilan sinalmagan (qo'lda/brauzer orqali tekshirish tavsiya etiladi).
- `check --deploy` faqat dev rejimida tekshirildi (production muhit o'zgaruvchilari bilan emas).

---

## 5. Ustuvor tavsiyalar (roadmap)

| Ustuvorlik | Amal |
|---|---|
| P0 (zudlik bilan) | **V-1** — `AdminUserSerializer` da `is_admin`/`is_super_admin`/`is_active` ni `read_only` qilish. |
| P0 | **V-3** — `get_permissions()` ni `@action` ruxsatlariga moslashtirish (anonim 500 ni yo'q qilish). |
| P1 | **V-2** — XFF/NUM_PROXIES sozlamasi va proksi darajasida XFF'ni qayta yozish. |
| P1 | **V-4** — ommaviy foydalanuvchi serializerini ajratib, PII'ni yopish. |
| P1 | **V-5** — fayl yuklash allowlist + `nosniff` + media'ni ajratish (stored XSS). |
| P2 | **V-6, V-7** — yashirin e'lonlar va `owner_phone` ni cheklash. |
| P2 | **V-8** — reyting agregatini tuzatish (prefetch kesh + bulk delete). |
| P3 | **V-9, V-10, V-12** — kvota, debug/xato xabarlari, maydonlarni tozalash. |
| Doimiy | Qolgan modullar uchun testlar yozish; CI'da `python manage.py test` va `npm run lint && npm run build` ni majburiy qilish. |

---

## 6. Xulosa

- **Funksional jihat:** asosiy biznes-oqimlar (autentifikatsiya, e'lonlar, egalik huquqlari, chat, reyting asoslari) to'g'ri ishlaydi. Frontend xatosiz yig'iladi (37 route) va lint toza. Biroq reyting agregatining yangilanishida (V-8) va `rate` action'ining anonim so'rovida (V-3) funksional nuqsonlar aniqlandi.
- **Xavfsizlik jihat:** arxitekturada bir qator kuchli himoyalar (JWT rotation, brute-force, egalik tekshiruvlari, E2E) mavjud. Shu bilan birga **1 ta kritik** (imtiyoz oshirish), **3 ta yuqori** (XFF soxtalashtirish, action ruxsatlari, PII oshkorligi) va **5 ta o'rta** darajali zaiflik tasdiqlandi.
- **Umumiy baho:** loyiha ishlab chiqarishga yaqin, ammo **P0/P1 topilmalar tuzatilmaguncha production'ga chiqarish tavsiya etilmaydi.**

> Barcha topilmalar uchun qayta ishlab chiqaruvchi testlar `apps/*/tests.py` da saqlanadi. Ma'lum funksional xatolar `@unittest.expectedFailure` bilan belgilangan — tuzatilgach, test "unexpected success" berib, e'tiborni tortadi.
