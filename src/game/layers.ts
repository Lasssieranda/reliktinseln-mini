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
  sky: Rect;
  water: Rect;
  island: Ellipse;
  tree: Rect;
  rocks: Rect[];
  hut: Rect;
  plot: Rect;
};

export function hitTest(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

function minSize(value: number, min: number): number {
  return Math.max(min, value);
}

export function computeLayout(width: number, height: number): Layout {
  const island: Ellipse = {
    cx: width * 0.5,
    cy: height * 0.58,
    rx: width * 0.42,
    ry: height * 0.22,
  };

  const treeW = minSize(width * 0.2, 56);
  const treeH = minSize(height * 0.28, 96);
  const tree: Rect = {
    x: island.cx - island.rx * 0.72,
    y: island.cy - island.ry * 1.15,
    w: treeW,
    h: treeH,
  };

  const rockW = minSize(width * 0.16, 48);
  const rockH = minSize(height * 0.09, 40);
  const rockA: Rect = {
    x: island.cx + island.rx * 0.22,
    y: island.cy - island.ry * 0.18,
    w: rockW,
    h: rockH,
  };
  const rockB: Rect = {
    x: island.cx + island.rx * 0.38,
    y: island.cy + island.ry * 0.12,
    w: rockW * 0.78,
    h: rockH * 0.82,
  };

  const hutW = minSize(width * 0.22, 64);
  const hutH = minSize(height * 0.16, 58);
  const hut: Rect = {
    x: island.cx - hutW * 0.42,
    y: island.cy - island.ry * 0.55,
    w: hutW,
    h: hutH,
  };

  return {
    width,
    height,
    sky: { x: 0, y: 0, w: width, h: height },
    water: { x: 0, y: height * 0.62, w: width, h: height * 0.38 },
    island,
    tree,
    rocks: [rockA, rockB],
    hut,
    plot: { ...hut },
  };
}
