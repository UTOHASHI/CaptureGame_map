// /static/js/map/interactions.js
import { openChest, getState } from '/static/js/utils/api.js';
import { toast } from '/static/js/utils/toast.js';

// --- 共通 ---
function notifyStateChanged() {
  try {
    if (window.BroadcastChannel) {
      (window._gameChannel || (window._gameChannel = new BroadcastChannel('game-events')))
        .postMessage({ type: 'state-changed', at: Date.now() });
    } else {
      window.parent && window.parent.postMessage({ type: 'state-changed', at: Date.now() }, '*');
    }
  } catch (e) { console.warn('notifyStateChanged failed', e); }
}

async function waitMapReady() {
  await new Promise((resolve) => {
    const ready = () => window.map && window.map instanceof L.Map &&
      (window.map._loaded ? true : (window.map.whenReady(resolve), false));
    if (ready()) return resolve();
    const t = setInterval(() => { if (ready()) { clearInterval(t); resolve(); } }, 100);
  });
}

function tierLabel(tier) {
  switch (tier) {
    case 'gold': return { title: '🟨 金の宝箱', color: 'gold' };
    case 'blue': return { title: '🟦 青い宝箱', color: 'blue' };
    default:     return { title: '🟥 赤い宝箱', color: 'red' };
  }
}

function formatInventory(inv) {
  return `在庫: 普通${inv.rope_basic} / 銀${inv.rope_silver} / 金${inv.rope_gold}`;
}
function formatLoot(_tier, loot) {
  const parts = [];
  if(loot.rope_gold > 0) parts.push(`金の縄 × ${loot.rope_gold}`);
  if(loot.rope_silver > 0) parts.push(`銀の縄 × ${loot.rope_silver}`);
  if(loot.rope_basic > 0) parts.push(`普通の縄 × ${loot.rope_basic}`);
  return `獲得: ${parts.join(' / ') || 'なし'}`;
}

// --- クリック委譲 ---
document.addEventListener('click', async (e) => {
  // 宝箱を開ける
  const openBtn = e.target.closest('.btn-open-chest');
  if (openBtn) {
    e.preventDefault();
    const tier = openBtn.getAttribute('data-tier') || 'red';
    const lat  = parseFloat(openBtn.getAttribute('data-lat'));
    const lng  = parseFloat(openBtn.getAttribute('data-lng'));

    // 現在地サークル内のみ開封可
    if (window.locCircle && window.map && Number.isFinite(lat) && Number.isFinite(lng)) {
      const center = window.locCircle.getLatLng();
      const radius = window.locCircle.getRadius();
      const dist   = window.map.distance(center, [lat, lng]);
      if (dist > radius) {
        toast('範囲外です', 'この宝箱は現在地から遠すぎます。近づいてから開けてください。');
        return;
      }
    }

    try {
      const res  = await openChest(tier);
      const loot = res?.loot || { rope_basic:0, rope_silver:0, rope_gold:0 };
      const inv  = res?.inventory || { rope_basic:0, rope_silver:0, rope_gold:0 };

      const { title } = tierLabel(tier);
      const message = `${formatLoot(tier, loot)}\n${formatInventory(inv)}`;
      toast(title, message);

      // 開けた宝箱のマーカーを消す
      const markerId = openBtn.getAttribute('data-marker-id');
      if (markerId && window.map && window.map._layers[markerId]) {
        window.map.removeLayer(window.map._layers[markerId]);
      }

      window.map && window.map.closePopup();
      notifyStateChanged();
    } catch (err) {
      console.error(err);
      toast('宝箱エラー', '開封に失敗しました。通信状況をご確認ください。');
    }
    return;
  }

  // モンスター捕獲 → 親にモーダル表示を依頼
  const capBtn = e.target.closest('.btn-capture');
  if (capBtn) {
    e.preventDefault();
    const mon = {
      id:     capBtn.getAttribute('data-id')     || 'MON-unknown',
      name:   capBtn.getAttribute('data-name')   || '？？？',
      level:  Number(capBtn.getAttribute('data-level')  || 1),
      rarity: capBtn.getAttribute('data-rarity') || 'common',
      img:    capBtn.getAttribute('data-img')    || '/static/data/monster/monster_1.png'
    };

      // まずサークル内チェック
  if (window.locCircle && window.map) {
    const lat = parseFloat(capBtn.getAttribute('data-lat'));
    const lng = parseFloat(capBtn.getAttribute('data-lng'));
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const center = window.locCircle.getLatLng();
      const radius = window.locCircle.getRadius();
      const dist   = window.map.distance(center, [lat, lng]);
      if (dist > radius) {
        // トーストで通知（縄もAPIも呼ばない）
        toast('範囲外です', 'このモンスターは現在地から遠すぎます。近づいてから捕獲してください。');
        return;
      }
    }
  }

    try {
      window.parent && window.parent.postMessage({ type: 'open-capture', monster: mon }, '*');
    } catch (err) {
      console.warn('postMessage failed', err);
    }
    return;
  }
});

// --- 初期化（在庫同期だけ）
document.addEventListener('DOMContentLoaded', async () => {
  await waitMapReady();
  try { await getState(); } catch (e) { console.warn('getState failed (init)', e); }
});


// 親からの命令で、モンスターを消す/ポップアップを閉じる
window.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'remove-monster' && data.markerId != null) {
    const id = String(data.markerId);
    const marker = window.map?._layers?.[id];
    if (marker) {
      window.map.removeLayer(marker);
    }
  }

  if (data.type === 'close-popup' && window.map && window.map.closePopup) {
    window.map.closePopup();
  }
});
