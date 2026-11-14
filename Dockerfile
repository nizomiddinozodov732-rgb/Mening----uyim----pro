# House Shop — Django backend + Next.js frontend (Railway, bitta service)
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NEXT_TELEMETRY_DISABLED=1

# Node.js — Next.js frontend'ni build qilish va ishga tushirish uchun
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend bog'liqliklari
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Frontend'ni build qilish — API bir xil domenda (/api/v1) bo'ladi
WORKDIR /app/frontend
ENV NEXT_PUBLIC_API_URL=/api/v1 \
    NODE_OPTIONS=--max-old-space-size=4096
RUN npm ci && npm run build

# Django statik fayllari (whitenoise uchun)
WORKDIR /app
RUN python manage.py collectstatic --noinput

ENV PORT=8000 \
    DEBUG=False

EXPOSE 8000

# Ikki server: Django (ichki 8000) + Next.js (tashqi $PORT)
CMD python manage.py migrate --noinput \
    && python manage.py ensure_superuser \
    && (daphne -b 127.0.0.1 -p 8000 config.asgi:application &) \
    && cd /app/frontend \
    && exec npm run start -- -p ${PORT:-8000} -H 0.0.0.0
