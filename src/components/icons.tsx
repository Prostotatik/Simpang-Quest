import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
})

export const IconChevron = (p: P) => (<svg {...base(p)}><path d="M9 5l7 7-7 7" /></svg>)
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>)
export const IconX = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>)
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="M4 12.5l5 5L20 6.5" /></svg>)
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
)
export const IconShare = (p: P) => (
  <svg {...base(p)}><path d="M4 13c4-8 10-9 14-9M13 2l5 2-5 3" /><path d="M4 13v6a1 1 0 001 1h14a1 1 0 001-1v-5" /></svg>
)

export const IconCalendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
    <path d="M7 14h2M11 14h2M15 14h2M7 17.5h2M11 17.5h2" strokeWidth={1.4} />
  </svg>
)
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></svg>
)
export const IconCoin = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="6" strokeWidth={1.2} />
    <path d="M12 9c-1.5 0-2.2 1-2.2 1.9 0 2 4.4 1.4 4.4 3.3 0 1-.9 1.8-2.2 1.8" strokeWidth={1.2} />
  </svg>
)
export const IconBook = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2 2 0 016 4h5v16H6a2 2 0 01-2-2z" /><path d="M20 5.5A2 2 0 0018 4h-5v16h5a2 2 0 002-2z" />
    <path d="M7 8h2M7 11h2M15 8h2M15 11h2" strokeWidth={1.2} />
  </svg>
)
export const IconCloud = (p: P) => (
  <svg {...base(p)}>
    <path d="M7.5 19a4.5 4.5 0 01-.6-8.96A5.5 5.5 0 0117.9 10.2 3.9 3.9 0 0117 19z" />
  </svg>
)
export const IconLeaf = (p: P) => (
  <svg {...base(p)}><path d="M4 20c0-8 5-13 16-14 0 10-5 15-13 15H4z" /><path d="M9 16c2-3 4-5 7-6.5" strokeWidth={1.2} /></svg>
)
export const IconDrumstick = (p: P) => (
  <svg {...base(p)}><path d="M14.5 4a5 5 0 014 8.2c-1 1.2-2.8 1-3.7 2s-.6 2.8-1.8 3.8A4.2 4.2 0 018 12.4c1-1.2 2.8-1 3.7-2s.6-2.8 1.8-3.8" /><path d="M8.6 15.4l-3 3M6.2 16.4l1.4 1.4" strokeWidth={1.3} /></svg>
)
export const IconTent = (p: P) => (
  <svg {...base(p)}><path d="M12 4L3 19h18L12 4z" /><path d="M12 9l-5 10M12 9l5 10" strokeWidth={1.2} /></svg>
)
export const IconGoblet = (p: P) => (
  <svg {...base(p)}><path d="M6 4h12l-1.2 5A5 5 0 0112 13a5 5 0 01-4.8-4L6 4z" /><path d="M12 13v5M8.5 20h7" /></svg>
)
export const IconWheelchair = (p: P) => (
  <svg {...base(p)}><circle cx="10" cy="4.5" r="1.6" /><path d="M9 8v5h4l3 6M6 11a5.5 5.5 0 106.5 8" /></svg>
)
export const IconUsers = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0111 0" /><path d="M16 5.5a3.2 3.2 0 010 5M17.5 19a5.6 5.6 0 00-2-4" strokeWidth={1.3} /></svg>
)
export const IconSparkle = (p: P) => (
  <svg {...base(p)}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" /></svg>
)
export const IconMapPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
)

export const IconScroll = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
    <path d="M4 6.5h4M4 17.5h4" strokeWidth={2.2} />
    <path d="M10 9h6M10 12h6M10 15h4" strokeWidth={1.2} />
  </svg>
)
export const IconCompassSmall = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>
)
export const IconRadius = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
    <path d="M12 12l6-3" />
  </svg>
)

/**
 * A struck gold coin. Detail is deliberately sparse: at 14 px a milled edge and
 * a busy face turn to mush, so this reads as rim + field + one highlight.
 */
export const GoldCoin = ({ size = 15 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0" aria-hidden>
    <defs>
      <linearGradient id="sq-coin-rim" x1="0.25" y1="0" x2="0.75" y2="1">
        <stop offset="0%" stopColor="#ffeeb8" />
        <stop offset="50%" stopColor="#d9a63b" />
        <stop offset="100%" stopColor="#8a5c14" />
      </linearGradient>
      <linearGradient id="sq-coin-face" x1="0.3" y1="0" x2="0.7" y2="1">
        <stop offset="0%" stopColor="#ffe9a8" />
        <stop offset="55%" stopColor="#e8bb52" />
        <stop offset="100%" stopColor="#b07f22" />
      </linearGradient>
    </defs>

    {/* rim */}
    <circle cx="12" cy="12" r="11" fill="url(#sq-coin-rim)"
      stroke="#5e3d0c" strokeWidth="1.1" strokeOpacity=".8" />

    {/* recessed field */}
    <circle cx="12" cy="12" r="8" fill="url(#sq-coin-face)"
      stroke="#7d5412" strokeWidth="1" strokeOpacity=".55" />

    {/* a single struck mark, large enough to survive the downscale */}
    <circle cx="12" cy="12" r="3.4" fill="none" stroke="#8a5f16" strokeWidth="1.6" strokeOpacity=".45" />

    {/* specular */}
    <ellipse cx="8.6" cy="8.2" rx="2.8" ry="1.8" fill="#fffbee" opacity=".55"
      transform="rotate(-34 8.6 8.2)" />
  </svg>
)

export const CompassRose = (p: P) => (
  <svg viewBox="0 0 100 100" fill="none" {...p}>
    <defs>
      <linearGradient id="cg" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" stopColor="#fdf0c8" /><stop offset="38%" stopColor="#e4bb63" />
        <stop offset="72%" stopColor="#c08f2c" /><stop offset="100%" stopColor="#7f591b" />
      </linearGradient>
      <linearGradient id="cg2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e8c887" /><stop offset="100%" stopColor="#8d6420" />
      </linearGradient>
    </defs>
    <g transform="rotate(45 50 50)">
      <path d="M50 20 L55.5 44.5 L80 50 L55.5 55.5 L50 80 L44.5 55.5 L20 50 L44.5 44.5 Z"
        fill="url(#cg2)" stroke="#6b4a12" strokeWidth="0.7" />
    </g>
    <path d="M50 2 L56 44 L98 50 L56 56 L50 98 L44 56 L2 50 L44 44 Z"
      fill="url(#cg)" stroke="#6b4a12" strokeWidth="0.8" />
    <path d="M50 2 L56 44 L50 50 Z M50 98 L44 56 L50 50 Z" fill="#fdf0c8" opacity=".5" />
    <circle cx="50" cy="50" r="6.5" fill="#f7e3b0" stroke="#6b4a12" strokeWidth="0.8" />
    <circle cx="50" cy="50" r="2.6" fill="#7f591b" />
  </svg>
)
