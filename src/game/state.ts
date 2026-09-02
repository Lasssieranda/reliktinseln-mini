export type HutLevel = 0 | 1 | 2 | 3;
export type QuarryLevel = 0 | 1 | 2 | 3;

export type GameState = {
  wood: number;
  stone: number;
  hutLevel: HutLevel;
  quarryLevel: QuarryLevel;
  shrineBuilt: boolean;
  shrineFeeds: number;
  relic1: boolean;
  relic2: boolean;
};

export function createInitialState(): GameState {
  return {
    wood: 0,
    stone: 0,
    hutLevel: 0,
    quarryLevel: 0,
    shrineBuilt: false,
    shrineFeeds: 0,
    relic1: false,
    relic2: false,
  };
}

export function cloneState(state: GameState): GameState {
  return {
    wood: state.wood,
    stone: state.stone,
    hutLevel: state.hutLevel,
    quarryLevel: state.quarryLevel,
    shrineBuilt: state.shrineBuilt,
    shrineFeeds: state.shrineFeeds,
    relic1: state.relic1,
    relic2: state.relic2,
  };
}

export function isHutBuilt(state: GameState): boolean {
  return state.hutLevel >= 1;
}
