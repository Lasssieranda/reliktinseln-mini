import { describe, expect, it } from 'vitest';
import { buildHut } from './economy';
import { applyGoals, isHutGoalFulfilled } from './goals';
import { createInitialState } from './state';

describe('goals', () => {
  it('hut goal is fulfilled after a successful build', () => {
    const state = createInitialState();
    expect(isHutGoalFulfilled(state)).toBe(false);
    state.wood = 10;
    state.stone = 5;
    expect(buildHut(state)).toBe(true);
    applyGoals(state);
    expect(isHutGoalFulfilled(state)).toBe(true);
    expect(state.goalDone).toBe(true);
  });
});
