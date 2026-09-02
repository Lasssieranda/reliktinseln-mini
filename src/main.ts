import './style.css';
import { canBuildHut, tapRock, tapTree, buildHut } from './game/economy';
import { applyGoals } from './game/goals';
import { bindInput } from './game/input';
import { computeLayout, type Layout } from './game/layers';
import { startLoop } from './game/loop';
import {
  attachViewportListeners,
  drawScene,
  FLASH_MS,
  resizeCanvas,
  type TapFlash,
} from './game/render';
import {
  clearSave,
  loadFromStorage,
  startSaveScheduler,
} from './game/save';
import { createInitialState, type GameState } from './game/state';
import { createHud } from './ui/hud';
import { bindVersionHold, openQaMenu } from './ui/menu';

function requireElement<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) {
    throw new Error(`Reliktinseln Mini: ${selector} missing`);
  }
  return el;
}

const gameCanvas = requireElement<HTMLCanvasElement>('#game');
const hudRoot = requireElement<HTMLElement>('#hud');
const maybeCtx = gameCanvas.getContext('2d');
if (!maybeCtx) {
  throw new Error('Reliktinseln Mini: 2D canvas unavailable');
}
const gameCtx: CanvasRenderingContext2D = maybeCtx;

let state: GameState = loadFromStorage(localStorage);
let layout: Layout = computeLayout(1, 1);
let plotPulse = 0;
let hintUntil = 0;
let flash: TapFlash | null = null;

const saver = startSaveScheduler({
  getState: () => state,
  storage: localStorage,
});

const hud = createHud(hudRoot, {
  onBuildAction: () => {
    if (!canBuildHut(state)) {
      return;
    }
    plotPulse = 1;
    hud.setHint('Tippe die markierte Stelle auf der Insel');
    hintUntil = performance.now() + 2200;
  },
});

function paint(): void {
  const view = resizeCanvas(gameCanvas);
  layout = computeLayout(view.width, view.height);
  drawScene(gameCtx, layout, state, view.dpr, plotPulse, flash);
}

function resetSave(): void {
  clearSave(localStorage);
  state = createInitialState();
  plotPulse = 0;
  flash = null;
  hud.setHint(null);
  saver.flush();
  hud.render(state);
  paint();
}

bindVersionHold(hud.versionEl, () => {
  openQaMenu({ onReset: resetSave });
});

bindInput(gameCanvas, () => layout, {
  plotActive: () => canBuildHut(state),
  onTree: () => {
    tapTree(state);
    flash = { kind: 'tree', remaining: FLASH_MS };
    saver.flush();
    hud.render(state);
  },
  onRock: () => {
    tapRock(state);
    flash = { kind: 'rock', remaining: FLASH_MS };
    saver.flush();
    hud.render(state);
  },
  onPlot: () => {
    if (!buildHut(state)) {
      return;
    }
    applyGoals(state);
    flash = { kind: 'plot', remaining: FLASH_MS };
    plotPulse = 0;
    hud.setHint(null);
    saver.flush();
    hud.render(state);
  },
});

startLoop({
  isPaused: () => document.hidden,
  update(dt) {
    if (plotPulse > 0) {
      plotPulse = Math.max(0, plotPulse - dt / 900);
    }
    if (flash) {
      flash.remaining -= dt;
      if (flash.remaining <= 0) {
        flash = null;
      }
    }
    if (hintUntil && performance.now() > hintUntil) {
      hintUntil = 0;
      hud.setHint(null);
    }
  },
  draw: paint,
});

attachViewportListeners(paint);
hud.render(state);
paint();
