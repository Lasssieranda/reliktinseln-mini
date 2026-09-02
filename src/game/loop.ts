export const MAX_DT_MS = 50;

export type LoopHandlers = {
  update: (dtMs: number) => void;
  draw: () => void;
  isPaused: () => boolean;
};

export function startLoop(handlers: LoopHandlers): { stop: () => void } {
  let running = true;
  let rafId = 0;
  let last = performance.now();

  const frame = (now: number): void => {
    if (!running) {
      return;
    }
    rafId = requestAnimationFrame(frame);
    if (handlers.isPaused()) {
      last = now;
      return;
    }
    const dt = Math.min(MAX_DT_MS, Math.max(0, now - last));
    last = now;
    handlers.update(dt);
    handlers.draw();
  };

  rafId = requestAnimationFrame(frame);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
