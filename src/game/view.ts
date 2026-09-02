export const STAGE_W = 390;
export const STAGE_H = 720;

export type StageView = {
  canvasW: number;
  canvasH: number;
  scale: number;
  ox: number;
  oy: number;
};

export function computeStageView(canvasW: number, canvasH: number): StageView {
  const w = Math.max(1, canvasW);
  const h = Math.max(1, canvasH);
  const scale = Math.min(w / STAGE_W, h / STAGE_H);
  const ox = (w - STAGE_W * scale) / 2;
  const oy = (h - STAGE_H * scale) / 2;
  return { canvasW: w, canvasH: h, scale, ox, oy };
}

export function canvasCssToStage(
  cssX: number,
  cssY: number,
  view: StageView,
): { x: number; y: number } {
  return {
    x: (cssX - view.ox) / view.scale,
    y: (cssY - view.oy) / view.scale,
  };
}
