# Uy-Joy Savdosi - Ko'chmas Mulk Sayti

O'zbekistondagi ko'chmas mulk savdosi uchun zamonaviy web sayt.

## Xususiyatlar

- **Bosh sahifa**: Hero bo'limi, tanlangan e'lonlar, statistika
- **E'lonlar sahifasi**: Qidirish va filtr funksiyalari bilan barcha e'lonlar
- **E'lon tafsilotlari**: Rasmlar, ma'lumotlar, xususiyatlar va bog'lanish
- **Aloqa sahifasi**: Kontakt forma va ma'lumotlar
- **Biz haqimizda**: Kompaniya ma'lumotlari va jamoa

## Texnologiyalar

- React 18
- Vite
- React Router
- TailwindCSS
- Lucide React (ikonkalar)

## O'rnatish

PowerShell'da scriptlarni yoqish kerak bo'lishi mumkin. Quyidagi buyruqlarni ishga tushiring:

```powershell
# PowerShell execution policy'ni o'zgartirish (Administrator sifatida)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Keyin:

```bash
# O'rnating
npm install

# Development server'ni ishga tushuring
npm run dev

# Production build uchun
npm run build
```

## Foydalanish

Sayt `http://localhost:5173` manzilida ochiladi.

## Sahifalar

- `/` - Bosh sahifa
- `/listings` - Barcha e'lonlar
- `/property/:id` - E'lon tafsilotlari
- `/contact` - Aloqa
- `/about` - Biz haqimizda

## Ma'lumotlar

E'lonlar `src/data/properties.js` faylida saqlanadi. Yangi e'lonlar qo'shish uchun shu faylni tahrirlang.
