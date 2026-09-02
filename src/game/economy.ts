import type { GameState } from './state';

export const HUT_COST = { wood: 10, stone: 5 } as const;
export const QUARRY_COST = { wood: 12, stone: 8 } as const;
export const HUT_L2_COST = { wood: 20, stone: 10 } as const;

export const HUT_L1_INTERVAL_MS = 8000;
export const HUT_L2_INTERVAL_MS = 5000;
export const QUARRY_L1_INTERVAL_MS = 8000;

export type ProductionAcc = {
  hutMs: number;
  quarryMs: number;
};

export type TickResult = {
  wood: number;
  stone: number;
};

export function createProductionAcc(): ProductionAcc {
  return { hutMs: 0, quarryMs: 0 };
}

export function tapTree(state: GameState): void {
  state.wood += 1;
}

export function tapRock(state: GameState): void {
  state.stone += 1;
}

export function canBuildHut(state: GameState): boolean {
  return (
    state.hutLevel === 0 &&
    state.wood >= HUT_COST.wood &&
    state.stone >= HUT_COST.stone
  );
}

export function buildHut(state: GameState): boolean {
  if (state.hutLevel !== 0) {
    return false;
  }
  if (state.wood < HUT_COST.wood || state.stone < HUT_COST.stone) {
    return false;
  }
  state.wood -= HUT_COST.wood;
  state.stone -= HUT_COST.stone;
  state.hutLevel = 1;
  return true;
}

export function canBuildQuarry(state: GameState): boolean {
  return (
    state.hutLevel >= 1 &&
    state.quarryLevel === 0 &&
    state.wood >= QUARRY_COST.wood &&
    state.stone >= QUARRY_COST.stone
  );
}

export function buildQuarry(state: GameState): boolean {
  if (state.hutLevel < 1 || state.quarryLevel !== 0) {
    return false;
  }
  if (state.wood < QUARRY_COST.wood || state.stone < QUARRY_COST.stone) {
    return false;
  }
  state.wood -= QUARRY_COST.wood;
  state.stone -= QUARRY_COST.stone;
  state.quarryLevel = 1;
  return true;
}

export function canUpgradeHut(state: GameState): boolean {
  return (
    state.hutLevel === 1 &&
    state.quarryLevel >= 1 &&
    state.wood >= HUT_L2_COST.wood &&
    state.stone >= HUT_L2_COST.stone
  );
}

export function upgradeHut(state: GameState): boolean {
  if (state.hutLevel !== 1 || state.quarryLevel < 1) {
    return false;
  }
  if (state.wood < HUT_L2_COST.wood || state.stone < HUT_L2_COST.stone) {
    return false;
  }
  state.wood -= HUT_L2_COST.wood;
  state.stone -= HUT_L2_COST.stone;
  state.hutLevel = 2;
  return true;
}

export function hutWoodIntervalMs(hutLevel: number): number {
  if (hutLevel >= 2) {
    return HUT_L2_INTERVAL_MS;
  }
  if (hutLevel >= 1) {
    return HUT_L1_INTERVAL_MS;
  }
  return 0;
}

export function tickProduction(
  state: GameState,
  acc: ProductionAcc,
  dtMs: number,
  options?: { paused?: boolean },
): TickResult {
  const gained: TickResult = { wood: 0, stone: 0 };
  if (options?.paused || dtMs <= 0) {
    return gained;
  }

  const hutInterval = hutWoodIntervalMs(state.hutLevel);
  if (hutInterval > 0) {
    acc.hutMs += dtMs;
    while (acc.hutMs >= hutInterval) {
      acc.hutMs -= hutInterval;
      state.wood += 1;
      gained.wood += 1;
    }
  }

  if (state.quarryLevel >= 1) {
    acc.quarryMs += dtMs;
    while (acc.quarryMs >= QUARRY_L1_INTERVAL_MS) {
      acc.quarryMs -= QUARRY_L1_INTERVAL_MS;
      state.stone += 1;
      gained.stone += 1;
    }
  }

  return gained;
}
