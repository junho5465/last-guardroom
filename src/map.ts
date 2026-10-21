/** Shared battlefield geometry for simulation, art and touch controls. */
export const MAP_WIDTH = 500;
export const MAP_HEIGHT = 590;
export const SLOT_COLUMNS = 3;
export const SLOT_ROWS = 4;
export const floorY = (row: number) => 185 + row * 90;
export const slotX = (slot: number) => 166 + (slot % SLOT_COLUMNS) * 84;
export const ROUTE = [
  { x: 70, y: 100 },
  { x: 70, y: 550 },
  { x: 430, y: 550 },
  { x: 430, y: 100 },
  { x: 250, y: 100 },
  { x: 250, y: 65 },
] as const;
export const ROUTE_LENGTH = ROUTE.slice(1).reduce(
  (sum, p, i) => sum + Math.hypot(p.x - ROUTE[i].x, p.y - ROUTE[i].y),
  0,
);
/** The legacy x field remains a travel clock so existing saves can be resumed. */
export function enemyPosition(enemy: { x: number }) {
  let remaining = Math.max(0, Math.min(1, (465 - enemy.x) / 431)) * ROUTE_LENGTH;
  for (let i = 1; i < ROUTE.length; i++) {
    const a = ROUTE[i - 1],
      b = ROUTE[i],
      distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= distance) {
      const t = remaining / distance;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= distance;
  }
  return { ...ROUTE[ROUTE.length - 1] };
}
export function distanceToEnemy(slot: number, enemy: { x: number }) {
  const p = enemyPosition(enemy);
  return Math.hypot(p.x - slotX(slot), p.y - floorY(Math.floor(slot / 3)));
}
export function enemyDistance(a: { x: number }, b: { x: number }) {
  const p = enemyPosition(a),
    q = enemyPosition(b);
  return Math.hypot(p.x - q.x, p.y - q.y);
}
export const effectiveRange = (range: number, bonus = 0, star = 1) =>
  range * 0.62 * (1 + bonus + 0.08 * (star - 1));
export const BASE_SPEED = 2;
export const FAST_SPEED = 4;
export const WAVE_OPENING_DELAY = 0.75;
export const MIN_WAVE_TIME = 12;
