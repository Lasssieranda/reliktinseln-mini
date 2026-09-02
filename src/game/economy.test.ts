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
  canUpgradeQuarry,
  createProductionAcc,
  FEED_COST,
  feedShrine,
  HUT_COST,
  HUT_L1_INTERVAL_MS,
  HUT_L2_COST,
  HUT_L2_INTERVAL_MS,
  HUT_L3_COST,
  MAX_SHRINE_FEEDS,
  QUARRY_COST,
  QUARRY_L1_INTERVAL_MS,
  QUARRY_L2_COST,
  QUARRY_L3_COST,
  RELIC2_FEED_COST,
  RELIC2_FEEDS_NEEDED,
  SHRINE_COST,
  SHRINE_FEEDS_NEEDED,
  tapRock,
  tapTree,
  tickProduction,
  upgradeHut,
  upgradeQuarry,
} from './economy';
import { skipRelic1, skipRelic2 } from './qa';
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

  it('skipRelic2 sets relic1+relic2, feeds 14, hut 3 and quarry 3', () => {
    const state = createInitialState();
    skipRelic2(state);
    expect(state.shrineBuilt).toBe(true);
    expect(state.shrineFeeds).toBe(14);
    expect(state.shrineFeeds).toBe(MAX_SHRINE_FEEDS);
    expect(state.relic1).toBe(true);
    expect(state.relic2).toBe(true);
    expect(state.hutLevel).toBe(3);
    expect(state.quarryLevel).toBe(3);
    expect(canUpgradeHut(state)).toBe(false);
    expect(canUpgradeQuarry(state)).toBe(false);
    expect(canFeedShrine(state)).toBe(false);
  });
});

describe('stufe3 upgrades and relic2', () => {
  it('quarry L2 costs 16/12, hut L3 26/16, quarry L3 22/18; poor cannot', () => {
    expect(QUARRY_L2_COST).toEqual({ wood: 16, stone: 12 });
    expect(HUT_L3_COST).toEqual({ wood: 26, stone: 16 });
    expect(QUARRY_L3_COST).toEqual({ wood: 22, stone: 18 });

    const poorQ2 = createInitialState();
    poorQ2.hutLevel = 2;
    poorQ2.quarryLevel = 1;
    poorQ2.relic1 = true;
    poorQ2.wood = QUARRY_L2_COST.wood - 1;
    poorQ2.stone = QUARRY_L2_COST.stone;
    expect(canUpgradeQuarry(poorQ2)).toBe(false);
    expect(upgradeQuarry(poorQ2)).toBe(false);
    expect(poorQ2.quarryLevel).toBe(1);

    const readyQ2 = createInitialState();
    readyQ2.hutLevel = 2;
    readyQ2.quarryLevel = 1;
    readyQ2.relic1 = true;
    readyQ2.wood = 16;
    readyQ2.stone = 12;
    expect(canUpgradeQuarry(readyQ2)).toBe(true);
    expect(upgradeQuarry(readyQ2)).toBe(true);
    expect(readyQ2.quarryLevel).toBe(2);
    expect(readyQ2.wood).toBe(0);
    expect(readyQ2.stone).toBe(0);

    const noRelic = createInitialState();
    noRelic.hutLevel = 2;
    noRelic.quarryLevel = 1;
    noRelic.wood = 99;
    noRelic.stone = 99;
    expect(canUpgradeQuarry(noRelic)).toBe(false);
    expect(canUpgradeHut(noRelic)).toBe(false);

    const hutBeforeQuarry2 = createInitialState();
    hutBeforeQuarry2.hutLevel = 2;
    hutBeforeQuarry2.quarryLevel = 1;
    hutBeforeQuarry2.relic1 = true;
    hutBeforeQuarry2.wood = 99;
    hutBeforeQuarry2.stone = 99;
    expect(canUpgradeHut(hutBeforeQuarry2)).toBe(false);
    expect(upgradeHut(hutBeforeQuarry2)).toBe(false);
    expect(hutBeforeQuarry2.hutLevel).toBe(2);

    const poorH3 = createInitialState();
    poorH3.hutLevel = 2;
    poorH3.quarryLevel = 2;
    poorH3.relic1 = true;
    poorH3.wood = HUT_L3_COST.wood - 1;
    poorH3.stone = HUT_L3_COST.stone;
    expect(canUpgradeHut(poorH3)).toBe(false);
    expect(upgradeHut(poorH3)).toBe(false);

    const readyH3 = createInitialState();
    readyH3.hutLevel = 2;
    readyH3.quarryLevel = 2;
    readyH3.relic1 = true;
    readyH3.wood = 26;
    readyH3.stone = 16;
    expect(canUpgradeHut(readyH3)).toBe(true);
    expect(upgradeHut(readyH3)).toBe(true);
    expect(readyH3.hutLevel).toBe(3);
    expect(readyH3.wood).toBe(0);
    expect(readyH3.stone).toBe(0);

    const q3BeforeHut3 = createInitialState();
    q3BeforeHut3.hutLevel = 2;
    q3BeforeHut3.quarryLevel = 2;
    q3BeforeHut3.relic1 = true;
    q3BeforeHut3.wood = 99;
    q3BeforeHut3.stone = 99;
    expect(canUpgradeQuarry(q3BeforeHut3)).toBe(false);

    const poorQ3 = createInitialState();
    poorQ3.hutLevel = 3;
    poorQ3.quarryLevel = 2;
    poorQ3.relic1 = true;
    poorQ3.wood = QUARRY_L3_COST.wood - 1;
    poorQ3.stone = QUARRY_L3_COST.stone;
    expect(canUpgradeQuarry(poorQ3)).toBe(false);

    const readyQ3 = createInitialState();
    readyQ3.hutLevel = 3;
    readyQ3.quarryLevel = 2;
    readyQ3.relic1 = true;
    readyQ3.wood = 22;
    readyQ3.stone = 18;
    expect(canUpgradeQuarry(readyQ3)).toBe(true);
    expect(upgradeQuarry(readyQ3)).toBe(true);
    expect(readyQ3.quarryLevel).toBe(3);
    expect(readyQ3.wood).toBe(0);
    expect(readyQ3.stone).toBe(0);
    expect(canUpgradeQuarry(readyQ3)).toBe(false);
    expect(canUpgradeHut(readyQ3)).toBe(false);
  });

  it('cannot feed relic2 before stufe3; 8 feeds of 5/4 after relic1 set relic2', () => {
    expect(RELIC2_FEED_COST).toEqual({ wood: 5, stone: 4 });
    expect(RELIC2_FEEDS_NEEDED).toBe(8);
    expect(MAX_SHRINE_FEEDS).toBe(14);

    const early = createInitialState();
    early.hutLevel = 2;
    early.quarryLevel = 1;
    early.shrineBuilt = true;
    early.shrineFeeds = 6;
    early.relic1 = true;
    early.wood = 99;
    early.stone = 99;
    expect(canFeedShrine(early)).toBe(false);
    expect(feedShrine(early)).toBe(false);
    expect(early.relic2).toBe(false);
    expect(early.shrineFeeds).toBe(6);

    const hut3only = createInitialState();
    hut3only.hutLevel = 3;
    hut3only.quarryLevel = 2;
    hut3only.shrineBuilt = true;
    hut3only.shrineFeeds = 6;
    hut3only.relic1 = true;
    hut3only.wood = 99;
    hut3only.stone = 99;
    expect(canFeedShrine(hut3only)).toBe(false);

    const state = createInitialState();
    state.hutLevel = 3;
    state.quarryLevel = 3;
    state.shrineBuilt = true;
    state.shrineFeeds = 6;
    state.relic1 = true;
    state.wood = RELIC2_FEED_COST.wood * 8;
    state.stone = RELIC2_FEED_COST.stone * 8;
    for (let i = 0; i < 7; i += 1) {
      expect(canFeedShrine(state)).toBe(true);
      expect(feedShrine(state)).toBe(true);
      expect(state.shrineFeeds).toBe(7 + i);
      expect(state.relic2).toBe(false);
    }
    expect(feedShrine(state)).toBe(true);
    expect(state.shrineFeeds).toBe(14);
    expect(state.relic2).toBe(true);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
    expect(canFeedShrine(state)).toBe(false);
    expect(feedShrine(state)).toBe(false);
  });

  it('inselherz auto ticks grant +1 extra; taps stay 2; no catch-up when paused', () => {
    const state = createInitialState();
    state.hutLevel = 3;
    state.quarryLevel = 3;
    state.shrineBuilt = true;
    state.shrineFeeds = 14;
    state.relic1 = true;
    state.relic2 = true;
    tapTree(state);
    tapRock(state);
    expect(state.wood).toBe(2);
    expect(state.stone).toBe(2);

    const acc = createProductionAcc();
    tickProduction(state, acc, HUT_L2_INTERVAL_MS);
    expect(state.wood).toBe(4);
    expect(state.stone).toBe(2);
    tickProduction(state, acc, QUARRY_L1_INTERVAL_MS - HUT_L2_INTERVAL_MS);
    expect(state.wood).toBe(4);
    expect(state.stone).toBe(4);

    const hutMs = acc.hutMs;
    const quarryMs = acc.quarryMs;
    tickProduction(state, acc, 20_000, { paused: true });
    expect(state.wood).toBe(4);
    expect(state.stone).toBe(4);
    expect(acc.hutMs).toBe(hutMs);
    expect(acc.quarryMs).toBe(quarryMs);
  });
});
