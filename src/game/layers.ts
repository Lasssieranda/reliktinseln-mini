import { HUT_L2_DRAW_SCALE, HUT_L3_DRAW_SCALE, QUARRY_L2_DRAW_SCALE, QUARRY_L3_DRAW_SCALE } from './fx';
import { STAGE_H, STAGE_W } from './view';

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Ellipse = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export const HUT_RECT: Rect = { x: 146, y: 346, w: 90, h: 80 };
export const QUARRY_RECT: Rect = { x: 214, y: 438, w: 88, h: 70 };
export const SHRINE_RECT: Rect = { x: 78, y: 468, w: 84, h: 72 };
export const RELIC_RECT: Rect = { x: 172, y: 292, w: 52, h: 52 };
export const RELIC2_RECT: Rect = { x: 220, y: 300, w: 52, h: 52 };

export type Layout = {
  width: number;
  height: number;
  waterY: number;
  island: Ellipse;
  tree: Rect;
  rocks: Rect[];
  hut: Rect;
  quarry: Rect;
  shrine: Rect;
  relic: Rect;
  relic2: Rect;
  plot: Rect;
};

export function hitTest(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

export function scaleRectAroundCenter(rect: Rect, scale: number): Rect {
  const w = rect.w * scale;
  const h = rect.h * scale;
  return {
    x: rect.x + (rect.w - w) / 2,
    y: rect.y + (rect.h - h) / 2,
    w,
    h,
  };
}

export function hutHitRect(hutLevel: number): Rect {
  if (hutLevel >= 3) {
    return scaleRectAroundCenter(HUT_RECT, HUT_L3_DRAW_SCALE);
  }
  if (hutLevel >= 2) {
    return scaleRectAroundCenter(HUT_RECT, HUT_L2_DRAW_SCALE);
  }
  return { ...HUT_RECT };
}

export function quarryHitRect(quarryLevel: number): Rect {
  if (quarryLevel >= 3) {
    return scaleRectAroundCenter(QUARRY_RECT, QUARRY_L3_DRAW_SCALE);
  }
  if (quarryLevel >= 2) {
    return scaleRectAroundCenter(QUARRY_RECT, QUARRY_L2_DRAW_SCALE);
  }
  return { ...QUARRY_RECT };
}

function ensureMinHit(rect: Rect, min = 48): Rect {
  if (rect.w >= min && rect.h >= min) {
    return { ...rect };
  }
  return scaleRectAroundCenter(rect, Math.max(min / rect.w, min / rect.h));
}

export function computeLayout(opts?: {
  hutLevel?: number;
  quarryLevel?: number;
  shrineBuilt?: boolean;
  relic1?: boolean;
  relic2?: boolean;
}): Layout {
  const width = STAGE_W;
  const height = STAGE_H;
  const hutLevel = opts?.hutLevel ?? 0;
  const quarryLevel = opts?.quarryLevel ?? 0;
  const shrineBuilt = opts?.shrineBuilt ?? false;
  const relic1 = opts?.relic1 ?? false;
  const relic2 = opts?.relic2 ?? false;

  const island: Ellipse = {
    cx: 195,
    cy: 452,
    rx: 156,
    ry: 100,
  };

  const tree: Rect = {
    x: 42,
    y: 278,
    w: 96,
    h: 168,
  };

  const rockA: Rect = {
    x: 250,
    y: 378,
    w: 62,
    h: 50,
  };
  const rockB: Rect = {
    x: 310,
    y: 448,
    w: 54,
    h: 48,
  };

  const hut = hutHitRect(hutLevel);
  const quarry = quarryHitRect(quarryLevel);
  const shrine: Rect = { ...SHRINE_RECT };
  const relic: Rect = ensureMinHit(RELIC_RECT);
  const relic2Rect: Rect = ensureMinHit(RELIC2_RECT);

  let plot: Rect;
  if (hutLevel === 0) {
    plot = { ...HUT_RECT };
  } else if (quarryLevel === 0) {
    plot = { ...QUARRY_RECT };
  } else if (hutLevel < 2) {
    plot = hutHitRect(Math.max(hutLevel, 1));
  } else if (!shrineBuilt) {
    plot = { ...shrine };
  } else if (!relic1) {
    plot = { ...shrine };
  } else if (quarryLevel < 2) {
    plot = quarryHitRect(Math.max(quarryLevel, 1));
  } else if (hutLevel < 3) {
    plot = hutHitRect(hutLevel);
  } else if (quarryLevel < 3) {
    plot = quarryHitRect(quarryLevel);
  } else if (!relic2) {
    plot = { ...shrine };
  } else {
    plot = hut;
  }

  return {
    width,
    height,
    waterY: 438,
    island,
    tree,
    rocks: [rockA, rockB],
    hut,
    quarry,
    shrine,
    relic,
    relic2: relic2Rect,
    plot,
  };
}
