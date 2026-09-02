import { describe, expect, it } from 'vitest';
import {
  buildHut,
  buildQuarry,
  canBuildHut,
  canBuildQuarry,
  canUpgradeHut,
  createProductionAcc,
  HUT_COST,
  HUT_L1_INTERVAL_MS,
  HUT_L2_COST,
  HUT_L2_INTERVAL_MS,
  QUARRY_COST,
  QUARRY_L1_INTERVAL_MS,
  tapRock,
  tapTree,
  tickProduction,
  upgradeHut,
} from './economy';
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
