// /static/js/ui/capture_modal.js
// 親ページ（index.html）で読み込む ES Module
import { getState, captureMonster } from '/static/js/utils/api.js';

let modalInst = null;
let modalEl = null;
let currentMon = null;

// ---------- ユーティリティ ----------
function ensureModal() {
  if (!modalEl) modalEl = document.getElementById('captureModal');
  if (!modalInst) modalInst = new bootstrap.Modal(modalEl, { backdrop: 'static' });
  return modalInst;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setMonsterImage(src) {
  const imgEl = document.getElementById('cap-mon-image');
  if (imgEl) {
    imgEl.src = src;
    imgEl.alt = 'monster';
  }
}

function resetResult() {
  const res = document.getElementById('cap-result');
  if (res) {
    res.classList.add('d-none');
    res.classList.remove('alert-success', 'alert-danger', 'alert');
    res.textContent = '';
  }
  const hint = document.getElementById('cap-hint');
  if (hint) hint.classList.remove('d-none');
}

function setInventory(invRaw) {
  const inv = {
    rope_basic:  invRaw?.rope_basic  ?? 0,
    rope_silver: invRaw?.rope_silver ?? 0,
    rope_gold:   invRaw?.rope_gold   ?? 0,
  };

  // 親ページ（任意表示）
  setText('inv-basic',  inv.rope_basic);
  setText('inv-silver', inv.rope_silver);
  setText('inv-gold',   inv.rope_gold);

  // モーダル内バッジ
  const bBasic  = document.getElementById('cap-stock-basic');
  const bSilver = document.getElementById('cap-stock-silver');
  const bGold   = document.getElementById('cap-stock-gold');
  if (bBasic)  bBasic.textContent  = inv.rope_basic;
  if (bSilver) bSilver.textContent = inv.rope_silver;
  if (bGold)   bGold.textContent   = inv.rope_gold;

  // 縄ボタン活性/非活性
  const btnBasic  = document.getElementById('cap-use-basic');
  const btnSilver = document.getElementById('cap-use-silver');
  const btnGold   = document.getElementById('cap-use-gold');
  if (btnBasic)  btnBasic.disabled  = inv.rope_basic  <= 0;
  if (btnSilver) btnSilver.disabled = inv.rope_silver <= 0;
  if (btnGold)   btnGold.disabled   = inv.rope_gold   <= 0;
}

function enableAllActionButtons() {
  if (!modalEl) return;
  modalEl.querySelectorAll('button').forEach((b) => {
    // ×（btn-close）以外も一旦有効に戻す
    if (!b.classList.contains('btn-close')) b.disabled = false;
  });
}

function disableAllExceptClose() {
  if (!modalEl) return;
  modalEl.querySelectorAll('button').forEach((b) => {
    if (!b.classList.contains('btn-close')) b.disabled = true;
  });
}

// map iframe へメッセージ送信（対象モンスター削除/ポップアップ閉じ）
function postToMap(msg) {
  const mapFrame = document.querySelector('iframe.map-frame');
  if (mapFrame && mapFrame.contentWindow) {
    mapFrame.contentWindow.postMessage(msg, '*');
  }
}

// ---------- モーダルを開く ----------
async function openModalFor(mon) {
  // レベル安全化
  const parsed = parseInt(mon?.level, 10);
  const safeLevel = Number.isFinite(parsed) ? parsed : 1;

  currentMon = {
    id:     mon?.id     ?? 'MON-unknown',   // 例: "MON-123"
    name:   mon?.name   ?? '？？？',
    level:  safeLevel,
    rarity: mon?.rarity ?? 'common',
    img:    mon?.img    ?? '/static/data/monster/monster_1.png',
  };

  setText('cap-mon-name',  currentMon.name);
  setText('cap-mon-level', String(currentMon.level));
  setMonsterImage(currentMon.img);
  resetResult();
  enableAllActionButtons();

  // 在庫同期
  try {
    const state = await getState();
    setInventory(state?.inventory);
  } catch (e) {
    console.warn('getState failed in openModalFor', e);
  }

  ensureModal().show();
}

// ---------- 捕獲実行 ----------
async function doCapture(ropeUi) {
  if (!currentMon) return;

  const resBox = document.getElementById('cap-result');
  const hint   = document.getElementById('cap-hint');
  if (hint) hint.classList.add('d-none');

  try {
    const res = await captureMonster(currentMon, ropeUi); // {ok, chance, rope_used, inventory}
    if (res?.inventory) setInventory(res.inventory);

    if (resBox) {
      resBox.classList.add('alert');
      if (res.ok) {
        const p = (res.chance * 100).toFixed(1);
        resBox.classList.remove('d-none', 'alert-danger');
        resBox.classList.add('alert-success');
        resBox.innerHTML = `✅ 捕獲成功！<br>成功率 ${p}%`;

        // 成功後は × 以外クリック不可
        disableAllExceptClose();


          // ★ 図鑑更新のために state-changed 通知を送る
        try {
          if (window.parent) {
            window.parent.postMessage({ type: 'state-changed', at: Date.now() }, '*');
            console.log("捕獲成功のメッセージを送りました。");
          }
          if (window.BroadcastChannel) {
            const ch = new BroadcastChannel('game-events');
            ch.postMessage({ type: 'state-changed', at: Date.now() });
          }
        } catch (e) {
          console.warn('notify dex update failed', e);
        }

        // ---- マップから該当モンスターを削除（iframeへ通知）----
        // currentMon.id は "MON-123" 形式を想定 → ID数値だけ抽出
        const markerId = (currentMon.id || '').startsWith('MON-')
          ? currentMon.id.slice(4)
          : currentMon.id;

        postToMap({ type: 'remove-monster', markerId });   // マーカー削除
        postToMap({ type: 'close-popup' });                // ついでにポップアップも閉じる（任意）
      } else {
        resBox.classList.remove('d-none', 'alert-success');
        resBox.classList.add('alert-danger');
        if (res.error === 'no_rope') {
          resBox.textContent = '縄が不足しています。宝箱を開けて入手しましょう。';
        } else {
          const ptext = res.chance != null ? `成功率 ${(res.chance*100).toFixed(1)}% / ` : '';
          resBox.textContent = `捕獲失敗… ${ptext}`;
        }
      }
    }
  } catch (e) {
    console.error(e);
    if (resBox) {
      resBox.classList.add('alert', 'alert-danger');
      resBox.classList.remove('d-none', 'alert-success');
      resBox.textContent = '通信エラーが発生しました。';
    }
  }
}

// ---------- map iframe → 親（postMessage） ----------
window.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'open-capture' && data.monster) {
    openModalFor(data.monster);
  }
});

// ---------- モーダル内の縄ボタン ----------
document.addEventListener('click', async (e) => {
  const id = e.target.id;
  if (id === 'cap-use-basic')  { e.preventDefault(); await doCapture('basic');  }
  if (id === 'cap-use-silver') { e.preventDefault(); await doCapture('silver'); }
  if (id === 'cap-use-gold')   { e.preventDefault(); await doCapture('gold');   }
});



