# game/routes/capture.py
from flask import Blueprint, request, jsonify
from ..models import Inventory, DexEntry, Stats
from .. import db
from ..utils import capture_chance, apply_xp, level_threshold
from ..services.user_session import get_or_create_user as get_user
from datetime import datetime
import random

bp = Blueprint("capture", __name__)

XP_CAPTURE_SUCCESS   = 20
XP_NEW_SPECIES_BONUS = 30  # そのユーザー初捕獲ボーナス

@bp.route("/capture", methods=["POST"])
def api_capture():
    u = get_user()
    payload = request.json or {}
    mon = payload.get("monster", {})  # {id,name,level,rarity}
    rope_ui = payload.get("rope")     # 'basic' | 'silver' | 'gold' | None

    # ロープキーへ正規化
    rope_map = {"basic": "rope_basic", "silver": "rope_silver", "gold": "rope_gold"}
    rope_key = rope_map.get(rope_ui or "", None)

    inv = Inventory.query.get(u.id)
    # 自動選択（指定が無ければ金→銀→普通の順で使用）
    if not rope_key:
        rope_key = "rope_gold" if inv.rope_gold > 0 else ("rope_silver" if inv.rope_silver > 0 else "rope_basic")

    if getattr(inv, rope_key) <= 0:
        return jsonify({"ok": False, "error": "no_rope"}), 400

    # 確率計算
    lvl = int(mon.get("level", 1) or 1)
    rar = mon.get("rarity", "common")
    p   = capture_chance(lvl, rar, rope_key)

    ok = random.random() < p
    # ロープ消費
    setattr(inv, rope_key, getattr(inv, rope_key) - 1)

    # 図鑑更新
    mon_id = mon.get("id")
    if not mon_id:
        return jsonify({"ok": False, "error": "bad_mon_id"}), 400

    d = DexEntry.query.filter_by(user_id=u.id, mon_id=mon_id).first()
    if not d:
        d = DexEntry(user_id=u.id, mon_id=mon_id, name=mon.get("name", "?"))
        db.session.add(d)

    d.seen    = (d.seen or 0) + 1
    d.name    = mon.get("name", d.name)
    d.best_lv = max(d.best_lv or 0, lvl)

    st = Stats.query.get(u.id)
    leveled = False
    if ok:
        was_caught = d.caught or 0
        d.caught   = was_caught + 1
        st.total_caught += 1
        st.last_played   = datetime.utcnow()

        gain = XP_CAPTURE_SUCCESS
        if was_caught == 0:  # 初捕獲ボーナス
            gain += XP_NEW_SPECIES_BONUS
        leveled = apply_xp(st, gain)

    db.session.commit()

    return jsonify({
        "ok": ok,
        "chance": p,
        "rope_used": rope_key,
        "leveled": leveled,
        "stats": {
            "level":   st.level,
            "xp":      st.xp,
            "next_xp": level_threshold(st.level)
        },
        "inventory": {
            "rope_basic":  inv.rope_basic,
            "rope_silver": inv.rope_silver,
            "rope_gold":   inv.rope_gold
        }
    })
