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

export type Layout = {
  width: number;
  height: number;
  waterY: number;
  island: Ellipse;
  tree: Rect;
  rocks: Rect[];
  hut: Rect;
  plot: Rect;
};

export function hitTest(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

export function computeLayout(): Layout {
  const width = STAGE_W;
  const height = STAGE_H;

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

  const hut: Rect = {
    x: 146,
    y: 346,
    w: 90,
    h: 80,
  };

  return {
    width,
    height,
    waterY: 438,
    island,
    tree,
    rocks: [rockA, rockB],
    hut,
    plot: { ...hut },
  };
}
