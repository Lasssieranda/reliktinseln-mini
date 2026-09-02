import { describe, expect, it } from 'vitest';
import {
  buildHut,
  buildQuarry,
  buildShrine,
  canBuildHut,
  canBuildQuarry,
  canBuildShrine,
  canFeedShrine,
  canUpgradeHut,
  createProductionAcc,
  FEED_COST,
  feedShrine,
  HUT_COST,
  HUT_L1_INTERVAL_MS,
  HUT_L2_COST,
  HUT_L2_INTERVAL_MS,
  QUARRY_COST,
  QUARRY_L1_INTERVAL_MS,
  SHRINE_COST,
  SHRINE_FEEDS_NEEDED,
  tapRock,
  tapTree,
  tickProduction,
  upgradeHut,
} from './economy';
import { skipRelic1 } from './qa';
import { createInitialState } from './state';

describe('economy', () => {
  it('tap tree adds 1 wood', () => {
    const state = createInitialState();
    tapTree(state);
    expect(state.wood).toBe(1);
    expect(state.stone).toBe(0);
  });

  it('tap rock adds 1 stone', () => {
    const state = createInitialState();
    tapRock(state);
    expect(state.stone).toBe(1);
    expect(state.wood).toBe(0);
  });

  it('hut does not build when costs are not met', () => {
    const state = createInitialState();
    state.wood = HUT_COST.wood - 1;
    state.stone = HUT_COST.stone;
    expect(canBuildHut(state)).toBe(false);
    expect(buildHut(state)).toBe(false);
    expect(state.hutLevel).toBe(0);
    expect(state.wood).toBe(HUT_COST.wood - 1);
    expect(state.stone).toBe(HUT_COST.stone);
  });

  it('hut L1 builds and deducts 10 wood and 5 stone', () => {
    const state = createInitialState();
    state.wood = 10;
    state.stone = 5;
    expect(HUT_COST).toEqual({ wood: 10, stone: 5 });
    expect(canBuildHut(state)).toBe(true);
    expect(buildHut(state)).toBe(true);
    expect(state.hutLevel).toBe(1);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
  });

  it('quarry does not build before hut or when poor', () => {
    const poor = createInitialState();
    poor.hutLevel = 1;
    poor.wood = QUARRY_COST.wood - 1;
    poor.stone = QUARRY_COST.stone;
    expect(canBuildQuarry(poor)).toBe(false);
    expect(buildQuarry(poor)).toBe(false);
    expect(poor.quarryLevel).toBe(0);
    expect(poor.wood).toBe(QUARRY_COST.wood - 1);

    const noHut = createInitialState();
    noHut.wood = QUARRY_COST.wood;
    noHut.stone = QUARRY_COST.stone;
    expect(canBuildQuarry(noHut)).toBe(false);
    expect(buildQuarry(noHut)).toBe(false);
    expect(noHut.hutLevel).toBe(0);
    expect(noHut.quarryLevel).toBe(0);
  });

  it('quarry builds and deducts 12 wood and 8 stone', () => {
    const state = createInitialState();
    state.hutLevel = 1;
    state.wood = 12;
    state.stone = 8;
    expect(QUARRY_COST).toEqual({ wood: 12, stone: 8 });
    expect(canBuildQuarry(state)).toBe(true);
    expect(buildQuarry(state)).toBe(true);
    expect(state.quarryLevel).toBe(1);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
  });

  it('hut L2 does not upgrade when poor, before L1, or before quarry', () => {
    const poor = createInitialState();
    poor.hutLevel = 1;
    poor.quarryLevel = 1;
    poor.wood = HUT_L2_COST.wood - 1;
    poor.stone = HUT_L2_COST.stone;
    expect(canUpgradeHut(poor)).toBe(false);
    expect(upgradeHut(poor)).toBe(false);
    expect(poor.hutLevel).toBe(1);
    expect(poor.wood).toBe(HUT_L2_COST.wood - 1);

    const noL1 = createInitialState();
    noL1.wood = HUT_L2_COST.wood;
    noL1.stone = HUT_L2_COST.stone;
    expect(canUpgradeHut(noL1)).toBe(false);
    expect(upgradeHut(noL1)).toBe(false);

    const noQuarry = createInitialState();
    noQuarry.hutLevel = 1;
    noQuarry.wood = HUT_L2_COST.wood;
    noQuarry.stone = HUT_L2_COST.stone;
    expect(canUpgradeHut(noQuarry)).toBe(false);
    expect(upgradeHut(noQuarry)).toBe(false);
    expect(noQuarry.hutLevel).toBe(1);
  });

  it('hut L2 upgrade deducts 20 wood and 10 stone', () => {
    const state = createInitialState();
    state.hutLevel = 1;
    state.quarryLevel = 1;
    state.wood = 20;
    state.stone = 10;
    expect(HUT_L2_COST).toEqual({ wood: 20, stone: 10 });
    expect(canUpgradeHut(state)).toBe(true);
    expect(upgradeHut(state)).toBe(true);
    expect(state.hutLevel).toBe(2);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
    expect(canUpgradeHut(state)).toBe(false);
  });

  it('hut L2 does not upgrade further to L3', () => {
    const state = createInitialState();
    state.hutLevel = 2;
    state.quarryLevel = 1;
    state.wood = 99;
    state.stone = 99;
    expect(canUpgradeHut(state)).toBe(false);
    expect(upgradeHut(state)).toBe(false);
    expect(state.hutLevel).toBe(2);

    const loadedL3 = createInitialState();
    loadedL3.hutLevel = 3;
    loadedL3.quarryLevel = 1;
    loadedL3.wood = 99;
    loadedL3.stone = 99;
    expect(canUpgradeHut(loadedL3)).toBe(false);
    expect(upgradeHut(loadedL3)).toBe(false);
    expect(loadedL3.hutLevel).toBe(3);
  });
});

describe('shrine and relic1', () => {
  it('shrine costs 18 wood and 14 stone and needs hut L2', () => {
    expect(SHRINE_COST).toEqual({ wood: 18, stone: 14 });
    const noHut = createInitialState();
    noHut.wood = 18;
    noHut.stone = 14;
    expect(canBuildShrine(noHut)).toBe(false);
    expect(buildShrine(noHut)).toBe(false);

    const hutL1 = createInitialState();
    hutL1.hutLevel = 1;
    hutL1.quarryLevel = 1;
    hutL1.wood = 18;
    hutL1.stone = 14;
    expect(canBuildShrine(hutL1)).toBe(false);
    expect(buildShrine(hutL1)).toBe(false);

    const poor = createInitialState();
    poor.hutLevel = 2;
    poor.wood = 17;
    poor.stone = 14;
    expect(canBuildShrine(poor)).toBe(false);
    expect(buildShrine(poor)).toBe(false);
    expect(poor.shrineBuilt).toBe(false);

    const ready = createInitialState();
    ready.hutLevel = 2;
    ready.quarryLevel = 1;
    ready.wood = 18;
    ready.stone = 14;
    expect(canBuildShrine(ready)).toBe(true);
    expect(buildShrine(ready)).toBe(true);
    expect(ready.shrineBuilt).toBe(true);
    expect(ready.shrineFeeds).toBe(0);
    expect(ready.wood).toBe(0);
    expect(ready.stone).toBe(0);
    expect(canBuildShrine(ready)).toBe(false);
  });

  it('feed deducts 4/3, cannot feed without shrine, 6th feed sets relic1', () => {
    expect(FEED_COST).toEqual({ wood: 4, stone: 3 });
    expect(SHRINE_FEEDS_NEEDED).toBe(6);

    const noShrine = createInitialState();
    noShrine.hutLevel = 2;
    noShrine.wood = 4;
    noShrine.stone = 3;
    expect(canFeedShrine(noShrine)).toBe(false);
    expect(feedShrine(noShrine)).toBe(false);
    expect(noShrine.shrineFeeds).toBe(0);
    expect(noShrine.relic1).toBe(false);

    const state = createInitialState();
    state.hutLevel = 2;
    state.quarryLevel = 1;
    state.shrineBuilt = true;
    state.wood = FEED_COST.wood * 6;
    state.stone = FEED_COST.stone * 6;

    for (let i = 0; i < 5; i += 1) {
      expect(canFeedShrine(state)).toBe(true);
      expect(feedShrine(state)).toBe(true);
      expect(state.shrineFeeds).toBe(i + 1);
      expect(state.relic1).toBe(false);
    }
    expect(state.wood).toBe(4);
    expect(state.stone).toBe(3);
    expect(feedShrine(state)).toBe(true);
    expect(state.shrineFeeds).toBe(6);
    expect(state.relic1).toBe(true);
    expect(state.relic2).toBe(false);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
    expect(canFeedShrine(state)).toBe(false);
    expect(feedShrine(state)).toBe(false);
  });

  it('tap after relic1 is +2 for wood and stone; autos stay +1', () => {
    const state = createInitialState();
    state.hutLevel = 2;
    state.quarryLevel = 1;
    state.shrineBuilt = true;
    state.shrineFeeds = 6;
    state.relic1 = true;
    tapTree(state);
    tapRock(state);
    expect(state.wood).toBe(2);
    expect(state.stone).toBe(2);

    const acc = createProductionAcc();
    tickProduction(state, acc, HUT_L2_INTERVAL_MS);
    expect(state.wood).toBe(3);
    expect(state.stone).toBe(2);
    tickProduction(state, acc, QUARRY_L1_INTERVAL_MS - HUT_L2_INTERVAL_MS);
    expect(state.wood).toBe(3);
    expect(state.stone).toBe(3);
  });
});

describe('production ticks', () => {
  it('hut L1 produces 1 wood every 8000ms and quarry 1 stone every 8000ms', () => {
    const state = createInitialState();
    state.hutLevel = 1;
    state.quarryLevel = 1;
    const acc = createProductionAcc();
    tickProduction(state, acc, HUT_L1_INTERVAL_MS - 1);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
    tickProduction(state, acc, 1);
    expect(state.wood).toBe(1);
    expect(state.stone).toBe(1);
    expect(HUT_L1_INTERVAL_MS).toBe(8000);
    expect(QUARRY_L1_INTERVAL_MS).toBe(8000);
  });

  it('hut L2 produces 1 wood every 5000ms and does not stack L1', () => {
    const state = createInitialState();
    state.hutLevel = 2;
    const acc = createProductionAcc();
    tickProduction(state, acc, HUT_L2_INTERVAL_MS);
    expect(state.wood).toBe(1);
    tickProduction(state, acc, HUT_L1_INTERVAL_MS - HUT_L2_INTERVAL_MS);
    expect(state.wood).toBe(1);
    tickProduction(state, acc, HUT_L2_INTERVAL_MS - (HUT_L1_INTERVAL_MS - HUT_L2_INTERVAL_MS));
    expect(state.wood).toBe(2);
    expect(HUT_L2_INTERVAL_MS).toBe(5000);
  });

  it('does not tick or accrue when paused/hidden', () => {
    const state = createInitialState();
    state.hutLevel = 1;
    state.quarryLevel = 1;
    const acc = createProductionAcc();
    tickProduction(state, acc, 16_000, { paused: true });
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
    expect(acc.hutMs).toBe(0);
    expect(acc.quarryMs).toBe(0);
    tickProduction(state, acc, HUT_L1_INTERVAL_MS);
    expect(state.wood).toBe(1);
    expect(state.stone).toBe(1);
  });
});

describe('qa skip', () => {
  it('skipRelic1 sets shrine, feeds, relic1 and fills hut/quarry without relic2', () => {
    const state = createInitialState();
    skipRelic1(state);
    expect(state.shrineBuilt).toBe(true);
    expect(state.shrineFeeds).toBe(6);
    expect(state.relic1).toBe(true);
    expect(state.relic2).toBe(false);
    expect(state.hutLevel).toBe(2);
    expect(state.quarryLevel).toBe(1);
    expect(canUpgradeHut(state)).toBe(false);
    expect(canBuildShrine(state)).toBe(false);
    expect(canFeedShrine(state)).toBe(false);
  });
});
