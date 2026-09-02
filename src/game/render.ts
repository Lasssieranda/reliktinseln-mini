import type { GameState } from './state';
import { canBuildHut } from './economy';
import { computeLayout, type Layout, type Rect } from './layers';

export type ViewSize = {
  width: number;
  height: number;
  dpr: number;
};

export type TapFlash = {
  kind: 'tree' | 'rock' | 'plot';
  remaining: number;
};

const FLASH_MS = 180;

export function resizeCanvas(canvas: HTMLCanvasElement): ViewSize {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth));
  const height = Math.max(1, Math.round(canvas.clientHeight));
  const nextW = Math.round(width * dpr);
  const nextH = Math.round(height * dpr);
  if (canvas.width !== nextW) {
    canvas.width = nextW;
  }
  if (canvas.height !== nextH) {
    canvas.height = nextH;
  }
  return { width, height, dpr };
}

export function attachViewportListeners(onResize: () => void): () => void {
  window.addEventListener('resize', onResize);
  const viewport = window.visualViewport;
  viewport?.addEventListener('resize', onResize);
  viewport?.addEventListener('scroll', onResize);
  return () => {
    window.removeEventListener('resize', onResize);
    viewport?.removeEventListener('resize', onResize);
    viewport?.removeEventListener('scroll', onResize);
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawSky(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const sky = ctx.createLinearGradient(0, 0, 0, layout.height);
  sky.addColorStop(0, '#7EB7D6');
  sky.addColorStop(0.55, '#C5DDE8');
  sky.addColorStop(1, '#D8E8EE');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, layout.width, layout.height);
}

function drawWater(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const { water } = layout;
  const grad = ctx.createLinearGradient(0, water.y, 0, water.y + water.h);
  grad.addColorStop(0, '#5A9BB3');
  grad.addColorStop(1, '#3E7A96');
  ctx.fillStyle = grad;
  ctx.fillRect(water.x, water.y, water.w, water.h);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(layout.width * 0.25, water.y + 18, layout.width * 0.18, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(layout.width * 0.72, water.y + 32, layout.width * 0.14, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawIsland(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const { island } = layout;
  ctx.fillStyle = '#3E7A96';
  ctx.beginPath();
  ctx.ellipse(island.cx, island.cy + island.ry * 0.22, island.rx * 1.02, island.ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#C2B280';
  ctx.beginPath();
  ctx.ellipse(island.cx, island.cy + 4, island.rx, island.ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#557A42';
  ctx.beginPath();
  ctx.ellipse(island.cx, island.cy, island.rx * 0.94, island.ry * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6F9A55';
  ctx.beginPath();
  ctx.ellipse(island.cx, island.cy - island.ry * 0.12, island.rx * 0.82, island.ry * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTree(ctx: CanvasRenderingContext2D, rect: Rect, flash: boolean): void {
  const trunkW = rect.w * 0.2;
  const trunkH = rect.h * 0.4;
  const trunkX = rect.x + rect.w / 2 - trunkW / 2;
  const trunkY = rect.y + rect.h - trunkH;
  ctx.fillStyle = flash ? '#8A5A32' : '#6A4428';
  roundRect(ctx, trunkX, trunkY, trunkW, trunkH, 4);
  ctx.fill();

  ctx.fillStyle = flash ? '#4A8A4A' : '#2C5C30';
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w * 0.5, rect.y + rect.h * 0.42, rect.w * 0.42, rect.h * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#5C9A58' : '#3A7A3D';
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w * 0.5, rect.y + rect.h * 0.32, rect.w * 0.34, rect.h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, rect: Rect, flash: boolean): void {
  ctx.fillStyle = flash ? '#A3A399' : '#6E6E66';
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w * 0.48, rect.y + rect.h * 0.62, rect.w * 0.48, rect.h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#B8B8B0' : '#8B8B82';
  ctx.beginPath();
  ctx.ellipse(rect.x + rect.w * 0.42, rect.y + rect.h * 0.48, rect.w * 0.36, rect.h * 0.36, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlot(ctx: CanvasRenderingContext2D, rect: Rect, pulse: number, flash: boolean): void {
  const pad = 6;
  ctx.save();
  ctx.globalAlpha = 0.55 + pulse * 0.35;
  ctx.fillStyle = flash ? '#F0DE90' : '#E8D48C';
  roundRect(ctx, rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad * 2, 10);
  ctx.fill();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#C9A227';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#6A5A20';
  ctx.font = `600 ${Math.max(12, Math.round(rect.w * 0.16))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hütte', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function drawHut(ctx: CanvasRenderingContext2D, rect: Rect): void {
  const wallH = rect.h * 0.55;
  const wallY = rect.y + rect.h - wallH;
  ctx.fillStyle = '#C4A06E';
  roundRect(ctx, rect.x + rect.w * 0.12, wallY, rect.w * 0.76, wallH, 3);
  ctx.fill();
  ctx.fillStyle = '#D4B483';
  roundRect(ctx, rect.x + rect.w * 0.12, wallY, rect.w * 0.76, wallH * 0.72, 3);
  ctx.fill();

  ctx.fillStyle = '#8B4330';
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.04, wallY + 4);
  ctx.lineTo(rect.x + rect.w * 0.5, rect.y);
  ctx.lineTo(rect.x + rect.w * 0.96, wallY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#A0533C';
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.1, wallY + 4);
  ctx.lineTo(rect.x + rect.w * 0.5, rect.y + 6);
  ctx.lineTo(rect.x + rect.w * 0.9, wallY + 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#5C3A28';
  roundRect(ctx, rect.x + rect.w * 0.44, wallY + wallH * 0.38, rect.w * 0.14, wallH * 0.62, 2);
  ctx.fill();
  ctx.fillStyle = '#E8D48C';
  ctx.fillRect(rect.x + rect.w * 0.24, wallY + wallH * 0.28, rect.w * 0.12, rect.h * 0.1);
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  state: GameState,
  dpr: number,
  plotPulse: number,
  flash: TapFlash | null,
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, layout.width, layout.height);

  drawSky(ctx, layout);
  drawWater(ctx, layout);
  drawIsland(ctx, layout);

  const treeFlash = flash?.kind === 'tree';
  const rockFlash = flash?.kind === 'rock';
  drawTree(ctx, layout.tree, treeFlash);
  for (const rock of layout.rocks) {
    drawRock(ctx, rock, rockFlash);
  }

  if (state.hutBuilt) {
    drawHut(ctx, layout.hut);
  } else if (canBuildHut(state)) {
    drawPlot(ctx, layout.plot, plotPulse, flash?.kind === 'plot');
  }
}

export function layoutFromCanvas(canvas: HTMLCanvasElement): { layout: Layout; dpr: number } {
  const view = resizeCanvas(canvas);
  return { layout: computeLayout(view.width, view.height), dpr: view.dpr };
}

export { FLASH_MS };
