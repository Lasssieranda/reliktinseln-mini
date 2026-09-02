import './style.css';
import { canBuildHut, tapRock, tapTree, buildHut } from './game/economy';
import {
  FLASH_MS,
  FLOAT_MS,
  HUT_IN_MS,
  SETTLE_MS,
  SQUASH_MS,
  type FloatText,
  type SquashFx,
  type TimedFx,
} from './game/fx';
import { applyGoals } from './game/goals';
import { bindInput } from './game/input';
import { computeLayout, type Layout } from './game/layers';
import { startLoop } from './game/loop';
import {
  attachViewportListeners,
  drawScene,
  resizeCanvas,
  type TapFlash,
} from './game/render';
import {
  clearSave,
  loadFromStorage,
  startSaveScheduler,
} from './game/save';
import { createInitialState, type GameState } from './game/state';
import { computeStageView, type StageView } from './game/view';
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
let layout: Layout = computeLayout();
let stageView: StageView = computeStageView(1, 1);
let plotPulse = 0;
let hintUntil = 0;
let flash: TapFlash | null = null;
let squash: SquashFx | null = null;
let floats: FloatText[] = [];
let hutBuild: TimedFx | null = null;
let islandSettle: TimedFx | null = null;

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
  stageView = computeStageView(view.width, view.height);
  layout = computeLayout();
  drawScene(gameCtx, layout, stageView, state, view.dpr, {
    plotPulse,
    flash,
    squash,
    floats,
    hutBuild,
    islandSettle,
  });
}

function resetFx(): void {
  plotPulse = 0;
  flash = null;
  squash = null;
  floats = [];
  hutBuild = null;
  islandSettle = null;
}

function resetSave(): void {
  clearSave(localStorage);
  state = createInitialState();
  resetFx();
  hud.setHint(null);
  saver.flush();
  hud.render(state);
  paint();
}

bindVersionHold(hud.versionEl, () => {
  openQaMenu({ onReset: resetSave });
});

bindInput(gameCanvas, () => ({ layout, view: stageView }), {
  plotActive: () => canBuildHut(state),
  onTree: () => {
    tapTree(state);
    squash = { kind: 'tree', elapsed: 0 };
    flash = { kind: 'tree', remaining: FLASH_MS };
    floats.push({
      text: '+1 Holz',
      x: layout.tree.x + layout.tree.w / 2,
      y: layout.tree.y + layout.tree.h * 0.22,
      elapsed: 0,
    });
    saver.flush();
    hud.render(state);
  },
  onRock: (index) => {
    tapRock(state);
    squash = { kind: 'rock', elapsed: 0, rockIndex: index };
    flash = { kind: 'rock', remaining: FLASH_MS };
    const rock = layout.rocks[index] ?? layout.rocks[0];
    floats.push({
      text: '+1 Stein',
      x: rock.x + rock.w / 2,
      y: rock.y,
      elapsed: 0,
    });
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
    hutBuild = { elapsed: 0 };
    islandSettle = { elapsed: 0 };
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
    if (squash) {
      squash.elapsed += dt;
      if (squash.elapsed >= SQUASH_MS) {
        squash = null;
      }
    }
    for (const item of floats) {
      item.elapsed += dt;
    }
    floats = floats.filter((item) => item.elapsed < FLOAT_MS);
    if (hutBuild) {
      hutBuild.elapsed += dt;
      if (hutBuild.elapsed >= HUT_IN_MS) {
        hutBuild = null;
      }
    }
    if (islandSettle) {
      islandSettle.elapsed += dt;
      if (islandSettle.elapsed >= SETTLE_MS) {
        islandSettle = null;
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
