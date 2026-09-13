import type { TravelMode } from './travel'

/**
 * The mock stand-in for the agent's routing decision.
 *
 * In production an agent decides how each leg is travelled and hands the answer
 * back as `TravelMode`. Here that judgement is hard-coded: an explicit table for
 * the pairs worth calling out by name, and a short set of rules for everything
 * else. The point is that the mode is *chosen and stored on the leg*, never
 * re-derived from geometry further down the pipeline.
 */

export interface LandLegContext {
  fromId: string
  toId: string
  km: number
  /** True when the leg is an approach to, or exit from, an airport or port. */
  hubTransfer: boolean
}

/** Named decisions: these win over the rules below, in either direction. */
const DECIDED: Record<string, TravelMode> = {
  'base|penang-streetfood': 'train',
  'base|penang-streetart': 'train',
  'base|penang-hill': 'train',
  'base|ipoh-oldtown': 'train',
  'base|melaka-stadthuys': 'car',
  'base|jb-nightmarket': 'train',
  'kl-petronas|kl-tower': 'walk',
  'kl-petronas|jalan-alor': 'walk',
  'jalan-alor|kl-nightmarket': 'walk',
  'kl-nightmarket|kl-perdana': 'walk',
  'melaka-stadthuys|melaka-jonker': 'walk',
  'penang-streetart|penang-streetfood': 'walk',
  'cameron-tea|cameron-mossy': 'car',
  'ipoh-oldtown|ipoh-kellies': 'car',
  'penang-streetfood|penang-hill': 'car',
  'kotabharu-market|crystal-mosque': 'car',
}

const keyFor = (a: string, b: string) => `${a}|${b}`

/**
 * Mode for a leg that stays on land. Hub approaches are always road transfers —
 * nobody takes an intercity train to the jetty in this prototype.
 */
export const decideLandMode = ({ fromId, toId, km, hubTransfer }: LandLegContext): TravelMode => {
  const decided = DECIDED[keyFor(fromId, toId)] ?? DECIDED[keyFor(toId, fromId)]
  if (decided) return decided

  if (hubTransfer) return 'car'
  if (km < 2.5) return 'walk'
  if (km < 170) return 'car'
  return 'train'
}
