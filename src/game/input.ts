import type { Layout } from './layers';
import { hitTest } from './layers';

export type InputHandlers = {
  onTree: () => void;
  onRock: () => void;
  onPlot: () => void;
  plotActive: () => boolean;
};

function clientToCanvas(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  logicalWidth: number,
  logicalHeight: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = logicalWidth / Math.max(1, rect.width);
  const scaleY = logicalHeight / Math.max(1, rect.height);
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function bindInput(
  canvas: HTMLCanvasElement,
  getLayout: () => Layout,
  handlers: InputHandlers,
): { unbind: () => void } {
  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }
    event.preventDefault();
    const layout = getLayout();
    const point = clientToCanvas(event, canvas, layout.width, layout.height);

    if (handlers.plotActive() && hitTest(layout.plot, point.x, point.y)) {
      handlers.onPlot();
      return;
    }
    if (hitTest(layout.tree, point.x, point.y)) {
      handlers.onTree();
      return;
    }
    for (const rock of layout.rocks) {
      if (hitTest(rock, point.x, point.y)) {
        handlers.onRock();
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
