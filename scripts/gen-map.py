"""Build the playable map plate from the raw fantasy art.

Pads the portrait art with painted ocean so a 16:9 viewport is filled,
grades the sea toward the deep teal of the design reference, adds drifting
mist, and burns in an atmospheric vignette.

Calibration (pixel -> degree, fitted on George Town / KL / Johor Bahru /
Kota Bharu / Tioman / Melaka / Ipoh / Kuantan / Alor Setar / Singapore):
    lng = 0.0046524099 * x + 99.5696397
    lat = 7.1529428 - 0.0043799807 * y
"""
import math, os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

random.seed(7)
SRC = 'assets/map.png'
DST = 'public/map.jpg'
PAD = 690
A_LNG = 0.0046524099245303955

src = Image.open(SRC).convert('RGB')
W, H = src.size
NW, NH = W + PAD * 2, H

# ---------------------------------------------------------------- ocean bed
base = Image.new('RGB', (NW, NH))
d = ImageDraw.Draw(base)
for y in range(NH):
    t = y / NH
    d.line([(0, y), (NW, y)], fill=(int(30 + 14 * t), int(72 + 18 * t), int(98 + 20 * t)))

waves = Image.new('L', (NW, NH), 0)
wd = ImageDraw.Draw(waves)
y = -20
while y < NH + 40:
    amp = random.uniform(2.5, 6.5)
    per = random.uniform(120, 260)
    ph = random.uniform(0, 6.28)
    pts = []
    x = 0
    while x <= NW:
        pts.append((x, y + amp * math.sin(x / per * 6.283 + ph) + amp * .45 * math.sin(x / (per * .37) + ph * 2)))
        x += 8
    wd.line(pts, fill=random.randint(28, 70), width=random.choice([1, 1, 2]))
    y += random.uniform(7, 13)
waves = waves.filter(ImageFilter.GaussianBlur(0.7))
base = Image.composite(Image.new('RGB', (NW, NH), (150, 196, 214)), base, waves.point(lambda v: int(v * .75)))
base = base.filter(ImageFilter.GaussianBlur(0.6))

# ------------------------------------------------------- feathered art paste
mask = Image.new('L', (W, H), 255)
px = mask.load()
FE = 260
for x in range(FE):
    v = int(255 * (x / FE) ** 1.6)
    for yy in range(H):
        px[x, yy] = v
        px[W - 1 - x, yy] = v
base.paste(src, (PAD, 0), mask)

# ------------------------------------------------------------- sea colour grade
a = np.asarray(base).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
sea = (np.clip((b - r) / 60.0, 0, 1) * np.clip((b - g + 25) / 55.0, 0, 1))[..., None]
graded = a * np.array([0.80, 1.02, 0.84], dtype=np.float32)
a = a * (1 - sea) + graded * sea
a *= (1 - 0.22 * sea[..., 0])[..., None]
base = Image.fromarray(np.clip(a, 0, 255).astype('uint8'))

# ------------------------------------------------------------------- sea mist
mist = Image.new('L', (NW, NH), 0)
md = ImageDraw.Draw(mist)
for _ in range(34):
    edge = random.random()
    cx = random.uniform(-140, NW * .12) if edge < .5 else random.uniform(NW * .88, NW + 140)
    cy = random.uniform(0, NH)
    for _ in range(random.randint(4, 8)):
        rx = random.uniform(90, 260)
        ry = rx * random.uniform(.28, .5)
        ox = cx + random.uniform(-180, 180)
        oy = cy + random.uniform(-70, 70)
        md.ellipse([ox - rx, oy - ry, ox + rx, oy + ry], fill=random.randint(26, 62))
mist = mist.filter(ImageFilter.GaussianBlur(58))
base = Image.composite(Image.new('RGB', (NW, NH), (176, 202, 206)), base, mist)

# ----------------------------------------------------------------- vignette
vig = Image.new('L', (NW // 4, NH // 4), 0)
vp = vig.load()
cx, cy = NW / 8, NH / 8
for y in range(NH // 4):
    for x in range(NW // 4):
        dd = (((x - cx) / (NW / 8 * .96)) ** 2 + ((y - cy) / (NH / 8 * 1.0)) ** 2) ** .5
        vp[x, y] = int(max(0, min(1, (dd - .86) / .46)) * 180)
vig = vig.resize((NW, NH), Image.BICUBIC).filter(ImageFilter.GaussianBlur(48))
base = Image.composite(Image.new('RGB', (NW, NH), (4, 15, 21)), base, vig)

os.makedirs('public', exist_ok=True)
base.save(DST, quality=86, optimize=True, progressive=True)
print(base.size, round(os.path.getsize(DST) / 1024), 'KB')
print('bounds west/east:', 99.5696397 - PAD * A_LNG, 104.8175580 + PAD * A_LNG)
