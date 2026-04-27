# Build context: repository root (AI-Predictive-AirCraft-Maintenance/).
# Single origin: React uses /api; uvicorn serves API + static/ from one port.

FROM node:22-alpine AS frontend
WORKDIR /build/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM python:3.12-slim-bookworm
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend /build/client/dist ./backend/static

WORKDIR /app/backend
EXPOSE 8765
# Railway/Render/Fly set PORT; default matches local Docker -p 8765:8765
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8765}"]
