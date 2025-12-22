# game/routes/state.py
from flask import Blueprint, jsonify
from ..models import Inventory, Stats, DexEntry
from .. import db
from ..utils import level_threshold
from ..services.user_session import get_or_create_user as get_user

bp = Blueprint("state", __name__)

# ---------------- 図鑑（同名集約して返す） ----------------
@bp.route("/dex", methods=["GET"])
def api_dex():
    u = get_user()
    rows = DexEntry.query.filter_by(user_id=u.id).all()

    agg = {}
    for d in rows:
        name = d.name or "？？？"
        a = agg.setdefault(name, {"name": name, "seen": 0, "caught": 0, "best_lv": 0})
        a["seen"]   += d.seen or 0
        a["caught"] += d.caught or 0
        if d.best_lv:
            a["best_lv"] = max(a["best_lv"], d.best_lv)

    return jsonify(sorted(agg.values(), key=lambda x: x["name"]))

# ---------------- プレイヤー状態 ----------------
@bp.route("/state", methods=["GET"])
def api_state():
    u = get_user()

    inv = Inventory.query.get(u.id)
    st  = Stats.query.get(u.id)

    # 念のための保険（欠けていたら作る）
    created = False
    if not inv:
        inv = Inventory(user_id=u.id)
        db.session.add(inv); created = True
    if not st:
        st = Stats(user_id=u.id, level=1, xp=0)
        db.session.add(st); created = True
    if created:
        db.session.commit()

    next_need = level_threshold(st.level or 1)
    return jsonify({
        "inventory": {
            "rope_basic":  inv.rope_basic,
            "rope_silver": inv.rope_silver,
            "rope_gold":   inv.rope_gold,
        },
        "stats": {
            "total_caught": st.total_caught,
            "total_opened": st.total_opened,
            "last_played":  st.last_played.isoformat() if st.last_played else None,
            "level":        st.level or 1,
            "xp":           st.xp or 0,
            "next_xp":      next_need,
        }
    })
