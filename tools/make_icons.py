"""Tạo icon vuông cho ứng dụng cài lên màn hình chính (iPhone, Android) từ data/logo_cream.png.

    python tools/make_icons.py

Ảnh tạo ra nằm trong data/ và được đưa lên git, nên tools/build.py không cần Pillow.
- icon-180.png           apple-touch-icon (iPhone/iPad tự bo góc)
- icon-192.png, icon-512.png   icon thường trong manifest
- icon-maskable-512.png  icon Android tự cắt hình (logo nằm trong vùng an toàn 80%)
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")
BRAND = (0x92, 0x43, 0x1E)


def make(size, logo_share, name):
    logo = Image.open(os.path.join(D, "logo_cream.png")).convert("RGBA")
    w = round(size * logo_share)
    logo = logo.resize((w, round(logo.height * w / logo.width)), Image.LANCZOS)
    im = Image.new("RGBA", (size, size), BRAND + (255,))
    im.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
    im.convert("RGB").save(os.path.join(D, name), optimize=True)
    print("ok", name)


make(180, 0.80, "icon-180.png")
make(192, 0.80, "icon-192.png")
make(512, 0.80, "icon-512.png")
make(512, 0.66, "icon-maskable-512.png")
