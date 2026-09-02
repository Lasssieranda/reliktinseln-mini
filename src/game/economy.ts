import type { GameState } from './state';

export const HUT_COST = { wood: 10, stone: 5 } as const;
export const QUARRY_COST = { wood: 12, stone: 8 } as const;
export const HUT_L2_COST = { wood: 20, stone: 10 } as const;
export const QUARRY_L2_COST = { wood: 16, stone: 12 } as const;
export const HUT_L3_COST = { wood: 26, stone: 16 } as const;
export const QUARRY_L3_COST = { wood: 22, stone: 18 } as const;
export const SHRINE_COST = { wood: 18, stone: 14 } as const;
export const FEED_COST = { wood: 4, stone: 3 } as const;
export const RELIC2_FEED_COST = { wood: 5, stone: 4 } as const;
export const SHRINE_FEEDS_NEEDED = 6;
export const RELIC2_FEEDS_NEEDED = 8;
export const MAX_SHRINE_FEEDS = SHRINE_FEEDS_NEEDED + RELIC2_FEEDS_NEEDED;

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

export function tapGain(state: GameState): number {
  return state.relic1 ? 2 : 1;
}

export function autoTickAmount(state: GameState): number {
  return state.relic2 ? 2 : 1;
}

export function tapTree(state: GameState): void {
  state.wood += tapGain(state);
}

export function tapRock(state: GameState): void {
  state.stone += tapGain(state);
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
  if (state.hutLevel === 1) {
    return (
      state.quarryLevel >= 1 &&
      state.wood >= HUT_L2_COST.wood &&
      state.stone >= HUT_L2_COST.stone
    );
  }
  if (state.hutLevel === 2) {
    return (
      state.relic1 &&
      state.quarryLevel >= 2 &&
      state.wood >= HUT_L3_COST.wood &&
      state.stone >= HUT_L3_COST.stone
    );
  }
  return false;
}

export function upgradeHut(state: GameState): boolean {
  if (!canUpgradeHut(state)) {
    return false;
  }
  if (state.hutLevel === 1) {
    state.wood -= HUT_L2_COST.wood;
    state.stone -= HUT_L2_COST.stone;
    state.hutLevel = 2;
    return true;
  }
  if (state.hutLevel === 2) {
    state.wood -= HUT_L3_COST.wood;
    state.stone -= HUT_L3_COST.stone;
    state.hutLevel = 3;
    return true;
  }
  return false;
}

export function canUpgradeQuarry(state: GameState): boolean {
  if (!state.relic1) {
    return false;
  }
  if (state.quarryLevel === 1) {
    return state.wood >= QUARRY_L2_COST.wood && state.stone >= QUARRY_L2_COST.stone;
  }
  if (state.quarryLevel === 2) {
    return (
      state.hutLevel >= 3 &&
      state.wood >= QUARRY_L3_COST.wood &&
      state.stone >= QUARRY_L3_COST.stone
    );
  }
  return false;
}

export function upgradeQuarry(state: GameState): boolean {
  if (!canUpgradeQuarry(state)) {
    return false;
  }
  if (state.quarryLevel === 1) {
    state.wood -= QUARRY_L2_COST.wood;
    state.stone -= QUARRY_L2_COST.stone;
    state.quarryLevel = 2;
    return true;
  }
  if (state.quarryLevel === 2) {
    state.wood -= QUARRY_L3_COST.wood;
    state.stone -= QUARRY_L3_COST.stone;
    state.quarryLevel = 3;
    return true;
  }
  return false;
}

export function canBuildShrine(state: GameState): boolean {
  return (
    state.hutLevel >= 2 &&
    !state.shrineBuilt &&
    state.wood >= SHRINE_COST.wood &&
    state.stone >= SHRINE_COST.stone
  );
}

export function buildShrine(state: GameState): boolean {
  if (state.hutLevel < 2 || state.shrineBuilt) {
    return false;
  }
  if (state.wood < SHRINE_COST.wood || state.stone < SHRINE_COST.stone) {
    return false;
  }
  state.wood -= SHRINE_COST.wood;
  state.stone -= SHRINE_COST.stone;
  state.shrineBuilt = true;
  state.shrineFeeds = 0;
  return true;
}

export function shrineFeedCost(state: GameState): { wood: number; stone: number } | null {
  if (state.shrineBuilt && !state.relic1 && state.shrineFeeds < SHRINE_FEEDS_NEEDED) {
    return FEED_COST;
  }
  if (
    state.shrineBuilt &&
    state.relic1 &&
    state.hutLevel >= 3 &&
    state.quarryLevel >= 3 &&
    !state.relic2 &&
    state.shrineFeeds >= SHRINE_FEEDS_NEEDED &&
    state.shrineFeeds < MAX_SHRINE_FEEDS
  ) {
    return RELIC2_FEED_COST;
  }
  return null;
}

export function canFeedShrine(state: GameState): boolean {
  const cost = shrineFeedCost(state);
  if (!cost) {
    return false;
  }
  return state.wood >= cost.wood && state.stone >= cost.stone;
}

export function feedShrine(state: GameState): boolean {
  const cost = shrineFeedCost(state);
  if (!cost || state.wood < cost.wood || state.stone < cost.stone) {
    return false;
  }
  state.wood -= cost.wood;
  state.stone -= cost.stone;
  if (!state.relic1) {
    state.shrineFeeds = Math.min(SHRINE_FEEDS_NEEDED, state.shrineFeeds + 1);
    if (state.shrineFeeds >= SHRINE_FEEDS_NEEDED) {
      state.relic1 = true;
    }
  } else {
    state.shrineFeeds = Math.min(MAX_SHRINE_FEEDS, state.shrineFeeds + 1);
    if (state.shrineFeeds >= MAX_SHRINE_FEEDS) {
      state.relic2 = true;
    }
  }
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

  const amount = autoTickAmount(state);

  const hutInterval = hutWoodIntervalMs(state.hutLevel);
  if (hutInterval > 0) {
    acc.hutMs += dtMs;
    while (acc.hutMs >= hutInterval) {
      acc.hutMs -= hutInterval;
      state.wood += amount;
      gained.wood += amount;
    }
  }

  if (state.quarryLevel >= 1) {
    acc.quarryMs += dtMs;
    while (acc.quarryMs >= QUARRY_L1_INTERVAL_MS) {
      acc.quarryMs -= QUARRY_L1_INTERVAL_MS;
      state.stone += amount;
      gained.stone += amount;
    }
  }

  return gained;
}
