import { describe, expect, it } from 'vitest';
import {
  buildHut,
  buildQuarry,
  buildShrine,
  feedShrine,
  HUT_L3_COST,
  QUARRY_L2_COST,
  QUARRY_L3_COST,
  RELIC2_FEED_COST,
  upgradeHut,
  upgradeQuarry,
} from './economy';
import {
  currentMiniGoal,
  isHutGoalFulfilled,
  isHutL2GoalFulfilled,
  isQuarryGoalFulfilled,
  isRelic1GoalFulfilled,
  isRelic2GoalFulfilled,
  isShrineGoalFulfilled,
  isStufe3GoalFulfilled,
  nextStufe3Step,
} from './goals';
import { createInitialState } from './state';

describe('goals', () => {
  it('hut goal is fulfilled after a successful build', () => {
    const state = createInitialState();
    expect(isHutGoalFulfilled(state)).toBe(false);
    expect(currentMiniGoal(state)).toBe('hut');
    state.wood = 10;
    state.stone = 5;
    expect(buildHut(state)).toBe(true);
    expect(isHutGoalFulfilled(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('quarry');
  });

  it('goal list is quarry then hut L2 then shrine then relic1 then stufe3 then relic2 then done', () => {
    const state = createInitialState();
    state.hutLevel = 1;
    expect(isHutGoalFulfilled(state)).toBe(true);
    expect(isQuarryGoalFulfilled(state)).toBe(false);
    expect(currentMiniGoal(state)).toBe('quarry');

    state.wood = 12;
    state.stone = 8;
    expect(buildQuarry(state)).toBe(true);
    expect(isQuarryGoalFulfilled(state)).toBe(true);
    expect(isHutL2GoalFulfilled(state)).toBe(false);
    expect(currentMiniGoal(state)).toBe('hutL2');

    state.wood = 20;
    state.stone = 10;
    expect(upgradeHut(state)).toBe(true);
    expect(isHutL2GoalFulfilled(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('shrine');

    state.wood = 18;
    state.stone = 14;
    expect(buildShrine(state)).toBe(true);
    expect(isShrineGoalFulfilled(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('relic1');

    state.wood = 4 * 6;
    state.stone = 3 * 6;
    for (let i = 0; i < 5; i += 1) {
      expect(feedShrine(state)).toBe(true);
      expect(currentMiniGoal(state)).toBe('relic1');
    }
    expect(feedShrine(state)).toBe(true);
    expect(isRelic1GoalFulfilled(state)).toBe(true);
    expect(isStufe3GoalFulfilled(state)).toBe(false);
    expect(currentMiniGoal(state)).toBe('stufe3');
    expect(currentMiniGoal(state)).not.toBe('relic1');
    expect(currentMiniGoal(state)).not.toBe('done');

    expect(nextStufe3Step(state)).toBe('quarryL2');
    state.wood = QUARRY_L2_COST.wood;
    state.stone = QUARRY_L2_COST.stone;
    expect(upgradeQuarry(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('stufe3');
    expect(nextStufe3Step(state)).toBe('hutL3');

    state.wood = HUT_L3_COST.wood;
    state.stone = HUT_L3_COST.stone;
    expect(upgradeHut(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('stufe3');
    expect(nextStufe3Step(state)).toBe('quarryL3');
    expect(isStufe3GoalFulfilled(state)).toBe(false);

    state.wood = QUARRY_L3_COST.wood;
    state.stone = QUARRY_L3_COST.stone;
    expect(upgradeQuarry(state)).toBe(true);
    expect(isStufe3GoalFulfilled(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('relic2');

    state.wood = RELIC2_FEED_COST.wood * 8;
    state.stone = RELIC2_FEED_COST.stone * 8;
    for (let i = 0; i < 7; i += 1) {
      expect(feedShrine(state)).toBe(true);
      expect(currentMiniGoal(state)).toBe('relic2');
    }
    expect(feedShrine(state)).toBe(true);
    expect(isRelic2GoalFulfilled(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('done');
  });

  it('stufe3 is fulfilled only when both buildings are at least 3', () => {
    const state = createInitialState();
    state.relic1 = true;
    state.shrineBuilt = true;
    state.shrineFeeds = 6;
    state.hutLevel = 3;
    state.quarryLevel = 2;
    expect(isStufe3GoalFulfilled(state)).toBe(false);
    expect(currentMiniGoal(state)).toBe('stufe3');
    state.quarryLevel = 3;
    expect(isStufe3GoalFulfilled(state)).toBe(true);
    expect(currentMiniGoal(state)).toBe('relic2');
  });
});
