import './style.css';
import {
  buildHut,
  buildQuarry,
  buildShrine,
  canBuildHut,
  canBuildQuarry,
  canBuildShrine,
  canFeedShrine,
  canUpgradeHut,
  createProductionAcc,
  feedShrine,
  tapGain,
  tapRock,
  tapTree,
  tickProduction,
  upgradeHut,
} from './game/economy';
import {
  FLASH_MS,
  FLOAT_MS,
  HUT_IN_MS,
  HUT_PULSE_MS,
  QUARRY_IN_MS,
  RELIC_BEAT_MS,
  SETTLE_MS,
  SHRINE_IN_MS,
  SQUASH_MS,
  type FloatText,
  type SquashFx,
  type TimedFx,
} from './game/fx';
import { bindInput } from './game/input';
import { computeLayout, type Layout } from './game/layers';
import { startLoop } from './game/loop';
import { skipRelic1 } from './game/qa';
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
let prodAcc = createProductionAcc();
let layout: Layout = computeLayout(state);
let stageView: StageView = computeStageView(1, 1);
let plotPulse = 0;
let hintUntil = 0;
let flash: TapFlash | null = null;
let squash: SquashFx | null = null;
let floats: FloatText[] = [];
let hutBuild: TimedFx | null = null;
let quarryBuild: TimedFx | null = null;
let hutPulse: TimedFx | null = null;
let islandSettle: TimedFx | null = null;
let shrineBuild: TimedFx | null = null;
let relicBeat: TimedFx | null = null;

const saver = startSaveScheduler({
  getState: () => state,
  storage: localStorage,
});

function hasActivePlot(): boolean {
  return (
    canBuildHut(state) ||
    canBuildQuarry(state) ||
    canUpgradeHut(state) ||
    canBuildShrine(state) ||
    canFeedShrine(state)
  );
}

const hud = createHud(hudRoot, {
  onBuildAction: () => {
    if (!hasActivePlot()) {
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
  layout = computeLayout(state);
  drawScene(gameCtx, layout, stageView, state, view.dpr, {
    plotPulse,
    flash,
    squash,
    floats,
    hutBuild,
    quarryBuild,
    hutPulse,
    islandSettle,
    shrineBuild,
    relicBeat,
    timeMs: performance.now(),
  });
}

function resetFx(): void {
  plotPulse = 0;
  flash = null;
  squash = null;
  floats = [];
  hutBuild = null;
  quarryBuild = null;
  hutPulse = null;
  islandSettle = null;
  shrineBuild = null;
  relicBeat = null;
}

function resetSave(): void {
  clearSave(localStorage);
  state = createInitialState();
  prodAcc = createProductionAcc();
  resetFx();
  hud.setHint(null);
  saver.flush();
  hud.render(state);
  paint();
}

function applySkipRelic1(): void {
  skipRelic1(state);
  prodAcc = createProductionAcc();
  resetFx();
  hud.setHint(null);
  saver.flush();
  hud.render(state);
  paint();
}

bindVersionHold(hud.versionEl, () => {
  openQaMenu({ onReset: resetSave, onSkipRelic1: applySkipRelic1 });
});

bindInput(gameCanvas, () => ({ layout, view: stageView }), {
  plotActive: () => hasActivePlot(),
  onTree: () => {
    const gain = tapGain(state);
    tapTree(state);
    squash = { kind: 'tree', elapsed: 0 };
    flash = { kind: 'tree', remaining: FLASH_MS };
    floats.push({
      text: `+${gain} Holz`,
      x: layout.tree.x + layout.tree.w / 2,
      y: layout.tree.y + layout.tree.h * 0.22,
      elapsed: 0,
    });
    saver.flush();
    hud.render(state);
  },
  onRock: (index) => {
    const gain = tapGain(state);
    tapRock(state);
    squash = { kind: 'rock', elapsed: 0, rockIndex: index };
    flash = { kind: 'rock', remaining: FLASH_MS };
    const rock = layout.rocks[index] ?? layout.rocks[0];
    floats.push({
      text: `+${gain} Stein`,
      x: rock.x + rock.w / 2,
      y: rock.y,
      elapsed: 0,
    });
    saver.flush();
    hud.render(state);
  },
  onPlot: () => {
    if (canBuildHut(state) && buildHut(state)) {
      flash = { kind: 'plot', remaining: FLASH_MS };
      plotPulse = 0;
      hutBuild = { elapsed: 0 };
      islandSettle = { elapsed: 0 };
      hud.setHint(null);
      saver.flush();
      hud.render(state);
      return;
    }
    if (canBuildQuarry(state) && buildQuarry(state)) {
      flash = { kind: 'plot', remaining: FLASH_MS };
      plotPulse = 0;
      quarryBuild = { elapsed: 0 };
      islandSettle = { elapsed: 0 };
      hud.setHint(null);
      saver.flush();
      hud.render(state);
      return;
    }
    if (canUpgradeHut(state) && upgradeHut(state)) {
      flash = { kind: 'plot', remaining: FLASH_MS };
      plotPulse = 0;
      hutPulse = { elapsed: 0 };
      prodAcc.hutMs = 0;
      hud.setHint(null);
      saver.flush();
      hud.render(state);
      return;
    }
    if (canBuildShrine(state) && buildShrine(state)) {
      flash = { kind: 'plot', remaining: FLASH_MS };
      plotPulse = 0;
      shrineBuild = { elapsed: 0 };
      islandSettle = { elapsed: 0 };
      hud.setHint(null);
      saver.flush();
      hud.render(state);
      return;
    }
    if (canFeedShrine(state) && feedShrine(state)) {
      flash = { kind: 'plot', remaining: FLASH_MS };
      plotPulse = 0;
      hud.setHint(null);
      if (state.relic1) {
        relicBeat = { elapsed: 0 };
      }
      saver.flush();
      hud.render(state);
    }
  },
});

startLoop({
  isPaused: () => document.hidden,
  update(dt) {
    const gained = tickProduction(state, prodAcc, dt);
    if (gained.wood > 0) {
      floats.push({
        text: '+1 Holz',
        x: layout.hut.x + layout.hut.w / 2,
        y: layout.hut.y + 8,
        elapsed: 0,
      });
      hud.render(state);
    }
    if (gained.stone > 0) {
      floats.push({
        text: '+1 Stein',
        x: layout.quarry.x + layout.quarry.w / 2,
        y: layout.quarry.y + 6,
        elapsed: 0,
      });
      hud.render(state);
    }
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
    if (quarryBuild) {
      quarryBuild.elapsed += dt;
      if (quarryBuild.elapsed >= QUARRY_IN_MS) {
        quarryBuild = null;
      }
    }
    if (hutPulse) {
      hutPulse.elapsed += dt;
      if (hutPulse.elapsed >= HUT_PULSE_MS) {
        hutPulse = null;
      }
    }
    if (islandSettle) {
      islandSettle.elapsed += dt;
      if (islandSettle.elapsed >= SETTLE_MS) {
        islandSettle = null;
      }
    }
    if (shrineBuild) {
      shrineBuild.elapsed += dt;
      if (shrineBuild.elapsed >= SHRINE_IN_MS) {
        shrineBuild = null;
      }
    }
    if (relicBeat) {
      relicBeat.elapsed += dt;
      if (relicBeat.elapsed >= RELIC_BEAT_MS) {
        relicBeat = null;
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
