export const SQUASH_MS = 120;
export const FLOAT_MS = 400;
export const HUT_IN_MS = 280;
export const QUARRY_IN_MS = 280;
export const SHRINE_IN_MS = 280;
export const HUT_PULSE_MS = 220;
export const SETTLE_MS = 340;
export const FLASH_MS = 120;
export const HUT_L2_DRAW_SCALE = 1.22;
export const TIER3_VS_TIER2_SCALE = 1.18;
export const HUT_L3_DRAW_SCALE = HUT_L2_DRAW_SCALE * TIER3_VS_TIER2_SCALE;
export const QUARRY_L2_DRAW_SCALE = 1.22;
export const QUARRY_L3_DRAW_SCALE = QUARRY_L2_DRAW_SCALE * TIER3_VS_TIER2_SCALE;
export const RELIC_BEAT_MS = 900;

export type SquashFx = {
  kind: 'tree' | 'rock';
  elapsed: number;
  rockIndex?: number;
};

export type FloatText = {
  text: string;
  x: number;
  y: number;
  elapsed: number;
};

export type TimedFx = {
  elapsed: number;
};

export function squashAmount(fx: SquashFx | null, kind: 'tree' | 'rock', rockIndex?: number): number {
  if (!fx || fx.kind !== kind || fx.elapsed >= SQUASH_MS) {
    return 0;
  }
  if (kind === 'rock' && rockIndex !== undefined && fx.rockIndex !== rockIndex) {
    return 0;
  }
  return Math.sin((fx.elapsed / SQUASH_MS) * Math.PI);
}

export function appearScale(fx: TimedFx | null, built: boolean): number {
  if (!built) {
    return 0;
  }
  if (!fx) {
    return 1;
  }
  const p = Math.min(1, fx.elapsed / HUT_IN_MS);
  return 1 - (1 - p) ** 3;
}

export function hutAppearScale(fx: TimedFx | null, hutBuilt: boolean): number {
  return appearScale(fx, hutBuilt);
}

function pulseScale(from: number, to: number, pulse: TimedFx | null): number {
  if (!pulse) {
    return to;
  }
  const p = Math.min(1, pulse.elapsed / HUT_PULSE_MS);
  const overshoot = Math.sin(p * Math.PI) * 0.08;
  return from + (to - from) * p + overshoot;
}

export function hutVisualScale(
  hutLevel: number,
  appear: TimedFx | null,
  pulse: TimedFx | null,
): number {
  if (hutLevel < 1) {
    return 0;
  }
  const intro = appearScale(appear, true);
  if (hutLevel === 1) {
    return intro;
  }
  if (hutLevel >= 3) {
    return pulseScale(HUT_L2_DRAW_SCALE, HUT_L3_DRAW_SCALE, pulse);
  }
  return pulseScale(1, HUT_L2_DRAW_SCALE, pulse);
}

export function quarryVisualScale(
  quarryLevel: number,
  appear: TimedFx | null,
  pulse: TimedFx | null,
): number {
  if (quarryLevel < 1) {
    return 0;
  }
  const intro = appearScale(appear, true);
  if (quarryLevel === 1) {
    return intro;
  }
  if (quarryLevel >= 3) {
    return pulseScale(QUARRY_L2_DRAW_SCALE, QUARRY_L3_DRAW_SCALE, pulse);
  }
  return pulseScale(1, QUARRY_L2_DRAW_SCALE, pulse);
}

export function islandSettleY(fx: TimedFx | null): number {
  if (!fx || fx.elapsed >= SETTLE_MS) {
    return 0;
  }
  const p = fx.elapsed / SETTLE_MS;
  return Math.sin(p * Math.PI) * (1 - p) * 8;
}

export function floatProgress(elapsed: number): { alpha: number; yShift: number } {
  const p = Math.min(1, Math.max(0, elapsed / FLOAT_MS));
  return {
    alpha: 1 - p,
    yShift: p * 38,
  };
}

export function relicBeatEnvelope(fx: TimedFx | null): number {
  if (!fx || fx.elapsed < 0 || fx.elapsed >= RELIC_BEAT_MS) {
    return 0;
  }
  return Math.sin((fx.elapsed / RELIC_BEAT_MS) * Math.PI);
}

export function relicAppearScale(fx: TimedFx | null, relic1: boolean): number {
  if (!relic1) {
    return 0;
  }
  if (!fx) {
    return 1;
  }
  const p = Math.min(1, fx.elapsed / RELIC_BEAT_MS);
  return 1 - (1 - p) ** 3;
}

export function relicIdleAlpha(timeMs: number): number {
  return 0.78 + 0.18 * (0.5 + 0.5 * Math.sin(timeMs / 480));
}
