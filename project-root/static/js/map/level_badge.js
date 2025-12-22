// /static/js/map/level_badge.js
import { getState } from '/static/js/utils/api.js';

const BADGE_ID = 'map-level-badge';

function renderLevel(stats) {
  const el = document.getElementById(BADGE_ID);
  if (!el) return;

  const level = stats?.level ?? 1;
  const xp    = stats?.xp ?? 0;
  const next  = stats?.next_xp ?? 100;

  el.textContent = `Lv ${level}  ·  ${xp}/${next}`;
}

async function refresh() {
  try {
    const state = await getState();
    renderLevel(state?.stats);
  } catch (e) {
    console.warn('[level_badge] getState failed', e);
  }
}

function setupChannel() {
  try {
    if (!window.BroadcastChannel) return;
    const ch = (window._gameChannel || (window._gameChannel = new BroadcastChannel('game-events')));
    ch.addEventListener('message', (e) => {
      if (e?.data?.type === 'state-changed') {
        refresh();
      }
    });
  } catch (e) {
    console.warn('[level_badge] BroadcastChannel failed', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  refresh();       // 初回表示
  setupChannel();  // 変化を購読
});
