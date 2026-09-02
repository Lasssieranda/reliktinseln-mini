import { describe, expect, it } from 'vitest';
import { createInitialState } from './state';
import { parseSave, serializeState } from './save';

describe('save', () => {
  it('roundtrip preserves fields', () => {
    const state = createInitialState();
    state.wood = 7;
    state.stone = 3;
    state.hutBuilt = true;
    state.goalDone = true;
    const blob = serializeState(state, 1_700_000_000_000);
    const restored = parseSave(blob);
    expect(restored).toEqual({
      wood: 7,
      stone: 3,
      hutBuilt: true,
      goalDone: true,
    });
    expect(blob.schemaVersion).toBe(1);
    expect(blob.updatedAt).toBe(1_700_000_000_000);
  });

  it('broken or unknown schema resets to fresh state', () => {
    const fresh = createInitialState();
    expect(parseSave(null)).toEqual(fresh);
    expect(parseSave(undefined)).toEqual(fresh);
    expect(parseSave('nope')).toEqual(fresh);
    expect(parseSave({ schemaVersion: 99, wood: 10, stone: 5, hutBuilt: true, goalDone: true, updatedAt: 1 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 1 })).toEqual(fresh);
    expect(parseSave({ schemaVersion: 1, wood: -1, stone: 0, hutBuilt: false, goalDone: false, updatedAt: 1 })).toEqual(fresh);
  });
});
