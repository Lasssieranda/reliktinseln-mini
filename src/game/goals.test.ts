import { describe, expect, it } from 'vitest';
import { buildHut, buildQuarry, buildShrine, feedShrine, upgradeHut } from './economy';
import {
  currentMiniGoal,
  isHutGoalFulfilled,
  isHutL2GoalFulfilled,
  isQuarryGoalFulfilled,
  isRelic1GoalFulfilled,
  isShrineGoalFulfilled,
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

  it('goal list is quarry then hut L2 then shrine then relic1 then done', () => {
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
    expect(currentMiniGoal(state)).toBe('done');
    expect(currentMiniGoal(state)).not.toBe('relic1');
  });
});
