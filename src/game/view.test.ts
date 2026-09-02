import { describe, expect, it } from 'vitest';
import { computeLayout, HUT_RECT, QUARRY_RECT, RELIC_RECT, RELIC2_RECT, SHRINE_RECT } from './layers';
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

  it('places shrine and relic on the island with hits at least 48px', () => {
    const layout = computeLayout({ hutLevel: 2, quarryLevel: 1, shrineBuilt: true, relic1: true });
    expect(layout.shrine).toEqual(SHRINE_RECT);
    expect(layout.relic).toEqual(RELIC_RECT);
    expect(layout.shrine.w).toBeGreaterThanOrEqual(48);
    expect(layout.shrine.h).toBeGreaterThanOrEqual(48);
    expect(layout.relic.w).toBeGreaterThanOrEqual(48);
    expect(layout.relic.h).toBeGreaterThanOrEqual(48);
  });

  it('picks plot hut → quarry → hut upgrade → shrine build → shrine feed', () => {
    expect(computeLayout({ hutLevel: 0 }).plot).toEqual(HUT_RECT);
    expect(computeLayout({ hutLevel: 1, quarryLevel: 0 }).plot).toEqual(QUARRY_RECT);
    const upgrade = computeLayout({ hutLevel: 1, quarryLevel: 1 });
    expect(upgrade.plot.x + upgrade.plot.w / 2).toBeCloseTo(HUT_RECT.x + HUT_RECT.w / 2);
    expect(computeLayout({ hutLevel: 2, quarryLevel: 1, shrineBuilt: false }).plot).toEqual(SHRINE_RECT);
    expect(computeLayout({ hutLevel: 2, quarryLevel: 1, shrineBuilt: true, relic1: false }).plot).toEqual(SHRINE_RECT);
  });

  it('places relic2 to the right of relic1 with hits at least 48px', () => {
    const layout = computeLayout({
      hutLevel: 3,
      quarryLevel: 3,
      shrineBuilt: true,
      relic1: true,
      relic2: true,
    });
    expect(layout.relic).toEqual(RELIC_RECT);
    expect(layout.relic2).toEqual(RELIC2_RECT);
    expect(layout.relic2.x).toBeGreaterThan(layout.relic.x);
    expect(layout.relic2.w).toBeGreaterThanOrEqual(48);
    expect(layout.relic2.h).toBeGreaterThanOrEqual(48);
  });

  it('expands hut and quarry hitboxes for L3 around the same center', () => {
    const hutL2 = computeLayout({ hutLevel: 2 });
    const hutL3 = computeLayout({ hutLevel: 3 });
    expect(hutL3.hut.w).toBeGreaterThan(hutL2.hut.w);
    expect(hutL3.hut.h).toBeGreaterThan(hutL2.hut.h);
    expect(hutL3.hut.w).toBeGreaterThanOrEqual(48);
    expect(hutL3.hut.x + hutL3.hut.w / 2).toBeCloseTo(hutL2.hut.x + hutL2.hut.w / 2);

    const qL1 = computeLayout({ quarryLevel: 1 });
    const qL2 = computeLayout({ quarryLevel: 2 });
    const qL3 = computeLayout({ quarryLevel: 3 });
    expect(qL2.quarry.w).toBeGreaterThan(qL1.quarry.w);
    expect(qL3.quarry.w).toBeGreaterThan(qL2.quarry.w);
    expect(qL3.quarry.w).toBeGreaterThanOrEqual(48);
    expect(qL3.quarry.x + qL3.quarry.w / 2).toBeCloseTo(qL1.quarry.x + qL1.quarry.w / 2);
  });

  it('picks stufe3 plots quarry L2 → hut L3 → quarry L3 then shrine for relic2', () => {
    const q2 = computeLayout({ hutLevel: 2, quarryLevel: 1, shrineBuilt: true, relic1: true });
    expect(q2.plot.x + q2.plot.w / 2).toBeCloseTo(QUARRY_RECT.x + QUARRY_RECT.w / 2);
    const h3 = computeLayout({ hutLevel: 2, quarryLevel: 2, shrineBuilt: true, relic1: true });
    expect(h3.plot.x + h3.plot.w / 2).toBeCloseTo(HUT_RECT.x + HUT_RECT.w / 2);
    const q3 = computeLayout({ hutLevel: 3, quarryLevel: 2, shrineBuilt: true, relic1: true });
    expect(q3.plot.x + q3.plot.w / 2).toBeCloseTo(QUARRY_RECT.x + QUARRY_RECT.w / 2);
    expect(
      computeLayout({ hutLevel: 3, quarryLevel: 3, shrineBuilt: true, relic1: true, relic2: false }).plot,
    ).toEqual(SHRINE_RECT);
  });

