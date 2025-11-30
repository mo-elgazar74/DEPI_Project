FROM python:3.11

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PORT=8000 \
    IMAGE_CACHE_DIR=/app/image_cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.prod.txt .
RUN pip install --no-cache-dir -r requirements.prod.txt

COPY . .

RUN mkdir -p /app/chats /app/memory_store ${IMAGE_CACHE_DIR} \
    && chmod -R 777 /app/chats /app/memory_store ${IMAGE_CACHE_DIR}

ENV IMAGE_CACHE_ENABLED=true
ENV IMAGE_CACHE_MAX_SIZE=1073741824  

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

CMD ["sh", "-c", "echo PORT=$PORT && gunicorn -b 0.0.0.0:$PORT app_flask:app"]



