// /static/js/map/spawn.js
(function () {
  // ---------------- 二重生成ガード ----------------
  let __spawnedOnce = false;

  // ---------------- 宝箱アイコン ----------------
  const CHEST_ICONS = {
    red: L.icon({
      iconUrl: '/static/data/treasureBox/treasureBoxRed.png',
      iconRetinaUrl: '/static/data/treasureBox/treasureBoxRed.png',
      iconSize: [90, 60],
      iconAnchor: [45, 60],
      popupAnchor: [0, -60],
    }),
    blue: L.icon({
      iconUrl: '/static/data/treasureBox/treasureBoxBlue.png',
      iconRetinaUrl: '/static/data/treasureBox/treasureBoxBlue.png',
      iconSize: [90, 60],
      iconAnchor: [45, 60],
      popupAnchor: [0, -60],
    }),
    gold: L.icon({
      iconUrl: '/static/data/treasureBox/treasureBoxGold.png',
      iconRetinaUrl: '/static/data/treasureBox/treasureBoxGold.png',
      iconSize: [90, 60],
      iconAnchor: [45, 60],
      popupAnchor: [0, -60],
    }),
  };

  // ---------------- モンスター定義 ----------------
  const MON_IMAGES = [
    '/static/data/monster/monster_1.png',
    '/static/data/monster/monster_2.png',
    '/static/data/monster/monster_3.png',
    '/static/data/monster/monster_4.png',
    '/static/data/monster/monster_5.png',
    '/static/data/monster/monster_6.png',
    '/static/data/monster/monster_7.png',
    '/static/data/monster/monster_8.png',
    '/static/data/monster/monster_9.png',
    '/static/data/monster/monster_10.png',
    '/static/data/monster/monster_11.png',
    '/static/data/monster/monster_12.png',
  ];

  const MON_SPECS = [
    { name: 'ミドリワンメ', rarity: 'common' },
    { name: 'サンシャイン', rarity: 'common' },
    { name: 'カクサボテン', rarity: 'rare' },
    { name: 'ピンクスネーク', rarity: 'common' },
    { name: 'タマゴッチ', rarity: 'rare' },
    { name: 'スライムゼリー', rarity: 'common' },
    { name: 'キューブラー', rarity: 'epic' },
    { name: 'シャドーミスト', rarity: 'epic' },
    { name: 'アカオニン', rarity: 'rare' },
    { name: 'アオウニン', rarity: 'rare' },
    { name: 'マルメ', rarity: 'common' },
    { name: 'ゴンザイ', rarity: 'epic' },
  ];

  // 画像読み込みキャッシュ
  const MON_ICONS = MON_IMAGES.map((url) => {
    const img = new Image();
    img.onerror = () => console.warn('[spawn] monster icon not found:', url);
    img.src = url;

    return L.icon({
      iconUrl: url,
      iconRetinaUrl: url,
      iconSize: [48, 48],
      iconAnchor: [24, 44],
      popupAnchor: [0, -40],
    });
  });

  // ---------------- ユーティリティ ----------------
  function randomPointAround(lat, lng, maxMeters = 1000) {
    const r = Math.random() * maxMeters;
    const t = Math.random() * Math.PI * 2;
    const dLat = (r * Math.cos(t)) / 111320;
    const dLng = (r * Math.sin(t)) / (111320 * Math.cos(lat * Math.PI / 180));
    return [lat + dLat, lng + dLng];
  }

  function randomTier() {
    const x = Math.random();
    if (x < 0.15) return 'gold';
    if (x < 0.55) return 'blue';
    return 'red';
  }

  function randomMonsterSpec() {
    const i = Math.floor(Math.random() * MON_ICONS.length);
    const spec = MON_SPECS[i];
    const level = 1 + Math.floor(Math.random() * 10); // Lv.1〜10
    const imgUrl = MON_IMAGES[i];
    return {
      icon: MON_ICONS[i],
      name: spec.name,
      level,
      img: imgUrl,
      rarity: spec.rarity,
    };
  }

  function rarityStars(rarity) {
    switch (rarity) {
      case 'epic': return '⭐⭐⭐';
      case 'rare': return '⭐⭐';
      default:     return '⭐';
    }
  }

  // ---------------- スポーン処理 ----------------
  function spawnChestsAt(map, baseLat, baseLng, count = 12, spread = 2000) {
    if (!window.__chestLayer) window.__chestLayer = L.layerGroup().addTo(map);
    const markers = [];
    for (let i = 0; i < count; i++) {
      const [lat, lng] = randomPointAround(baseLat, baseLng, spread);
      const tier = randomTier();

      const m = L.marker([lat, lng], {
        title: `宝箱(${tier})`,
        icon: CHEST_ICONS[tier],
        zIndexOffset: 1000,
      }).addTo(window.__chestLayer);

      const id = m._leaflet_id;
      const html =
        `<button class="btn-open-chest chest-btn-${tier}"
                 data-tier="${tier}"
                 data-lat="${lat}"
                 data-lng="${lng}"
                 data-marker-id="${id}">開ける</button>`;
      m.bindPopup(html);

      markers.push(m);
    }
    console.log(`[spawn] chests: ${markers.length}`);
    return markers;
  }

  function spawnMonstersAt(map, baseLat, baseLng, count = 12, spread = 2000) {
    if (!window.__monsterLayer) window.__monsterLayer = L.layerGroup().addTo(map);
    const markers = [];
    for (let i = 0; i < count; i++) {
      const [lat, lng] = randomPointAround(baseLat, baseLng, spread);
      const spec = randomMonsterSpec();

      const m = L.marker([lat, lng], {
        title: `モンスター: ${spec.name}`,
        icon: spec.icon,
        zIndexOffset: 500,
      }).addTo(window.__monsterLayer);

      m.bindPopup(
        `<div class="monster-popup" style="text-align:center;">
           <strong>${spec.name} Lv.${spec.level}</strong> ${rarityStars(spec.rarity)}<br>
           <button class="btn btn-sm btn-success btn-capture"
                   data-id="MON-${m._leaflet_id}"
                   data-name="${spec.name}"
                   data-level="${spec.level}"
                   data-rarity="${spec.rarity}"
                   data-img="${spec.img}"
                   data-lat="${lat}"
                   data-lng="${lng}">
             捕獲
           </button>
         </div>`
      );

      markers.push(m);
    }
    console.log(`[spawn] monsters: ${markers.length}`);
    return markers;
  }

  function spawnAllAt(map, baseLat, baseLng) {
    if (__spawnedOnce) {
      console.log('[spawn] 既にスポーン済みなので新規生成しません');
      return { chests: [], monsters: [] };
    }
    __spawnedOnce = true;

    if (!window.__chestLayer)   window.__chestLayer   = L.layerGroup().addTo(map);
    if (!window.__monsterLayer) window.__monsterLayer = L.layerGroup().addTo(map);

    window.__chestLayer.clearLayers();
    window.__monsterLayer.clearLayers();

    const ch = spawnChestsAt(map, baseLat, baseLng);
    const mn = spawnMonstersAt(map, baseLat, baseLng);
    return { chests: ch, monsters: mn };
    
  }



  // === 既存の末尾近くにある spawnAllAt の後へ追加 =========================

// ガードを無視して、今の位置で完全リスポーン（レイヤークリア→再生成）
function respawnAllAt(map, baseLat, baseLng) {
  if (!window.__chestLayer)   window.__chestLayer   = L.layerGroup().addTo(map);
  if (!window.__monsterLayer) window.__monsterLayer = L.layerGroup().addTo(map);

  window.__chestLayer.clearLayers();
  window.__monsterLayer.clearLayers();

  const ch = spawnChestsAt(map, baseLat, baseLng);
  const mn = spawnMonstersAt(map, baseLat, baseLng);
  console.log(`[spawn] respawned: chests=${ch.length}, monsters=${mn.length}`);
  return { chests: ch, monsters: mn };
}

// 10分おきリスポーン用のインターバルID（重複開始防止）
let __respawnTimer = null;

// 初回スポーン完了後にタイマー開始
function startRespawnTimer(map) {
  if (__respawnTimer) return; // 既に開始済み
  __respawnTimer = setInterval(() => {
    const base = window.currentLocation || (map ? map.getCenter() : null);
    if (!base) return;
    const lat = base.lat ?? base[0];
    const lng = base.lng ?? base[1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    respawnAllAt(map, lat, lng);
  }, 600_000); // 600,000ms = 10分
  console.log('[spawn] respawn timer started (every 10 min)');
}



// === 既存の location-ready リスナー内（spawnAllAt 呼び出し直後）に追記 ===
document.addEventListener('location-ready', (e) => {
  const { lat, lng } = e.detail || {};
  if (!window.map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  // 初回だけ通常スポーン（__spawnedOnce で二重抑制）
  spawnAllAt(window.map, lat, lng);
  // ★ 初回スポーン完了後に10分おきのリスポーン開始
  startRespawnTimer(window.map);
});


  // ---------------- 外部API ----------------
  window.Spawn = Object.assign({}, window.Spawn, {
    spawnChestsNearCurrentLocation: async (map) => {
      if (__spawnedOnce) return [];
      const base = window.currentLocation || (map ? map.getCenter() : null);
      if (!base) return [];
      return spawnChestsAt(map || window.map, base.lat, base.lng);
    },
    spawnMonstersNearCurrentLocation: async (map) => {
      if (__spawnedOnce) return [];
      const base = window.currentLocation || (map ? map.getCenter() : null);
      if (!base) return [];
      return spawnMonstersAt(map || window.map, base.lat, base.lng);
    },
  });
})();
