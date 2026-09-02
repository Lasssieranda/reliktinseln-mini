import type { GameState } from './state';

export type MiniGoal = 'hut' | 'quarry' | 'hutL2' | 'done';

export function isHutGoalFulfilled(state: GameState): boolean {
  return state.hutLevel >= 1;
}

export function isQuarryGoalFulfilled(state: GameState): boolean {
  return state.quarryLevel >= 1;
}

export function isHutL2GoalFulfilled(state: GameState): boolean {
  return state.hutLevel >= 2;
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
  return 'done';
}
