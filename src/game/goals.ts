import type { GameState } from './state';

export function isHutGoalFulfilled(state: GameState): boolean {
  return state.hutBuilt;
}

export function applyGoals(state: GameState): void {
  state.goalDone = isHutGoalFulfilled(state);
}
