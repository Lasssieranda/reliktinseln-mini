export type GameState = {
  wood: number;
  stone: number;
  hutBuilt: boolean;
  goalDone: boolean;
};

export function createInitialState(): GameState {
  return {
    wood: 0,
    stone: 0,
    hutBuilt: false,
    goalDone: false,
  };
}

export function cloneState(state: GameState): GameState {
  return {
    wood: state.wood,
    stone: state.stone,
    hutBuilt: state.hutBuilt,
    goalDone: state.goalDone,
  };
}
