export type TravelMode = 'walk' | 'car' | 'train' | 'ferry' | 'plane'

/**
 * How a leg is travelled is a *decision*, not a measurement.
 *
 * In the shipped product an agent fills this in per leg — it knows there is a
 * train line between these two cities, that this island only has a ferry, that
 * the party would rather drive than fly this stretch. Until then the mock
 * planner sets it explicitly in `src/engine/legs.ts`; nothing else is allowed to
 * infer a mode from raw distance, which is how a sea crossing once ended up
 * labelled as a train.
 */

/** Legs whose mode is fixed by geography, whatever the agent would prefer. */
export const CROSSING_MODE = {
  airport: 'plane',
  ferry: 'ferry',
} as const

export const MODE_LABEL: Record<TravelMode, string> = {
  plane: 'Flight', ferry: 'Ferry', train: 'Train', car: 'Drive', walk: 'On foot',
}

/**
 * Glyphs are drawn pointing "up" (towards negative Y) so the polyline symbol
 * renderer turns them to face the direction of travel.
 */
export const MODE_PATH: Record<TravelMode, string> = {
  plane:
    'M 0,-11 C 1.7,-11 2.5,-9 2.5,-6.4 L 2.5,-3.8 L 10.6,1.8 L 10.6,4 L 2.5,1.6 ' +
    'L 2.5,6.4 L 5.1,8.6 L 5.1,10.4 L 0,9 L -5.1,10.4 L -5.1,8.6 L -2.5,6.4 L -2.5,1.6 ' +
    'L -10.6,4 L -10.6,1.8 L -2.5,-3.8 L -2.5,-6.4 C -2.5,-9 -1.7,-11 0,-11 Z',
  ferry:
    'M 0,-11.5 L 3.6,-4.2 L 3.6,0.8 L 5.2,0.8 L 5.2,4.6 L 3.6,4.6 L 3.6,7 ' +
    'C 3.6,8.4 -3.6,8.4 -3.6,7 L -3.6,4.6 L -5.2,4.6 L -5.2,0.8 L -3.6,0.8 L -3.6,-4.2 Z',
  car:
    'M 0,-9.4 C 2.5,-9.4 3.8,-7.6 4.1,-5 L 4.3,-3.8 L 6.6,-3.8 L 6.6,-0.2 L 4.3,-0.2 ' +
    'L 4.3,3.2 L 6.6,3.2 L 6.6,6.8 L 4.3,6.8 L 4.3,7.4 C 4.3,9.1 3.3,9.7 2.1,9.7 ' +
    'L -2.1,9.7 C -3.3,9.7 -4.3,9.1 -4.3,7.4 L -4.3,6.8 L -6.6,6.8 L -6.6,3.2 L -4.3,3.2 ' +
    'L -4.3,-0.2 L -6.6,-0.2 L -6.6,-3.8 L -4.3,-3.8 L -4.1,-5 C -3.8,-7.6 -2.5,-9.4 0,-9.4 Z',
  train:
    'M 0,-11.4 C 2.7,-11.4 3.7,-9.3 3.7,-6.8 L 3.7,8.4 C 3.7,9.9 2.9,10.7 1.7,10.7 ' +
    'L -1.7,10.7 C -2.9,10.7 -3.7,9.9 -3.7,8.4 L -3.7,-6.8 C -3.7,-9.3 -2.7,-11.4 0,-11.4 Z ' +
    'M -5.6,-5.2 L 5.6,-5.2 L 5.6,-3.4 L -5.6,-3.4 Z ' +
    'M -5.6,1.4 L 5.6,1.4 L 5.6,3.2 L -5.6,3.2 Z',
  walk:
    'M 0,-10.4 C 3.4,-10.4 4.6,-7 4.2,-3.2 C 3.9,-0.2 1.8,1.8 0,1.8 C -1.8,1.8 -3.9,-0.2 -4.2,-3.2 ' +
    'C -4.6,-7 -3.4,-10.4 0,-10.4 Z ' +
    'M -2.7,4.6 C -1.2,3.7 1.2,3.7 2.7,4.6 C 3.6,6.1 2.4,9.4 0,9.4 C -2.4,9.4 -3.6,6.1 -2.7,4.6 Z',
}
