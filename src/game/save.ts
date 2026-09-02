import { createInitialState, type GameState, type HutLevel, type QuarryLevel } from './state';

export const SAVE_KEY = 'reliktinseln-mini-v1';
export const SCHEMA_VERSION = 3;
export const SAVE_FLUSH_MS = 15_000;

export type SaveBlob = {
  schemaVersion: number;
  wood: number;
  stone: number;
  hutLevel: HutLevel;
  quarryLevel: QuarryLevel;
  shrineBuilt: boolean;
  shrineFeeds: number;
  relic1: boolean;
  relic2: boolean;
  updatedAt: number;
};

type V1SaveBlob = {
  schemaVersion: 1;
  wood: number;
  stone: number;
  hutBuilt: boolean;
  goalDone: boolean;
  updatedAt: number;
};

type V2SaveBlob = {
  schemaVersion: 2;
  wood: number;
  stone: number;
  hutLevel: 0 | 1 | 2;
  quarryLevel: 0 | 1;
  updatedAt: number;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function serializeState(state: GameState, updatedAt = Date.now()): SaveBlob {
  return {
    schemaVersion: SCHEMA_VERSION,
    wood: state.wood,
    stone: state.stone,
    hutLevel: state.hutLevel,
    quarryLevel: state.quarryLevel,
    shrineBuilt: state.shrineBuilt,
    shrineFeeds: clampFeeds(state.shrineFeeds),
    relic1: state.relic1,
    relic2: state.relic2,
    updatedAt,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isV3HutLevel(value: unknown): value is HutLevel {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function isV3QuarryLevel(value: unknown): value is QuarryLevel {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function isV2HutLevel(value: unknown): value is 0 | 1 | 2 {
  return value === 0 || value === 1 || value === 2;
}

function isV2QuarryLevel(value: unknown): value is 0 | 1 {
  return value === 0 || value === 1;
}

function clampFeeds(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(14, Math.max(0, Math.round(value)));
}

export function isSaveBlob(value: unknown): value is SaveBlob {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const blob = value as Record<string, unknown>;
  return (
    blob.schemaVersion === SCHEMA_VERSION &&
    isFiniteNumber(blob.wood) &&
    blob.wood >= 0 &&
    isFiniteNumber(blob.stone) &&
    blob.stone >= 0 &&
    isV3HutLevel(blob.hutLevel) &&
    isV3QuarryLevel(blob.quarryLevel) &&
    typeof blob.shrineBuilt === 'boolean' &&
    isFiniteNumber(blob.shrineFeeds) &&
    typeof blob.relic1 === 'boolean' &&
    typeof blob.relic2 === 'boolean' &&
    isFiniteNumber(blob.updatedAt)
  );
}

function isV1SaveBlob(value: unknown): value is V1SaveBlob {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const blob = value as Record<string, unknown>;
  return (
    blob.schemaVersion === 1 &&
    isFiniteNumber(blob.wood) &&
    blob.wood >= 0 &&
    isFiniteNumber(blob.stone) &&
    blob.stone >= 0 &&
    typeof blob.hutBuilt === 'boolean' &&
    typeof blob.goalDone === 'boolean' &&
    isFiniteNumber(blob.updatedAt)
  );
}

function isV2SaveBlob(value: unknown): value is V2SaveBlob {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const blob = value as Record<string, unknown>;
  return (
    blob.schemaVersion === 2 &&
    isFiniteNumber(blob.wood) &&
    blob.wood >= 0 &&
    isFiniteNumber(blob.stone) &&
    blob.stone >= 0 &&
    isV2HutLevel(blob.hutLevel) &&
    isV2QuarryLevel(blob.quarryLevel) &&
    isFiniteNumber(blob.updatedAt)
  );
}

function m3Defaults(): Pick<GameState, 'shrineBuilt' | 'shrineFeeds' | 'relic1' | 'relic2'> {
  return {
    shrineBuilt: false,
    shrineFeeds: 0,
    relic1: false,
    relic2: false,
  };
}

function migrateV1(blob: V1SaveBlob): GameState {
  return {
    wood: blob.wood,
    stone: blob.stone,
    hutLevel: blob.hutBuilt ? 1 : 0,
    quarryLevel: 0,
    ...m3Defaults(),
  };
}

function migrateV2(blob: V2SaveBlob): GameState {
  return {
    wood: blob.wood,
    stone: blob.stone,
    hutLevel: blob.hutLevel,
    quarryLevel: blob.quarryLevel,
    ...m3Defaults(),
  };
}

function normalizeV3(blob: SaveBlob): GameState {
  let shrineBuilt = blob.shrineBuilt;
  let shrineFeeds = clampFeeds(blob.shrineFeeds);
  let relic1 = blob.relic1;
  let relic2 = blob.relic2;
  if (relic2 || shrineFeeds >= 14) {
    shrineBuilt = true;
    shrineFeeds = 14;
    relic1 = true;
    relic2 = true;
  } else if (relic1 || shrineFeeds >= 6) {
    shrineBuilt = true;
    shrineFeeds = Math.max(6, shrineFeeds);
    relic1 = true;
    relic2 = false;
  }
  if (!shrineBuilt) {
    shrineFeeds = 0;
    relic1 = false;
    relic2 = false;
  }
  return {
    wood: blob.wood,
    stone: blob.stone,
    hutLevel: blob.hutLevel,
    quarryLevel: blob.quarryLevel,
    shrineBuilt,
    shrineFeeds,
    relic1,
    relic2,
  };
}

export function parseSave(raw: unknown): GameState {
  if (isSaveBlob(raw)) {
    return normalizeV3(raw);
  }
  if (isV2SaveBlob(raw)) {
    return migrateV2(raw);
  }
  if (isV1SaveBlob(raw)) {
    return migrateV1(raw);
  }
  return createInitialState();
}

export function loadFromStorage(storage: StorageLike): GameState {
  try {
    const text = storage.getItem(SAVE_KEY);
    if (!text) {
      return createInitialState();
    }
    return parseSave(JSON.parse(text) as unknown);
  } catch {
    return createInitialState();
  }
}

export function saveToStorage(storage: StorageLike, state: GameState): void {
  storage.setItem(SAVE_KEY, JSON.stringify(serializeState(state)));
}

export function clearSave(storage: StorageLike): void {
  storage.removeItem(SAVE_KEY);
}

export function startSaveScheduler(options: {
  getState: () => GameState;
  storage: StorageLike;
}): { flush: () => void; stop: () => void } {
  const flush = (): void => {
    saveToStorage(options.storage, options.getState());
  };

  const intervalId = setInterval(flush, SAVE_FLUSH_MS);

  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  };
  const onPageHide = (): void => {
    flush();
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  return {
    flush,
    stop() {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    },
  };
}
