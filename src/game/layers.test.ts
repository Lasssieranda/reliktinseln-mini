import { describe, expect, it } from 'vitest';
import { HUT_L3_DRAW_SCALE } from './fx';
import { computeLayout, hutHitRect, QUARRY_RECT, RELIC_RECT, RELIC2_RECT, type Rect } from './layers';

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function aabbGap(a: Rect, b: Rect): number {
  const gapX =
    a.x >= b.x + b.w ? a.x - (b.x + b.w) : b.x >= a.x + a.w ? b.x - (a.x + a.w) : 0;
  const gapY =
    a.y >= b.y + b.h ? a.y - (b.y + b.h) : b.y >= a.y + a.h ? b.y - (a.y + a.h) : 0;
  if (gapX > 0 && gapY > 0) {
    return Math.hypot(gapX, gapY);
  }
  return Math.max(gapX, gapY);
}

describe('hut L3 relic layout hotfix', () => {
  it('uses hut L3 draw scale 1.28 instead of 1.22 * 1.18', () => {
    expect(HUT_L3_DRAW_SCALE).toBe(1.28);
  });

  it('keeps relic hits at least 48px', () => {
    expect(RELIC_RECT.w).toBeGreaterThanOrEqual(48);
    expect(RELIC_RECT.h).toBeGreaterThanOrEqual(48);
    expect(RELIC2_RECT.w).toBeGreaterThanOrEqual(48);
    expect(RELIC2_RECT.h).toBeGreaterThanOrEqual(48);
    const layout = computeLayout({
      hutLevel: 3,
      quarryLevel: 3,
      shrineBuilt: true,
      relic1: true,
      relic2: true,
    });
    expect(layout.relic.w).toBeGreaterThanOrEqual(48);
    expect(layout.relic.h).toBeGreaterThanOrEqual(48);
    expect(layout.relic2.w).toBeGreaterThanOrEqual(48);
    expect(layout.relic2.h).toBeGreaterThanOrEqual(48);
  });

  it('keeps relic rects off the L3 hut AABB with at least 16px air', () => {
    const hut = hutHitRect(3);
    expect(rectsOverlap(RELIC_RECT, hut)).toBe(false);
    expect(rectsOverlap(RELIC2_RECT, hut)).toBe(false);
    expect(aabbGap(RELIC_RECT, hut)).toBeGreaterThanOrEqual(16);
    expect(aabbGap(RELIC2_RECT, hut)).toBeGreaterThanOrEqual(16);
  });

  it('keeps Inselherz out of the quarry rect', () => {
    expect(rectsOverlap(RELIC2_RECT, QUARRY_RECT)).toBe(false);
  });
});
