import type { Layout } from './layers';
import { hitTest } from './layers';
import { canvasCssToStage, type StageView } from './view';

export type InputHandlers = {
  onTree: () => void;
  onRock: (index: number) => void;
  onPlot: () => void;
  plotActive: () => boolean;
};

function clientToStage(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  view: StageView,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const cssX = (event.clientX - rect.left) * (view.canvasW / Math.max(1, rect.width));
  const cssY = (event.clientY - rect.top) * (view.canvasH / Math.max(1, rect.height));
  return canvasCssToStage(cssX, cssY, view);
}

export function bindInput(
  canvas: HTMLCanvasElement,
  getWorld: () => { layout: Layout; view: StageView },
  handlers: InputHandlers,
): { unbind: () => void } {
  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.preventDefault();
    const { layout, view } = getWorld();
    const point = clientToStage(event, canvas, view);

    if (handlers.plotActive() && hitTest(layout.plot, point.x, point.y)) {
      handlers.onPlot();
      return;
    }
    if (hitTest(layout.tree, point.x, point.y)) {
      handlers.onTree();
      return;
    }
    for (let i = 0; i < layout.rocks.length; i += 1) {
      if (hitTest(layout.rocks[i], point.x, point.y)) {
        handlers.onRock(i);
        return;
      }
    }
  };

  const onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('contextmenu', onContextMenu);

  return {
    unbind() {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
    },
  };
}
