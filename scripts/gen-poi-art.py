"""Generate painterly placeholder art for every POI.

The prototype ships no photo library, so each place gets a deterministic,
category-specific painted vignette instead of an unrelated stock photo.
Style target: the soft, hazy, hand-painted look of the fantasy map art.
"""
import math, os, random, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance

W, H = 600, 400
OUT = 'public/poi'
os.makedirs(OUT, exist_ok=True)

src = open('src/data/pois.ts', encoding='utf-8').read()
pois = [
    {'id': m.group(1), 'category': m.group(2)}
    for m in re.finditer(r"id: '([^']+)'[\s\S]{0,400}?category: '([a-z]+)'", src)
]


def seeded(pid):
    h = 0
    for ch in pid:
        h = (h * 131 + ord(ch)) % (2 ** 31)
    return random.Random(h)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def layer():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))


def grad_img(top, bottom, y0, y1):
    """Vertical gradient plate used to fill shapes so nothing reads as flat."""
    g = Image.new('RGB', (W, H), bottom)
    gd = ImageDraw.Draw(g)
    for y in range(H):
        t = min(1.0, max(0.0, (y - y0) / max(1, y1 - y0)))
        gd.line([(0, y), (W, y)], fill=mix(top, bottom, t))
    return g


def shade_fill(img, shape_fn, top, bottom, y0, y1, blur=1.0):
    mask = Image.new('L', (W, H), 0)
    shape_fn(ImageDraw.Draw(mask))
    if blur:
        mask = mask.filter(ImageFilter.GaussianBlur(blur))
    plate = grad_img(top, bottom, y0, y1).convert('RGBA')
    plate.putalpha(mask)
    img.alpha_composite(plate)


def vgrad(d, top, bottom, y0, y1):
    for y in range(y0, y1):
        t = (y - y0) / max(1, y1 - y0)
        d.line([(0, y), (W, y)], fill=mix(top, bottom, t))
    if y1 < H:
        d.rectangle([0, y1, W, H], fill=bottom)


def ridge_pts(rnd, y_base, amp, step=7):
    pts, x, y = [], -14, y_base
    while x <= W + 14:
        y += rnd.uniform(-amp, amp)
        y = max(y_base - amp * 2.6, min(y_base + amp * 1.8, y))
        pts.append((x, y))
        x += step
    return pts


def paint_ridge(img, rnd, y_base, amp, color, haze, step=7):
    pts = ridge_pts(rnd, y_base, amp, step)
    shade_fill(img, lambda dd: dd.polygon([(-14, H + 10)] + pts + [(W + 14, H + 10)], fill=255),
               mix(color, (255, 248, 220), .22), mix(color, (10, 14, 10), .35),
               y_base - 10, H, 0.9)
    if haze:
        hz = layer()
        hd = ImageDraw.Draw(hz)
        hd.polygon([(-14, H + 10)] + [(x, y + 26) for x, y in pts] + [(W + 14, H + 10)], fill=haze)
        hz = hz.filter(ImageFilter.GaussianBlur(16))
        img.alpha_composite(hz)


def peaks(img, rnd, base_y, count, hmin, hmax, color, blur=1.4):
    shapes = []
    for _ in range(count):
        cx = rnd.uniform(-50, W + 50)
        h = rnd.uniform(hmin, hmax)
        w = h * rnd.uniform(1.0, 1.8)
        shapes.append((cx, h, w))
    top_y = base_y - max(s[1] for s in shapes)
    shade_fill(img, lambda dd: [dd.polygon([(cx - w, base_y), (cx, base_y - h), (cx + w, base_y)], fill=255)
                                for cx, h, w in shapes],
               mix(color, (255, 250, 226), .3), mix(color, (12, 16, 20), .3), top_y, base_y, blur)
    lay = layer(); ld = ImageDraw.Draw(lay)
    for cx, h, w in shapes:
        ld.polygon([(cx, base_y - h), (cx + w * .3, base_y), (cx + w, base_y)],
                   fill=mix(color, (0, 0, 0), .3) + (120,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur + 1.4)))


def canopy(img, rnd, y, n, color, scale=1.0):
    lay = layer()
    d = ImageDraw.Draw(lay)
    for _ in range(n):
        x = rnd.uniform(-20, W + 20)
        s = rnd.uniform(10, 20) * scale
        yy = y + rnd.uniform(-6, 10)
        d.ellipse([x - s, yy - s * .8, x + s, yy + s * .7], fill=color + (255,))
        d.ellipse([x - s * .5, yy - s * 1.3, x + s * .7, yy], fill=mix(color, (255, 250, 220), .12) + (255,))
    lay = lay.filter(ImageFilter.GaussianBlur(1.6))
    img.alpha_composite(lay)


def sun(img, x, y, r, color, strength=210):
    lay = layer()
    d = ImageDraw.Draw(lay)
    for k in range(10, 0, -1):
        rr = r * k * .55
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=color + (int(strength / (k * 2.6)),))
    d.ellipse([x - r, y - r, x + r, y + r], fill=color + (245,))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(3)))


def warp(im, rnd, amp=7.0):
    """Smooth random displacement so straight edges read as brush strokes."""
    small = (18, 12)
    fx = Image.fromarray((np.random.RandomState(rnd.randint(0, 2 ** 30))
                          .rand(small[1], small[0]) * 255).astype('uint8')).resize((W, H), Image.BICUBIC)
    fy = Image.fromarray((np.random.RandomState(rnd.randint(0, 2 ** 30))
                          .rand(small[1], small[0]) * 255).astype('uint8')).resize((W, H), Image.BICUBIC)
    dx = (np.asarray(fx, dtype=np.float32) / 255.0 - 0.5) * 2 * amp
    dy = (np.asarray(fy, dtype=np.float32) / 255.0 - 0.5) * 2 * amp * 0.6
    ys, xs = np.mgrid[0:H, 0:W]
    sx = np.clip((xs + dx).round().astype(np.int32), 0, W - 1)
    sy = np.clip((ys + dy).round().astype(np.int32), 0, H - 1)
    arr = np.asarray(im)
    return Image.fromarray(arr[sy, sx])


def make(pid, cat):
    rnd = seeded(pid)
    warm = rnd.uniform(-14, 16)

    def c(rgb, k=1.0):
        return tuple(max(0, min(255, int(v * k + warm * (0.9 if i == 0 else (0.2 if i == 1 else -0.7)))))
                     for i, rgb_i, v in zip(range(3), rgb, rgb))

    img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)

    if cat in ('nature', 'poi'):
        sky_t, sky_b = c((122, 158, 184)), c((234, 214, 172))
        vgrad(d, sky_t, sky_b, 0, 250)
        sun(img, W * rnd.uniform(.55, .8), rnd.uniform(48, 92), 26, c((255, 240, 196)))
        peaks(img, rnd, 236, 4, 96, 168, mix(c((96, 116, 124)), sky_b, .45), 2.2)
        peaks(img, rnd, 254, 4, 66, 118, mix(c((82, 106, 98)), sky_b, .26), 1.6)
        paint_ridge(img, rnd, 262, 8, c((66, 96, 66)), (226, 226, 208, 74))
        paint_ridge(img, rnd, 300, 10, c((52, 82, 52)), (220, 224, 204, 46))
        canopy(img, rnd, 322, 22, c((38, 66, 42)))
        paint_ridge(img, rnd, 352, 9, c((40, 66, 40)), None)
        canopy(img, rnd, 382, 16, c((26, 50, 32)), 1.4)

    elif cat == 'beach':
        sky_t, sky_b = c((118, 168, 198)), c((240, 226, 190))
        vgrad(d, sky_t, sky_b, 0, 180)
        sun(img, W * rnd.uniform(.16, .34), rnd.uniform(40, 78), 22, c((255, 246, 214)))
        peaks(img, rnd, 182, 3, 46, 84, mix(c((96, 122, 124)), sky_b, .42), 2.0)
        sea = layer(); sd = ImageDraw.Draw(sea)
        for y in range(180, 302):
            t = (y - 180) / 122
            sd.line([(0, y), (W, y)], fill=mix(c((22, 104, 128)), c((92, 196, 186)), t) + (255,))
        for _ in range(70):
            y = rnd.uniform(184, 300); x = rnd.uniform(-40, W)
            l = rnd.uniform(22, 110) * (0.6 + (y - 180) / 90)
            sd.line([(x, y), (x + l, y)], fill=c((214, 240, 236)) + (rnd.randint(50, 130),), width=1)
        img.alpha_composite(sea.filter(ImageFilter.GaussianBlur(0.9)))
        fg = layer(); fd = ImageDraw.Draw(fg)
        fd.polygon([(-10, 306), (W + 10, 292), (W + 10, H + 10), (-10, H + 10)], fill=c((226, 204, 162)) + (255,))
        fd.polygon([(-10, 300), (W + 10, 288), (W + 10, 316), (-10, 330)], fill=c((246, 234, 204)) + (210,))
        img.alpha_composite(fg.filter(ImageFilter.GaussianBlur(1.4)))
        pl = layer(); pd = ImageDraw.Draw(pl)
        for _ in range(rnd.randint(1, 3)):
            px = rnd.uniform(30, W - 30); top = rnd.uniform(190, 240)
            pd.line([(px, H), (px - 16, top)], fill=c((52, 44, 32)) + (255,), width=7)
            for a in range(7):
                ang = math.pi + a * math.pi / 6 + rnd.uniform(-.18, .18)
                pd.line([(px - 16, top), (px - 16 + math.cos(ang) * 62, top + math.sin(ang) * 38)],
                        fill=c((30, 66, 44)) + (255,), width=8)
        img.alpha_composite(pl.filter(ImageFilter.GaussianBlur(1.1)))

    elif cat == 'city':
        vgrad(d, c((24, 36, 66)), c((222, 146, 96)), 0, 260)
        sun(img, W * rnd.uniform(.6, .82), 208, 20, c((255, 206, 140)), 170)
        for i, (col, ymin, ymax, lit) in enumerate([
            (mix(c((52, 62, 92)), c((222, 146, 96)), .34), 96, 180, False),
            (mix(c((30, 40, 64)), c((222, 146, 96)), .16), 70, 216, False),
            (c((14, 20, 34)), 110, 258, True),
        ]):
            lay = layer(); ld = ImageDraw.Draw(lay)
            x = -24
            while x < W + 24:
                w = rnd.uniform(24, 62); h = rnd.uniform(ymin, ymax)
                ld.rectangle([x, 300 - h, x + w, 322], fill=col + (255,))
                if lit:
                    for wy in range(int(300 - h) + 12, 298, 13):
                        for wx in range(int(x) + 6, int(x + w) - 7, 11):
                            if rnd.random() < .42:
                                ld.rectangle([wx, wy, wx + 4, wy + 6], fill=c((252, 218, 146)) + (rnd.randint(140, 245),))
                x += w + rnd.uniform(2, 11)
            img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(0.7 + (2 - i) * 0.7)))
        wl = layer(); wd = ImageDraw.Draw(wl)
        wd.rectangle([0, 318, W, H], fill=c((12, 20, 34)) + (255,))
        for _ in range(150):
            x = rnd.uniform(0, W); y = rnd.uniform(320, H)
            wd.line([(x, y), (x + rnd.uniform(8, 34), y)], fill=c((214, 158, 96)) + (rnd.randint(24, 90),), width=1)
        img.alpha_composite(wl.filter(ImageFilter.GaussianBlur(1.2)))

    elif cat == 'culture':
        sky_t, sky_b = c((168, 150, 154)), c((242, 218, 178))
        vgrad(d, sky_t, sky_b, 0, 260)
        sun(img, W * rnd.uniform(.2, .38), rnd.uniform(46, 90), 30, c((252, 238, 206)))
        peaks(img, rnd, 250, 3, 60, 108, mix(c((104, 110, 112)), sky_b, .5), 2.4)
        base, top = 304, rnd.uniform(118, 148)
        cx = W * rnd.uniform(.40, .60)
        lay = layer(); ld = ImageDraw.Draw(lay)
        for i in range(5):
            w = 152 - i * 25
            y0 = base - (i + 1) * 31
            ld.polygon([(cx - w, y0 + 33), (cx - w * .93, y0), (cx + w * .93, y0), (cx + w, y0 + 33)],
                       fill=mix(c((104, 74, 56)), c((158, 118, 78)), i / 5) + (255,))
            ld.line([(cx - w * .93, y0), (cx + w * .93, y0)], fill=c((198, 160, 104)) + (200,), width=2)
        ld.polygon([(cx - 38, top + 26), (cx, top - 48), (cx + 38, top + 26)], fill=c((92, 64, 50)) + (255,))
        ld.polygon([(cx, top - 48), (cx + 38, top + 26), (cx + 6, top + 26)], fill=c((72, 48, 38)) + (255,))
        ld.rectangle([cx - 6, top - 82, cx + 6, top - 42], fill=c((214, 172, 92)) + (255,))
        for sx in (cx - 196, cx + 196):
            ld.rectangle([sx - 15, base - 104, sx + 15, base], fill=c((88, 62, 48)) + (255,))
            ld.polygon([(sx - 27, base - 104), (sx, base - 150), (sx + 27, base - 104)], fill=c((74, 52, 42)) + (255,))
        img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(1.0)))
        gl = layer(); gd = ImageDraw.Draw(gl)
        gd.polygon([(-10, 300), (W + 10, 308), (W + 10, H + 10), (-10, H + 10)], fill=c((118, 100, 68)) + (255,))
        img.alpha_composite(gl.filter(ImageFilter.GaussianBlur(1.2)))
        canopy(img, rnd, 328, 14, c((44, 68, 44)), 1.1)

    else:  # food — night market
        vgrad(d, c((40, 22, 18)), c((96, 46, 26)), 0, H)
        stalls = layer(); sd = ImageDraw.Draw(stalls)
        for _ in range(9):
            x = rnd.uniform(-60, W); w = rnd.uniform(80, 168)
            sd.rectangle([x, 206, x + w, 312], fill=c((46, 28, 22)) + (255,))
            sd.polygon([(x - 12, 210), (x + w / 2, 168), (x + w + 12, 210)], fill=c((130, 46, 34)) + (255,))
            sd.line([(x - 12, 210), (x + w + 12, 210)], fill=c((198, 142, 70)) + (180,), width=2)
        img.alpha_composite(stalls.filter(ImageFilter.GaussianBlur(1.6)))
        lamps = layer(); ld = ImageDraw.Draw(lamps)
        for _ in range(26):
            x = rnd.uniform(0, W); y = rnd.uniform(26, 196); r = rnd.uniform(6, 15)
            for k in range(8, 0, -1):
                rr = r * k * .62
                ld.ellipse([x - rr, y - rr, x + rr, y + rr], fill=c((255, 186, 92)) + (int(130 / (k * 2.2)),))
            ld.ellipse([x - r, y - r, x + r, y + r], fill=c((255, 224, 156)) + (250,))
        img.alpha_composite(lamps.filter(ImageFilter.GaussianBlur(2.2)))
        fl = layer(); fd = ImageDraw.Draw(fl)
        fd.rectangle([0, 300, W, H], fill=c((28, 18, 14)) + (255,))
        for _ in range(90):
            x = rnd.uniform(0, W); y = rnd.uniform(304, H)
            fd.ellipse([x, y, x + rnd.uniform(5, 16), y + rnd.uniform(2, 5)],
                       fill=c((212, 142, 62)) + (rnd.randint(30, 110),))
        img.alpha_composite(fl.filter(ImageFilter.GaussianBlur(1.8)))

    out = img.convert('RGB')

    # --- painterly pass: brush wobble, canvas tooth, warm grade, vignette ---
    out = warp(out, rnd, 3.0 if cat in ('city', 'culture') else 7.0)
    if cat == 'food':
        out = ImageEnhance.Brightness(out).enhance(1.24)
    out = out.filter(ImageFilter.GaussianBlur(0.9))
    out = ImageEnhance.Sharpness(out).enhance(1.35)

    grain = Image.effect_noise((W, H), 26).convert('L').filter(ImageFilter.GaussianBlur(0.5))
    out = Image.blend(out, ImageChops.multiply(out, Image.merge('RGB', (grain, grain, grain))), 0.14)

    tint = Image.new('RGB', (W, H), (232, 196, 140))
    out = Image.blend(out, ImageChops.multiply(out, tint), 0.30)
    out = ImageEnhance.Color(out).enhance(1.12)
    out = ImageEnhance.Contrast(out).enhance(1.06)

    vig = Image.new('L', (W, H), 255)
    vd = ImageDraw.Draw(vig)
    for i in range(70):
        k = i / 70
        vd.rectangle([i * 2.2, i * 1.6, W - i * 2.2, H - i * 1.6], outline=int(255 - 120 * (1 - k)))
    vig = vig.filter(ImageFilter.GaussianBlur(30))
    out = Image.composite(out, Image.new('RGB', (W, H), (26, 18, 12)), vig)
    return out


for p in pois:
    make(p['id'], p['category']).save(f"{OUT}/{p['id']}.jpg", quality=84, optimize=True)
print('written', len(os.listdir(OUT)), 'files',
      round(sum(os.path.getsize(f'{OUT}/{f}') for f in os.listdir(OUT)) / 1024), 'KB')
