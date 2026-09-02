import { describe, expect, it } from 'vitest';
import { canUpgradeHut, upgradeHut } from './economy';
import { createInitialState } from './state';
import { parseSave, SCHEMA_VERSION, serializeState } from './save';

const m3Defaults = {
  shrineBuilt: false,
  shrineFeeds: 0,
  relic1: false,
  relic2: false,
};

describe('save', () => {
  it('v3 roundtrip preserves fields', () => {
    const state = createInitialState();
    state.wood = 7;
    state.stone = 3;
    state.hutLevel = 2;
    state.quarryLevel = 1;
    state.shrineBuilt = true;
    state.shrineFeeds = 4;
    state.relic1 = false;
    state.relic2 = false;
    const blob = serializeState(state, 1_700_000_000_000);
    const restored = parseSave(blob);
    expect(restored).toEqual({
      wood: 7,
      stone: 3,
      hutLevel: 2,
      quarryLevel: 1,
      shrineBuilt: true,
      shrineFeeds: 4,
      relic1: false,
      relic2: false,
    });
    expect(blob.schemaVersion).toBe(3);
    expect(SCHEMA_VERSION).toBe(3);
    expect(blob.updatedAt).toBe(1_700_000_000_000);
  });

  it('migrates v2 blob into v3 defaults', () => {
    const restored = parseSave({
      schemaVersion: 2,
      wood: 7,
      stone: 3,
      hutLevel: 2,
      quarryLevel: 1,
      updatedAt: 1_700_000_000_000,
    });
    expect(restored).toEqual({
      wood: 7,
      stone: 3,
      hutLevel: 2,
      quarryLevel: 1,
      ...m3Defaults,
    });
  });

  it('migrates v1 hutBuilt into hutLevel and fills M3 defaults', () => {
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
      ...m3Defaults,
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
      ...m3Defaults,
    });
  });

  it('loads hutLevel 3 from v3 file but M3 does not upgrade further', () => {
    const restored = parseSave({
      schemaVersion: 3,
      wood: 40,
      stone: 20,
      hutLevel: 3,
      quarryLevel: 1,
      shrineBuilt: false,
      shrineFeeds: 0,
      relic1: false,
      relic2: false,
      updatedAt: 1,
    });
    expect(restored.hutLevel).toBe(3);
    expect(canUpgradeHut(restored)).toBe(false);
    expect(upgradeHut(restored)).toBe(false);
    expect(restored.hutLevel).toBe(3);
  });

  it('v3 roundtrip preserves relic2 and hut/quarry level 3', () => {
    const state = createInitialState();
    state.wood = 11;
    state.stone = 9;
    state.hutLevel = 3;
    state.quarryLevel = 3;
    state.shrineBuilt = true;
    state.shrineFeeds = 14;
    state.relic1 = true;
    state.relic2 = true;
    const blob = serializeState(state, 1_700_000_000_000);
    expect(blob.schemaVersion).toBe(3);
    expect(parseSave(blob)).toEqual({
      wood: 11,
      stone: 9,
      hutLevel: 3,
      quarryLevel: 3,
      shrineBuilt: true,
      shrineFeeds: 14,
      relic1: true,
      relic2: true,
    });
  });

  it('clamps shrineFeeds to 0–14', () => {
    const high = parseSave({
      schemaVersion: 3,
      wood: 0,
      stone: 0,
      hutLevel: 3,
      quarryLevel: 3,
      shrineBuilt: true,
      shrineFeeds: 99,
      relic1: false,
      relic2: false,
      updatedAt: 1,
    });
    expect(high.shrineFeeds).toBe(14);
    expect(high.relic1).toBe(true);
    expect(high.relic2).toBe(true);
    expect(high.shrineBuilt).toBe(true);

    const low = parseSave({
      schemaVersion: 3,
      wood: 0,
      stone: 0,
      hutLevel: 2,
      quarryLevel: 1,
      shrineBuilt: true,
      shrineFeeds: -2,
      relic1: false,
      relic2: false,
      updatedAt: 1,
    });
    expect(low.shrineFeeds).toBe(0);
    expect(low.relic1).toBe(false);
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
    expect(parseSave({ schemaVersion: 3 })).toEqual(fresh);
  });
});
