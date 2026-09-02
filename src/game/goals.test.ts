import { describe, expect, it } from 'vitest';
import { buildHut, buildQuarry, upgradeHut } from './economy';
import {
  currentMiniGoal,
  isHutGoalFulfilled,
  isHutL2GoalFulfilled,
  isQuarryGoalFulfilled,
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

  it('goal list is quarry then hut tier 2 after hut', () => {
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
    expect(currentMiniGoal(state)).toBe('done');
  });
});
