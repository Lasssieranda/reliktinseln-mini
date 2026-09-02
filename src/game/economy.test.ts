import { describe, expect, it } from 'vitest';
import { buildHut, canBuildHut, HUT_COST, tapRock, tapTree } from './economy';
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
    expect(state.hutBuilt).toBe(false);
    expect(state.wood).toBe(HUT_COST.wood - 1);
    expect(state.stone).toBe(HUT_COST.stone);
  });

  it('hut builds and deducts 10 wood and 5 stone', () => {
    const state = createInitialState();
    state.wood = 10;
    state.stone = 5;
    expect(HUT_COST).toEqual({ wood: 10, stone: 5 });
    expect(canBuildHut(state)).toBe(true);
    expect(buildHut(state)).toBe(true);
    expect(state.hutBuilt).toBe(true);
    expect(state.wood).toBe(0);
    expect(state.stone).toBe(0);
  });
});
