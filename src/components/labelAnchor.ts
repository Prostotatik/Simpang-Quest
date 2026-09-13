import type { CSSProperties } from 'react'

export type LabelSide = 'above' | 'below' | 'left' | 'right'
export interface LabelPlacement {
  side: LabelSide
  /** Sideways nudge, in pixels, for captions that sit above or below. */
  shift: number
}

/**
 * Captions are pushed outward along the same vector their node was fanned out
 * on, so nodes sharing a cluster never stack their labels on each other.
 */
export const labelSide = (offset?: { x: number; y: number }): LabelPlacement => {
  if (!offset || (Math.abs(offset.x) < 6 && Math.abs(offset.y) < 6)) {
    return { side: 'below', shift: 0 }
  }
  if (Math.abs(offset.x) > Math.abs(offset.y)) {
    return { side: offset.x > 0 ? 'right' : 'left', shift: 0 }
  }
  return { side: offset.y > 0 ? 'below' : 'above', shift: offset.x }
}

/** Absolute positioning for a caption on the given side of a ~36 px marker. */
export const captionAnchor = (label: LabelPlacement): CSSProperties => {
  if (label.side === 'left') {
    return { right: 40, top: '50%', transform: 'translateY(-50%)', textAlign: 'right' }
  }
  if (label.side === 'right') {
    return { left: 40, top: '50%', transform: 'translateY(-50%)', textAlign: 'left' }
  }
  const vertical = label.side === 'above' ? { bottom: 38 } : { top: 38 }
  return {
    ...vertical,
    left: '50%',
    transform: `translateX(calc(-50% + ${Math.round(label.shift * 0.5)}px))`,
    textAlign: 'center',
  }
}
