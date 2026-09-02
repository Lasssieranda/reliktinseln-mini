export const SQUASH_MS = 120;
export const FLOAT_MS = 400;
export const HUT_IN_MS = 280;
export const SETTLE_MS = 340;
export const FLASH_MS = 120;

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

export function hutAppearScale(fx: TimedFx | null, hutBuilt: boolean): number {
  if (!hutBuilt) {
    return 0;
  }
  if (!fx) {
    return 1;
  }
  const p = Math.min(1, fx.elapsed / HUT_IN_MS);
  return 1 - (1 - p) ** 3;
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
