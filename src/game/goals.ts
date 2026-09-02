import type { GameState } from './state';

export type MiniGoal = 'hut' | 'quarry' | 'hutL2' | 'shrine' | 'relic1' | 'stufe3' | 'relic2' | 'done';

export type Stufe3Step = 'quarryL2' | 'hutL3' | 'quarryL3';

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

export function isStufe3GoalFulfilled(state: GameState): boolean {
  return state.hutLevel >= 3 && state.quarryLevel >= 3;
}

export function isRelic2GoalFulfilled(state: GameState): boolean {
  return state.relic2;
}

export function nextStufe3Step(state: GameState): Stufe3Step | null {
  if (state.quarryLevel < 2) {
    return 'quarryL2';
  }
  if (state.hutLevel < 3) {
    return 'hutL3';
  }
  if (state.quarryLevel < 3) {
    return 'quarryL3';
  }
  return null;
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
  if (!isStufe3GoalFulfilled(state)) {
    return 'stufe3';
  }
  if (!state.relic2) {
    return 'relic2';
  }
  return 'done';
}
