import { SHRINE_FEEDS_NEEDED } from './economy';
import type { GameState } from './state';

/**
 * QA skip for Relikt 1.
 * Sets shrineBuilt, shrineFeeds=6, relic1.
 * Also ensures hutLevel>=2 and quarryLevel>=1 so the island is not empty.
 * Does not set relic2 and does not upgrade hut to L3 or quarry to L2.
 */
export function skipRelic1(state: GameState): void {
  if (state.hutLevel < 2) {
    state.hutLevel = 2;
  }
  if (state.quarryLevel < 1) {
    state.quarryLevel = 1;
  }
  state.shrineBuilt = true;
  state.shrineFeeds = SHRINE_FEEDS_NEEDED;
  state.relic1 = true;
}
