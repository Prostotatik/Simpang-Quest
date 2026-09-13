"""Render the README's diagrams.

Drawn rather than hand-placed so they restyle in one edit and stay legible at
GitHub's rendering width. Palette matches the app: parchment, ink, gold, ocean.
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = 'docs'
os.makedirs(OUT, exist_ok=True)

PARCH = (232, 216, 181)
INK = (43, 29, 15)
INK_SOFT = (107, 84, 58)
GOLD = (196, 145, 45)
GOLD_LT = (243, 221, 158)
OCEAN = (16, 58, 71)
GREY = (150, 143, 128)
RED = (150, 66, 48)
GREEN = (78, 110, 52)


def font(size, bold=False):
    for name in (
        'georgiab.ttf' if bold else 'georgia.ttf',
        'seguisb.ttf' if bold else 'segoeui.ttf',
        'DejaVuSerif-Bold.ttf' if bold else 'DejaVuSerif.ttf',
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def text_w(d, s, f):
    return d.textbbox((0, 0), s, font=f)[2]


def card(d, box, title, lines, fill=PARCH, edge=INK, title_col=INK, body_col=INK_SOFT,
         ts=17, bs=13, radius=10):
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0 + 3, y0 + 4, x1 + 3, y1 + 4], radius, fill=(0, 0, 0, 40))
    d.rounded_rectangle(box, radius, fill=fill, outline=edge, width=2)
    ft, fb = font(ts, True), font(bs)
    d.text((x0 + 14, y0 + 11), title, font=ft, fill=title_col)
    y = y0 + 13 + ts + 6
    for ln in lines:
        d.text((x0 + 14, y), ln, font=fb, fill=body_col)
        y += bs + 6


def arrow(d, a, b, col=GOLD, w=3, head=9, dashed=False):
    x0, y0 = a
    x1, y1 = b
    if dashed:
        import math
        total = math.hypot(x1 - x0, y1 - y0)
        steps = max(1, int(total // 12))
        for i in range(steps):
            t0, t1 = i / steps, (i + 0.55) / steps
            d.line([x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0,
                    x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1], fill=col, width=w)
    else:
        d.line([a, b], fill=col, width=w)
    import math
    ang = math.atan2(y1 - y0, x1 - x0)
    d.polygon([
        (x1, y1),
        (x1 - head * math.cos(ang - 0.5), y1 - head * math.sin(ang - 0.5)),
        (x1 - head * math.cos(ang + 0.5), y1 - head * math.sin(ang + 0.5)),
    ], fill=col)


def canvas(w, h):
    img = Image.new('RGB', (w, h), (247, 243, 233))
    return img, ImageDraw.Draw(img)


def heading(d, x, y, s, col=INK, size=21):
    d.text((x, y), s, font=font(size, True), fill=col)


# ---------------------------------------------------------------- 1. pivot
def pivot():
    W, H = 1180, 430
    img, d = canvas(W, H)
    heading(d, 34, 24, 'Why we restarted')

    card(d, (34, 70, 430, 250), 'Project v1  —  dropped',
         ['Working backend, real AI integration.',
          'Solved a real problem, technically sound.',
          '',
          'But: the idea read as generic, and the',
          'interface gave a judge nothing to feel.'],
         fill=(238, 226, 226), edge=RED, title_col=RED)

    card(d, (34, 270, 430, 390), 'Mentor consultation',
         ['Advised us to rethink the concept and',
          'lean into a creative, distinctive angle.'],
         fill=(244, 238, 224), edge=GOLD, title_col=INK)

    arrow(d, (440, 230), (560, 230), col=GOLD, w=4, head=12)
    d.text((452, 196), 'pivot', font=font(15, True), fill=GOLD)

    card(d, (570, 70, 1146, 390), 'Simpang Quest  —  kept',
         ['Same domain, opposite bet: put everything into the',
          'experience and let the planning read as an adventure.',
          '',
          'A group fills in character sheets. Gemini turns them',
          'into a quest on a hand-drawn map.',
          '',
          'The AI sits where the difficulty actually is: not',
          'answering questions, but reconciling six people into',
          'one set of terms nobody had to negotiate.',
          '',
          'Grounded in real places, shown on a map you want',
          'to look at.'],
         fill=PARCH, edge=GREEN, title_col=GREEN)

    img.save(f'{OUT}/pivot.png')


# ------------------------------------------------------------- 2. user flow
def user_flow():
    W, H = 1180, 520
    img, d = canvas(W, H)
    heading(d, 34, 24, 'User flow  —  people in, quest out')

    steps = [
        ('1  Character sheet', ['name, age, diet', 'access needs', 'interests', 'free dates',
                                'max trip days', 'wanted regions', 'personal budget']),
        ('2  Party assembles', ['up to 6 sheets', 'nothing about the', 'trip is typed in']),
        ('3  Terms derived', ['shared free window', 'strictest trip cap', 'summed budget',
                              'radius that reaches', 'requested regions']),
        ('4  Orchestrator', ['scores every place', 'against the party', 'builds a day-by-day',
                             'loop from home']),
        ('5  The quest', ['nodes ink in one', 'by one on the map', 'journal by day',
                          'swap on closure']),
    ]
    MARGIN, GAP = 34, 33
    w = (W - MARGIN * 2 - GAP * (len(steps) - 1)) // len(steps)
    x = MARGIN
    for i, (title, lines) in enumerate(steps):
        card(d, (x, 80, x + w, 300), title, lines, ts=15, bs=12)
        if i < len(steps) - 1:
            arrow(d, (x + w + 5, 190), (x + w + GAP - 5, 190), col=GOLD, w=3, head=9)
        x += w + GAP

    card(d, (34, 330, 1146, 480), 'The point',
         ['Nobody negotiates dates, budget or radius by hand — those are consequences, not inputs.',
          'Six people each describe themselves once, and the trip falls out of the overlap.',
          'Every derived number is inspectable: the Trip panel explains where each figure came from',
          'and links straight back to the traveller responsible for it.'],
         fill=(244, 238, 224), edge=GOLD, title_col=INK)

    img.save(f'{OUT}/user-flow.png')


# ----------------------------------------------------- 3. derivation (why)
def derivation():
    W, H = 1180, 560
    img, d = canvas(W, H)
    heading(d, 34, 24, 'How party sheets become trip terms')

    card(d, (34, 80, 300, 380), 'Party sheets  (input)',
         ['free dates per person', 'max trip days', 'preferred regions',
          'personal budget', 'interests, diet, access'],
         fill=PARCH, edge=INK)

    rules = [
        ('shared window', 'longest run where', 'everyone is free', 120),
        ('strictest cap', 'min(maxTripDays)', 'nobody is dragged past it', 190),
        ('sum of budgets', 'what the group', 'actually brings', 260),
        ('reach the wish', 'radius must include', 'any requested region', 330),
    ]
    for name, l1, l2, y in rules:
        card(d, (350, y - 34, 700, y + 30), name, [l1, l2],
             fill=(244, 238, 224), edge=GOLD, title_col=INK, ts=14, bs=11, radius=8)
        arrow(d, (304, 230), (346, y - 2), col=GOLD, w=2, head=7)

    card(d, (750, 80, 1146, 380), 'Trip terms  (output, read-only)',
         ['startDate / endDate', 'maxDurationDays', 'budgetRM', 'startLocationId',
          'maxTravelKm', '', 'plus limits: why it came', 'out this length'],
         fill=PARCH, edge=GREEN, title_col=GREEN)
    for _, _, _, y in rules:
        arrow(d, (704, y - 2), (746, 230), col=GOLD, w=2, head=7)

    card(d, (34, 410, 1146, 520), 'One clean boundary',
         ['deriveTrip(members, previous) takes the whole party and returns the complete Trip, so the',
          'reasoning lives behind a single call — and every figure it returns carries the rule it came from.'],
         fill=(238, 234, 226), edge=GREY, title_col=INK_SOFT)

    img.save(f'{OUT}/derivation.png')


# ------------------------------------------------------- 4. architecture
def architecture():
    W, H = 1180, 620
    img, d = canvas(W, H)
    heading(d, 34, 24, 'Target architecture  (build phase)')

    card(d, (34, 80, 380, 300), 'Client  —  React + TS + Vite',
         ['Tailwind v4 theme (parchment / gold)', 'Zustand: one source of truth',
          'Framer Motion: reveal + stroke-on', '@react-google-maps/api',
          '', 'Hosted on Vercel'],
         fill=PARCH, edge=INK)

    card(d, (420, 80, 760, 300), 'Supabase',
         ['Postgres: parties, sheets, trips,', 'itineraries, journal state',
          'Auth: one account per traveller', 'Realtime: the party edits together',
          '', 'Row-level security per party'],
         fill=(224, 236, 236), edge=OCEAN, title_col=OCEAN)

    card(d, (800, 80, 1146, 300), 'Gemini',
         ['Map grounding: real places,', 'hours, closures, prices',
          'Search grounding: seasonal', 'advice, current events',
          '', 'Derives the trip from the party', 'and picks each travel leg'],
         fill=(238, 232, 242), edge=(94, 68, 122), title_col=(94, 68, 122))

    card(d, (420, 340, 760, 470), 'Google Maps JS API',
         ['Live map object + ground overlay', 'Directions for real road geometry',
          '', 'Custom markers, routes, legends'],
         fill=(234, 230, 220), edge=GREEN, title_col=GREEN)

    arrow(d, (384, 160), (416, 160), col=GOLD, w=3)
    arrow(d, (764, 160), (796, 160), col=GOLD, w=3)
    arrow(d, (200, 304), (430, 366), col=GREEN, w=3)

    card(d, (34, 500, 1146, 600), 'Constraint we expect',
         ['Gemini grounding is rate-limited on the free tier, so plans are generated on the server and cached',
          'per party in Postgres rather than re-asked on every edit. The map key stays browser-side but is',
          'domain-restricted; Directions results are cached for the session, as they already are today.'],
         fill=(238, 234, 226), edge=GREY, title_col=INK_SOFT)

    img.save(f'{OUT}/architecture.png')


for fn in (pivot, user_flow, derivation, architecture):
    fn()
    print('wrote', fn.__name__)
print('files:', sorted(os.listdir(OUT)))
