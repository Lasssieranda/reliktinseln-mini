import type { GameState } from './state';

export const HUT_COST = { wood: 10, stone: 5 } as const;

export function tapTree(state: GameState): void {
  state.wood += 1;
}

export function tapRock(state: GameState): void {
  state.stone += 1;
}

export function canBuildHut(state: GameState): boolean {
  return (
    !state.hutBuilt &&
    state.wood >= HUT_COST.wood &&
    state.stone >= HUT_COST.stone
  );
}

export function buildHut(state: GameState): boolean {
  if (state.hutBuilt) {
    return false;
  }
  if (state.wood < HUT_COST.wood || state.stone < HUT_COST.stone) {
    return false;
  }
  state.wood -= HUT_COST.wood;
  state.stone -= HUT_COST.stone;
  state.hutBuilt = true;
  return true;
}
