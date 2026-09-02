import { createInitialState, type GameState } from './state';

export const SAVE_KEY = 'reliktinseln-mini-v1';
export const SCHEMA_VERSION = 1;
export const SAVE_FLUSH_MS = 15_000;

export type SaveBlob = {
  schemaVersion: number;
  wood: number;
  stone: number;
  hutBuilt: boolean;
  goalDone: boolean;
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
    hutBuilt: state.hutBuilt,
    goalDone: state.goalDone,
    updatedAt,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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
    typeof blob.hutBuilt === 'boolean' &&
    typeof blob.goalDone === 'boolean' &&
    isFiniteNumber(blob.updatedAt)
  );
}

export function parseSave(raw: unknown): GameState {
  if (!isSaveBlob(raw)) {
    return createInitialState();
  }
  return {
    wood: raw.wood,
    stone: raw.stone,
    hutBuilt: raw.hutBuilt,
    goalDone: raw.goalDone,
  };
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
