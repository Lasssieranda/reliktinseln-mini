import type { GameState } from './state';
import { canBuildHut } from './economy';
import { computeLayout, type Layout, type Rect } from './layers';
import {
  FLASH_MS,
  floatProgress,
  hutAppearScale,
  islandSettleY,
  squashAmount,
  type FloatText,
  type SquashFx,
  type TimedFx,
} from './fx';
import { computeStageView, type StageView } from './view';

export type ViewSize = {
  width: number;
  height: number;
  dpr: number;
};

export type TapFlash = {
  kind: 'tree' | 'rock' | 'plot';
  remaining: number;
};

export type SceneFx = {
  plotPulse: number;
  flash: TapFlash | null;
  squash: SquashFx | null;
  floats: FloatText[];
  hutBuild: TimedFx | null;
  islandSettle: TimedFx | null;
};

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

function drawSkyBleed(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#7EB7D6');
  sky.addColorStop(0.48, '#B7D4E4');
  sky.addColorStop(1, '#D8E8EE');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  ctx.beginPath();
  ctx.ellipse(w * 0.16, h * 0.1, Math.max(42, w * 0.07), 16, -0.12, 0, Math.PI * 2);
  ctx.ellipse(w * 0.24, h * 0.09, Math.max(28, w * 0.045), 12, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.78, h * 0.14, Math.max(50, w * 0.08), 15, 0.06, 0, Math.PI * 2);
  ctx.ellipse(w * 0.88, h * 0.13, Math.max(30, w * 0.05), 11, -0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaterBleed(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  waterY: number,
): void {
  const y = Math.max(0, Math.min(h, waterY));
  const grad = ctx.createLinearGradient(0, y, 0, h);
  grad.addColorStop(0, '#6AABC0');
  grad.addColorStop(0.28, '#5A9BB3');
  grad.addColorStop(1, '#3E7A96');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y, w, Math.max(0, h - y));

  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(0, y, w, 8);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(w * 0.22, y + 26, w * 0.14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.7, y + 48, w * 0.16, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.48, y + 78, w * 0.11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawIsland(ctx: CanvasRenderingContext2D, layout: Layout): void {
  const { island, hut } = layout;

  ctx.fillStyle = 'rgba(36, 72, 88, 0.28)';
  ctx.beginPath();
  ctx.ellipse(island.cx + 4, island.cy + island.ry * 0.46, island.rx * 1.08, island.ry * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#A78B5C';
  ctx.beginPath();
  ctx.ellipse(island.cx, island.cy + 7, island.rx, island.ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D2BE88';
  ctx.beginPath();
  ctx.ellipse(island.cx, island.cy + 2, island.rx * 0.96, island.ry * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#C4B076';
  ctx.beginPath();
  ctx.ellipse(island.cx + 6, island.cy + island.ry * 0.18, island.rx * 0.72, island.ry * 0.42, 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#557A42';
  ctx.beginPath();
  ctx.ellipse(island.cx - 6, island.cy - 10, island.rx * 0.84, island.ry * 0.7, -0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6F9A55';
  ctx.beginPath();
  ctx.ellipse(island.cx - 28, island.cy - 22, island.rx * 0.36, island.ry * 0.3, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(island.cx + 36, island.cy - 8, island.rx * 0.26, island.ry * 0.22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7AAA60';
  ctx.beginPath();
  ctx.ellipse(island.cx + 8, island.cy - 28, island.rx * 0.18, island.ry * 0.14, 0.1, 0, Math.PI * 2);
  ctx.fill();

  const pathStartX = island.cx + 12;
  const pathStartY = island.cy + island.ry * 0.58;
  const pathEndX = hut.x + hut.w * 0.52;
  const pathEndY = hut.y + hut.h * 0.96;
  ctx.strokeStyle = '#C9B47A';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pathStartX, pathStartY);
  ctx.quadraticCurveTo(island.cx + 22, island.cy + 28, pathEndX, pathEndY);
  ctx.stroke();
  ctx.strokeStyle = '#D8C48C';
  ctx.lineWidth = 10;
  ctx.stroke();
}

function applySquash(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  amount: number,
): void {
  ctx.translate(originX, originY);
  ctx.scale(1 + 0.16 * amount, 1 - 0.2 * amount);
  ctx.translate(-originX, -originY);
}

function drawTree(ctx: CanvasRenderingContext2D, rect: Rect, squash: number, flash: boolean): void {
  const cx = rect.x + rect.w / 2;
  const baseY = rect.y + rect.h * 0.9;
  const visW = rect.w * 0.86;
  const visH = rect.h * 0.9;
  const visY = rect.y + rect.h * 0.04;

  ctx.fillStyle = 'rgba(48, 70, 40, 0.22)';
  ctx.beginPath();
  ctx.ellipse(cx + 2, baseY + 6, visW * 0.34, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  applySquash(ctx, cx, baseY, squash);

  const trunkW = visW * 0.18;
  const trunkH = visH * 0.38;
  ctx.fillStyle = flash ? '#8A5A32' : '#6B4428';
  roundRect(ctx, cx - trunkW / 2, baseY - trunkH, trunkW, trunkH, 4);
  ctx.fill();
  ctx.fillStyle = 'rgba(232, 196, 150, 0.22)';
  roundRect(ctx, cx - trunkW / 2 + 3, baseY - trunkH + 5, trunkW * 0.3, trunkH * 0.62, 2);
  ctx.fill();

  const crownCy = visY + visH * 0.36;
  ctx.fillStyle = flash ? '#4A8A4A' : '#2F6A34';
  ctx.beginPath();
  ctx.ellipse(cx - visW * 0.2, crownCy + 10, visW * 0.34, visH * 0.22, -0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#5C9A58' : '#3A7A3D';
  ctx.beginPath();
  ctx.ellipse(cx + visW * 0.18, crownCy + 8, visW * 0.32, visH * 0.2, 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#6AAA62' : '#4C8E4A';
  ctx.beginPath();
  ctx.ellipse(cx, crownCy - 8, visW * 0.3, visH * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRock(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  squash: number,
  flash: boolean,
  variant: number,
): void {
  const cx = rect.x + rect.w / 2;
  const baseY = rect.y + rect.h * 0.9;
  const pad = 4;
  const x = rect.x + pad;
  const y = rect.y + pad;
  const w = rect.w - pad * 2;
  const h = rect.h - pad * 2;

  ctx.fillStyle = 'rgba(40, 50, 45, 0.2)';
  ctx.beginPath();
  ctx.ellipse(cx + (variant === 1 ? -2 : 2), baseY + 5, w * 0.46, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  applySquash(ctx, cx, baseY, squash);
  if (variant === 1) {
    ctx.translate(cx, 0);
    ctx.scale(-1, 1);
    ctx.translate(-cx, 0);
  }

  ctx.fillStyle = flash ? '#9A9A92' : '#7A7A72';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y + h * 0.72);
  ctx.lineTo(x + w * 0.2, y + h * 0.28);
  ctx.lineTo(x + w * 0.5, y + h * 0.06);
  ctx.lineTo(x + w * 0.9, y + h * 0.34);
  ctx.lineTo(x + w * 0.96, y + h * 0.78);
  ctx.lineTo(x + w * 0.52, y + h * 0.96);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash ? '#8A8A82' : '#686860';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y + h * 0.06);
  ctx.lineTo(x + w * 0.9, y + h * 0.34);
  ctx.lineTo(x + w * 0.54, y + h * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash ? '#787870' : '#575750';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.54, y + h * 0.56);
  ctx.lineTo(x + w * 0.96, y + h * 0.78);
  ctx.lineTo(x + w * 0.52, y + h * 0.96);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.28);
  ctx.lineTo(x + w * 0.5, y + h * 0.06);
  ctx.lineTo(x + w * 0.72, y + h * 0.2);
  ctx.stroke();

  ctx.restore();
}

function drawPlot(ctx: CanvasRenderingContext2D, rect: Rect, pulse: number, flash: boolean): void {
  const pad = 5;
  ctx.save();
  ctx.globalAlpha = 0.58 + pulse * 0.35;
  ctx.fillStyle = flash ? '#F0DE90' : '#E8D48C';
  roundRect(ctx, rect.x - pad, rect.y - pad, rect.w + pad * 2, rect.h + pad * 2, 12);
  ctx.fill();
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#C9A227';
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#6A5A20';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hütte', rect.x + rect.w / 2, rect.y + rect.h / 2);
}

function drawHut(ctx: CanvasRenderingContext2D, rect: Rect, scale: number): void {
  const cx = rect.x + rect.w / 2;
  const baseY = rect.y + rect.h;

  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -baseY);

  ctx.fillStyle = 'rgba(40, 50, 35, 0.2)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 2, rect.w * 0.4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const wallX = rect.x + rect.w * 0.16;
  const wallW = rect.w * 0.68;
  const wallH = rect.h * 0.46;
  const wallY = rect.y + rect.h * 0.5;

  ctx.fillStyle = '#C9A36C';
  roundRect(ctx, wallX, wallY, wallW, wallH, 3);
  ctx.fill();
  ctx.fillStyle = '#D8B880';
  ctx.fillRect(wallX + 2, wallY + 2, wallW * 0.16, wallH - 5);
  ctx.fillStyle = '#B38D58';
  ctx.fillRect(wallX + wallW - 7, wallY + 6, 5, wallH - 10);

  ctx.fillStyle = '#8B3F2E';
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.04, wallY + 10);
  ctx.lineTo(cx, rect.y + 4);
  ctx.lineTo(rect.x + rect.w * 0.96, wallY + 10);
  ctx.lineTo(rect.x + rect.w * 0.88, wallY + 18);
  ctx.lineTo(cx, rect.y + 16);
  ctx.lineTo(rect.x + rect.w * 0.12, wallY + 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#A04E3A';
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w * 0.1, wallY + 10);
  ctx.lineTo(cx, rect.y + 6);
  ctx.lineTo(cx, rect.y + 16);
  ctx.lineTo(rect.x + rect.w * 0.18, wallY + 16);
  ctx.closePath();
  ctx.fill();

  const doorW = wallW * 0.26;
  const doorH = wallH * 0.7;
  const doorX = wallX + wallW * 0.4;
  const doorY = wallY + wallH - doorH;
  ctx.fillStyle = '#5C3A28';
  roundRect(ctx, doorX, doorY, doorW, doorH, 2);
  ctx.fill();
  ctx.fillStyle = '#E8D48C';
  ctx.beginPath();
  ctx.arc(doorX + doorW * 0.76, doorY + doorH * 0.52, 1.7, 0, Math.PI * 2);
  ctx.fill();

  const winW = wallW * 0.2;
  const winH = wallH * 0.3;
  const winX = wallX + wallW * 0.1;
  const winY = wallY + wallH * 0.2;
  ctx.fillStyle = '#8EC4D4';
  roundRect(ctx, winX, winY, winW, winH, 2);
  ctx.fill();
  ctx.strokeStyle = '#5C3A28';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winY);
  ctx.lineTo(winX + winW / 2, winY + winH);
  ctx.moveTo(winX, winY + winH / 2);
  ctx.lineTo(winX + winW, winY + winH / 2);
  ctx.stroke();

  ctx.restore();
}

function drawFloatTexts(ctx: CanvasRenderingContext2D, floats: FloatText[]): void {
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const item of floats) {
    const { alpha, yShift } = floatProgress(item.elapsed);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#243024';
    ctx.strokeStyle = 'rgba(255, 250, 240, 0.85)';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(item.text, item.x, item.y - yShift);
    ctx.fillText(item.text, item.x, item.y - yShift);
    ctx.restore();
  }
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  view: StageView,
  state: GameState,
  dpr: number,
  fx: SceneFx,
): void {
  const { canvasW, canvasH, scale, ox, oy } = view;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvasW, canvasH);
  drawSkyBleed(ctx, canvasW, canvasH);
  drawWaterBleed(ctx, canvasW, canvasH, oy + layout.waterY * scale);

  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * ox, dpr * oy);

  ctx.save();
  ctx.translate(0, islandSettleY(fx.islandSettle));
  drawIsland(ctx, layout);
  drawTree(ctx, layout.tree, squashAmount(fx.squash, 'tree'), fx.flash?.kind === 'tree');
  layout.rocks.forEach((rock, index) => {
    drawRock(ctx, rock, squashAmount(fx.squash, 'rock', index), fx.flash?.kind === 'rock', index);
  });

  const hutScale = hutAppearScale(fx.hutBuild, state.hutBuilt);
  if (state.hutBuilt && hutScale > 0) {
    drawHut(ctx, layout.hut, hutScale);
  } else if (!state.hutBuilt && canBuildHut(state)) {
    drawPlot(ctx, layout.plot, fx.plotPulse, fx.flash?.kind === 'plot');
  }
  ctx.restore();

  drawFloatTexts(ctx, fx.floats);
}

export function layoutFromCanvas(canvas: HTMLCanvasElement): {
  layout: Layout;
  view: StageView;
  dpr: number;
} {
  const size = resizeCanvas(canvas);
  return {
    layout: computeLayout(),
    view: computeStageView(size.width, size.height),
    dpr: size.dpr,
  };
}

export { FLASH_MS };
