# Bước 1: gộp src/ + data/ thành dist/
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY data ./data
COPY tools ./tools
RUN python tools/build.py

# Bước 2: máy chủ Python (chỉ dùng thư viện chuẩn) – đăng nhập admin + lưu dữ liệu SQLite trong /data
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 DATA_DIR=/data HOST=0.0.0.0 PORT=80
COPY server ./server
COPY --from=build /app/dist ./dist
# Bảng giá gốc: khi khởi động, máy chủ cập nhật giá theo file này nếu nó đổi so với lần trước
COPY data/pdf_data.json ./data/pdf_data.json
VOLUME /data
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1/healthz', timeout=2)" || exit 1
CMD ["python", "server/app.py"]
