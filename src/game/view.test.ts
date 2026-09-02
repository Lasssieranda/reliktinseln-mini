import { describe, expect, it } from 'vitest';
import { computeLayout, QUARRY_RECT } from './layers';
import { canvasCssToStage, computeStageView, STAGE_H, STAGE_W } from './view';

describe('stage view', () => {
  it('contains 390×720 in an iPhone 390×844 canvas', () => {
    const view = computeStageView(390, 844);
    expect(view.scale).toBeCloseTo(1);
    expect(view.ox).toBeCloseTo(0);
    expect(view.oy).toBeCloseTo((844 - 720) / 2);
  });

  it('letterboxes a wide canvas and keeps island off the edges', () => {
    const view = computeStageView(1200, 720);
    expect(view.scale).toBeCloseTo(1);
    expect(view.ox).toBeCloseTo((1200 - STAGE_W) / 2);
    expect(view.oy).toBeCloseTo(0);
    expect(view.ox).toBeGreaterThan(100);
  });

  it('maps pointer CSS pixels into stage coordinates', () => {
    const view = computeStageView(1200, 720);
    const islandCx = STAGE_W / 2;
    const islandCy = 452;
    const point = canvasCssToStage(view.ox + islandCx * view.scale, view.oy + islandCy * view.scale, view);
    expect(point.x).toBeCloseTo(islandCx);
    expect(point.y).toBeCloseTo(islandCy);
  });
});

describe('stage layout', () => {
  it('computes in stage space, not canvas width', () => {
    const layout = computeLayout();
    expect(layout.width).toBe(STAGE_W);
    expect(layout.height).toBe(STAGE_H);
    expect(layout.island.cx).toBe(STAGE_W / 2);
    expect(layout.island.rx * 2).toBeLessThan(STAGE_W);
  });

  it('keeps hit boxes at least 48px and slightly roomy', () => {
    const layout = computeLayout();
    expect(layout.tree.w).toBeGreaterThanOrEqual(48);
    expect(layout.tree.h).toBeGreaterThanOrEqual(48);
    expect(layout.hut.w).toBeGreaterThanOrEqual(48);
    expect(layout.hut.h).toBeGreaterThanOrEqual(48);
    expect(layout.quarry.w).toBeGreaterThanOrEqual(48);
    expect(layout.quarry.h).toBeGreaterThanOrEqual(48);
    expect(layout.quarry).toEqual(QUARRY_RECT);
    for (const rock of layout.rocks) {
      expect(rock.w).toBeGreaterThanOrEqual(48);
      expect(rock.h).toBeGreaterThanOrEqual(48);
    }
    expect(layout.rocks[0].x + layout.rocks[0].w).toBeLessThan(layout.rocks[1].x + 8);
  });

  it('expands hut hitbox for L2 around the same center', () => {
    const l1 = computeLayout({ hutLevel: 1 });
    const l2 = computeLayout({ hutLevel: 2 });
    expect(l2.hut.w).toBeGreaterThan(l1.hut.w);
    expect(l2.hut.h).toBeGreaterThan(l1.hut.h);
    expect(l2.hut.w).toBeGreaterThanOrEqual(48);
    expect(l2.hut.h).toBeGreaterThanOrEqual(48);
    expect(l2.hut.x + l2.hut.w / 2).toBeCloseTo(l1.hut.x + l1.hut.w / 2);
    expect(l2.hut.y + l2.hut.h / 2).toBeCloseTo(l1.hut.y + l1.hut.h / 2);
  });
});
