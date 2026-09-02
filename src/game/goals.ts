import type { GameState } from './state';

export type MiniGoal = 'hut' | 'quarry' | 'hutL2' | 'shrine' | 'relic1' | 'done';

export function isHutGoalFulfilled(state: GameState): boolean {
  return state.hutLevel >= 1;
}

export function isQuarryGoalFulfilled(state: GameState): boolean {
  return state.quarryLevel >= 1;
}

export function isHutL2GoalFulfilled(state: GameState): boolean {
  return state.hutLevel >= 2;
}

export function isShrineGoalFulfilled(state: GameState): boolean {
  return state.shrineBuilt;
}

export function isRelic1GoalFulfilled(state: GameState): boolean {
  return state.relic1;
}

export function currentMiniGoal(state: GameState): MiniGoal {
  if (state.hutLevel < 1) {
    return 'hut';
  }
  if (state.quarryLevel < 1) {
    return 'quarry';
  }
  if (state.hutLevel < 2) {
    return 'hutL2';
  }
  if (!state.shrineBuilt) {
    return 'shrine';
  }
  if (!state.relic1) {
    return 'relic1';
  }
  return 'done';
}
