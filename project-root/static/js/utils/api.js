// /static/js/utils/api.js

// ユーザーの現在の状態を取得（在庫・統計など）
async function getState() {
  const res = await fetch("/api/state");
  if (!res.ok) throw new Error("API error: /api/state");
  return await res.json();
}

// 宝箱を開ける
async function openChest(tier) {
  const res = await fetch("/api/open_chest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier })
  });
  if (!res.ok) throw new Error("API error: /api/open_chest");
  return await res.json();
}

async function captureMonster(mon, ropeType) {
  const res = await fetch("/api/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      monster: {
        id: mon.id,
        name: mon.name,
        level: mon.level,
        rarity: mon.rarity
      },
      rope: ropeType
    })
  });
  if (!res.ok) throw new Error("API error: /api/capture");
  return await res.json();
}


async function getDex() {
  const res = await fetch("/api/dex");
  if (!res.ok) throw new Error("API error: /api/dex");
  return await res.json(); // [{name, seen, caught, best_lv}]
}


export { getState, openChest, captureMonster, getDex };

