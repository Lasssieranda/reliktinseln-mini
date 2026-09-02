import { describe, expect, it } from 'vitest';
import { createInitialState } from './state';
import { parseSave, SCHEMA_VERSION, serializeState } from './save';

describe('save', () => {
  it('v2 roundtrip preserves fields', () => {
    const state = createInitialState();
    state.wood = 7;
    state.stone = 3;
    state.hutLevel = 2;
    state.quarryLevel = 1;
    const blob = serializeState(state, 1_700_000_000_000);
    const restored = parseSave(blob);
    expect(restored).toEqual({
      wood: 7,
      stone: 3,
      hutLevel: 2,
      quarryLevel: 1,
    });
    expect(blob.schemaVersion).toBe(2);
    expect(SCHEMA_VERSION).toBe(2);
    expect(blob.updatedAt).toBe(1_700_000_000_000);
  });

  it('migrates v1 hutBuilt into hutLevel and drops goalDone', () => {
    const built = parseSave({
      schemaVersion: 1,
      wood: 4,
      stone: 2,
      hutBuilt: true,
      goalDone: true,
      updatedAt: 1_700_000_000_000,
    });
    expect(built).toEqual({
      wood: 4,
      stone: 2,
      hutLevel: 1,
      quarryLevel: 0,
    });

    const empty = parseSave({
      schemaVersion: 1,
      wood: 1,
      stone: 0,
      hutBuilt: false,
      goalDone: false,
      updatedAt: 1,
    });
    expect(empty).toEqual({
      wood: 1,
      stone: 0,
      hutLevel: 0,
      quarryLevel: 0,
    });
  });

  it('broken or unknown schema resets to fresh state', () => {
    const fresh = createInitialState();
    expect(parseSave(null)).toEqual(fresh);
    expect(parseSave(undefined)).toEqual(fresh);
    expect(parseSave('nope')).toEqual(fresh);
    expect(parseSave({ schemaVersion: 99, wood: 10, stone: 5, hutLevel: 2, quarryLevel: 1, updatedAt: 1 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 2 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 2, wood: -1, stone: 0, hutLevel: 0, quarryLevel: 0, updatedAt: 1 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 2, wood: 1, stone: 0, hutLevel: 3, quarryLevel: 0, updatedAt: 1 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 1 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 1, wood: -1, stone: 0, hutBuilt: false, goalDone: false, updatedAt: 1 })).toEqual(fresh);
  });
});
