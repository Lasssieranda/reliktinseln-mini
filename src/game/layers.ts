import { HUT_L2_DRAW_SCALE } from './fx';
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
  if (hutLevel >= 2) {
    return scaleRectAroundCenter(HUT_RECT, HUT_L2_DRAW_SCALE);
  }
  return { ...HUT_RECT };
}

function relicHitRect(): Rect {
  const min = 48;
  if (RELIC_RECT.w >= min && RELIC_RECT.h >= min) {
    return { ...RELIC_RECT };
  }
  return scaleRectAroundCenter(RELIC_RECT, Math.max(min / RELIC_RECT.w, min / RELIC_RECT.h));
}

export function computeLayout(opts?: {
  hutLevel?: number;
  quarryLevel?: number;
  shrineBuilt?: boolean;
  relic1?: boolean;
}): Layout {
  const width = STAGE_W;
  const height = STAGE_H;
  const hutLevel = opts?.hutLevel ?? 0;
  const quarryLevel = opts?.quarryLevel ?? 0;
  const shrineBuilt = opts?.shrineBuilt ?? false;
  const relic1 = opts?.relic1 ?? false;

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
  const quarry: Rect = { ...QUARRY_RECT };
  const shrine: Rect = { ...SHRINE_RECT };
  const relic: Rect = relicHitRect();

  let plot: Rect;
  if (hutLevel === 0) {
    plot = { ...HUT_RECT };
  } else if (quarryLevel === 0) {
    plot = { ...quarry };
  } else if (hutLevel < 2) {
    plot = hutHitRect(Math.max(hutLevel, 1));
  } else if (!shrineBuilt) {
    plot = { ...shrine };
  } else if (!relic1) {
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
    plot,
  };
}
