# House Shop — Django backend (Railway uchun)
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

ENV PORT=8000
EXPOSE 8000

CMD python manage.py migrate --noinput && python manage.py ensure_superuser && daphne -b 0.0.0.0 -p ${PORT} config.asgi:application
