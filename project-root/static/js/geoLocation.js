// /static/js/geoLocation.js
(function () {
  let locMarker = null;
  let locCircle = null;

  function centerToCurrentPosition(map) {
    if (!navigator.geolocation) {
      alert("このブラウザでは位置情報が使えません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const circle = 500;

        if (locMarker) map.removeLayer(locMarker);
        if (locCircle) map.removeLayer(locCircle);

        map.setView([lat, lng], Math.max(map.getZoom(), 16));
        locMarker = L.marker([lat, lng]).addTo(map);
        locCircle = L.circle([lat, lng], { radius: circle }).addTo(map);

        //グローバルに保存
        window.locMarker = locMarker;
        window.locCircle = locCircle;
        window.currentLocation = {lat, lng, radius:circle};


        console.log("現在地にマップを設置しました。現在周囲" + circle + "mにサークルを表示しています。");

         // ✅ 現在地取得完了を知らせるイベントを発火
        document.dispatchEvent(
          new CustomEvent("location-ready", {
            detail: { lat, lng, radius: circle }
          })
        );
      },
      (err) => {
        // 許可しなかった/失敗時も黙って落ちずに動作継続
        console.warn("Geolocation error:", err);
        // 必要ならここでトースト表示などに差し替え
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function whenMapReady(cb, tries = 100) {
    const m = window.map;
    if (m && m instanceof L.Map) {
      if (m._loaded) return cb(m);
      m.whenReady(() => cb(m));
      return;
    }
    if (tries <= 0) return;
    setTimeout(() => whenMapReady(cb, tries - 1), 100);
  }

  document.addEventListener("DOMContentLoaded", () => {
    // 1) ボタンのクリックで現在地へ
    const btn = document.getElementById("locate-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        if (!window.map) return;
        centerToCurrentPosition(window.map);
      });
    }

    // 2) ページロード時に一度だけ自動で現在地へ
    whenMapReady((map) => {
      centerToCurrentPosition(map);
    });
  });

  // 外部からも呼べるように公開
  window.GeoLocation = { centerToCurrentPosition };
})();
