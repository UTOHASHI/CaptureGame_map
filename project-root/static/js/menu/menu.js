// /static/js/menu/menu.js
import { getState, getDex } from '/static/js/utils/api.js';

const MON_MASTER_URL = '/static/data/monsters.json';

// レアリティ → ☆表示
function stars(rarity) {
  switch (rarity) {
    case 'epic': return '⭐⭐⭐';
    case 'rare': return '⭐⭐';
    default:     return '⭐';
  }
}

// ------------ 在庫描画 ------------
function renderInventory(inv) {
  const el = document.getElementById('inventory-panel');
  if (!el) return;

  el.innerHTML = `
    <ul class="inventory-list">
      <li>普通の縄: ${inv.rope_basic}</li>
      <li>銀の縄: ${inv.rope_silver}</li>
      <li>金の縄: ${inv.rope_gold}</li>
    </ul>
  `;
}

// ------------ 図鑑（データ保持用） ------------
let _master = [];  // monsters.json
let _dex = [];     // /api/dex 集約結果
let _filter = 'all'; // 'all' | 'common' | 'rare' | 'epic'

// rarity のフィルタ一致判定
function matchFilter(rarity, filter) {
  if (filter === 'all') return true;
  return rarity === filter;
}

// 図鑑の描画だけ（fetch 済みの _master と _dex を使う）
function renderPokedex() {
  const list = document.getElementById('dex-list');
  if (!list) return;

  // name 突合（master に定義がないと表示しにくいので master を基準に）
  const dexByName = Object.fromEntries(_dex.map(d => [d.name, d]));

  list.innerHTML = '';
  _master.forEach(m => {
    if (!matchFilter(m.rarity, _filter)) return;

    const entry = dexByName[m.name];
    const seen = !!entry && (entry.seen ?? 0) > 0;
    const displayName = seen ? m.name : '？？？';
    const bestLv = entry?.best_lv ?? 0;
    const caughtNum = entry?.caught ?? 0;
    const seenNum = entry?.seen ?? 0;

    const row = document.createElement('div');
    row.className = 'dex-row';
    row.innerHTML = `
      <img class="dex-icon ${seen ? '' : 'dex-unknown'}" src="${m.img}" alt="${m.name}">
      <div class="dex-meta">
        <div class="dex-name">
          ${displayName}
          <span class="dex-stars" title="${m.rarity}">${stars(m.rarity)}</span>
        </div>
        <div class="dex-sub">
          捕獲 <strong>${caughtNum}</strong> / 発見 ${seenNum}
          ・ 最高Lv <strong>${bestLv}</strong>
        </div>
      </div>
    `;
    list.appendChild(row);
  });

  console.log('[menu.js] renderPokedex done with filter =', _filter);
}

// 図鑑の取得＋描画（フル）
async function loadPokedex() {
  const list = document.getElementById('dex-list');
  if (list) list.innerHTML = '読み込み中…';
  console.log('[menu.js] loadPokedex start');

  try {
    const ts = Date.now(); // キャッシュバスター
    const [master, dex, state] = await Promise.all([
      fetch(`${MON_MASTER_URL}?t=${ts}`, { cache: 'no-store' }).then(r => r.json()),
      getDex(),     // サーバ側で名前集約済み推奨
      getState(),   // 在庫も一緒に更新
    ]);

    _master = master || [];
    _dex = dex || [];
    renderPokedex();            // フィルタに従って描画
    if (state?.inventory) {
      renderInventory(state.inventory);
    }
    console.log('[menu.js] loadPokedex fetched', { masterLen: _master.length, dexLen: _dex.length });

  } catch (e) {
    console.error('pokedex render failed', e);
    if (list) list.innerHTML = '<div class="dex-error">図鑑の取得に失敗しました。</div>';
  }
}

// ------------ イベント ------------
document.addEventListener('DOMContentLoaded', () => {
  // 初期ロード
  loadPokedex();

  // フィルタ変更イベント
  const sel = document.getElementById('dex-filter');
  if (sel) {
    sel.addEventListener('change', () => {
      _filter = sel.value;   // 'all' | 'common' | 'rare' | 'epic'
      console.log('[menu.js] filter changed =>', _filter);
      renderPokedex();       // データ再取得はせず、描画のみやり直す
    });
  }
});

// 捕獲や宝箱開封で在庫や図鑑が変わったら更新
try {
  if (window.BroadcastChannel) {
    const ch = new BroadcastChannel('game-events');
    ch.addEventListener('message', ev => {
      console.log('[menu.js] BroadcastChannel 受信:', ev.data);
      if (ev?.data?.type === 'state-changed') {
        // DB反映の短いレースを避けるため少し遅延して再取得
        setTimeout(loadPokedex, 50);
      }
    });
  } else {
    window.addEventListener('message', ev => {
      console.log('[menu.js] postMessage 受信:', ev.data);
      if (ev?.data?.type === 'state-changed') {
        setTimeout(loadPokedex, 50);
      }
    });
  }
} catch (e) {
  console.warn('event listener setup failed', e);
}
