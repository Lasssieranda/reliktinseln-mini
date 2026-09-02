export type HutLevel = 0 | 1 | 2;
export type QuarryLevel = 0 | 1;

export type GameState = {
  wood: number;
  stone: number;
  hutLevel: HutLevel;
  quarryLevel: QuarryLevel;
};

export function createInitialState(): GameState {
  return {
    wood: 0,
    stone: 0,
    hutLevel: 0,
    quarryLevel: 0,
  };
}

export function cloneState(state: GameState): GameState {
  return {
    wood: state.wood,
    stone: state.stone,
    hutLevel: state.hutLevel,
    quarryLevel: state.quarryLevel,
  };
}

export function isHutBuilt(state: GameState): boolean {
  return state.hutLevel >= 1;
}
