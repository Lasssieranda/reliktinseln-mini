import {
  canBuildHut,
  canBuildQuarry,
  canBuildShrine,
  canFeedShrine,
  canUpgradeHut,
  FEED_COST,
  HUT_COST,
  HUT_L2_COST,
  QUARRY_COST,
  SHRINE_COST,
  SHRINE_FEEDS_NEEDED,
} from '../game/economy';
import { currentMiniGoal } from '../game/goals';
import type { GameState } from '../game/state';
import { VERSION } from '../version';

export type HudApi = {
  render: (state: GameState) => void;
  versionEl: HTMLElement;
  setHint: (text: string | null) => void;
};

export function createHud(
  root: HTMLElement,
  options: {
    onBuildAction: () => void;
  },
): HudApi {
  root.replaceChildren();

  const chrome = document.createElement('div');
  chrome.className = 'hud-chrome';

  const resources = document.createElement('div');
  resources.className = 'hud-resources';

  const woodEl = document.createElement('div');
  woodEl.className = 'hud-res';
  woodEl.dataset.kind = 'wood';

  const stoneEl = document.createElement('div');
  stoneEl.className = 'hud-res';
  stoneEl.dataset.kind = 'stone';

  resources.append(woodEl, stoneEl);

  const goal = document.createElement('div');
  goal.className = 'hud-goal';

  const goalTitle = document.createElement('div');
  goalTitle.className = 'hud-goal-title';
  goalTitle.textContent = 'Mini-Ziel: Hütte';

  const goalCost = document.createElement('div');
  goalCost.className = 'hud-goal-cost';
  goalCost.textContent = `${HUT_COST.wood} Holz · ${HUT_COST.stone} Stein`;

  goal.append(goalTitle, goalCost);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'hud-action';
  action.textContent = 'Hütte bauen';
  action.addEventListener('click', () => {
    if (action.disabled) {
      return;
    }
    options.onBuildAction();
  });

  const hint = document.createElement('div');
  hint.className = 'hud-hint';
  hint.hidden = true;

  const versionEl = document.createElement('button');
  versionEl.type = 'button';
  versionEl.className = 'hud-version';
  versionEl.textContent = `v${VERSION}`;
  versionEl.setAttribute('aria-label', `Version ${VERSION}`);

  chrome.append(resources, goal, action, hint, versionEl);
  root.append(chrome);

  const setActionReady = (label: string, ready: boolean): void => {
    action.hidden = false;
    action.disabled = !ready;
    action.classList.remove('is-status');
    action.textContent = ready ? label : 'Noch nicht genug';
  };

  const render = (state: GameState): void => {
    woodEl.textContent = `Holz ${state.wood}`;
    stoneEl.textContent = `Stein ${state.stone}`;
    const phase = currentMiniGoal(state);
    if (phase === 'hut') {
      goal.classList.remove('is-done');
      goalTitle.textContent = 'Mini-Ziel: Hütte';
      goalCost.textContent = `${HUT_COST.wood} Holz · ${HUT_COST.stone} Stein`;
      setActionReady('Hütte bauen', canBuildHut(state));
    } else if (phase === 'quarry') {
      goal.classList.remove('is-done');
      goalTitle.textContent = 'Mini-Ziel: Steinbruch';
      goalCost.textContent = `${QUARRY_COST.wood} Holz · ${QUARRY_COST.stone} Stein`;
      setActionReady('Steinbruch bauen', canBuildQuarry(state));
    } else if (phase === 'hutL2') {
      goal.classList.remove('is-done');
      goalTitle.textContent = 'Mini-Ziel: Hütte Stufe 2';
      goalCost.textContent = `${HUT_L2_COST.wood} Holz · ${HUT_L2_COST.stone} Stein`;
      setActionReady('Hütte verbessern', canUpgradeHut(state));
    } else if (phase === 'shrine') {
      goal.classList.remove('is-done');
      goalTitle.textContent = 'Mini-Ziel: Schrein';
      goalCost.textContent = `${SHRINE_COST.wood} Holz · ${SHRINE_COST.stone} Stein`;
      setActionReady('Schrein bauen', canBuildShrine(state));
    } else if (phase === 'relic1') {
      goal.classList.remove('is-done');
      const nextGabe = Math.min(state.shrineFeeds + 1, SHRINE_FEEDS_NEEDED);
      goalTitle.textContent = 'Mini-Ziel: Relikt 1';
      goalCost.textContent = `${FEED_COST.wood} Holz · ${FEED_COST.stone} Stein · Gabe ${nextGabe}/${SHRINE_FEEDS_NEEDED}`;
      setActionReady('Schrein füttern', canFeedShrine(state));
    } else {
      goal.classList.add('is-done');
      goalTitle.textContent = 'Mini-Ziel: erledigt';
      goalCost.textContent = 'Waldsplitter';
      action.hidden = false;
      action.disabled = true;
      action.classList.add('is-status');
      action.textContent = 'Waldsplitter liegt auf der Insel.';
    }
  };

  return {
    render,
    versionEl,
    setHint(text) {
      if (!text) {
        hint.hidden = true;
        hint.textContent = '';
        return;
      }
      hint.hidden = false;
      hint.textContent = text;
    },
  };
}
