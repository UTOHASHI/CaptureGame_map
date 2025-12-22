# game/routes/chest.py
from flask import Blueprint, request, jsonify
from ..models import Inventory, Stats
from .. import db
from ..utils import chest_loot, apply_xp, level_threshold
from ..services.user_session import get_or_create_user as get_user
from datetime import datetime

bp = Blueprint("chest", __name__)

XP_CHEST_OPEN = 5  # 宝箱開封でのXP

@bp.route("/open_chest", methods=["POST"])
def api_open_chest():
    u = get_user()
    tier = (request.json or {}).get("tier", "red")

    loot = chest_loot(tier)

    # 在庫更新
    inv = Inventory.query.get(u.id)
    inv.rope_basic  += loot.get("rope_basic", 0)
    inv.rope_silver += loot.get("rope_silver", 0)
    inv.rope_gold   += loot.get("rope_gold", 0)

    # 統計更新
    st = Stats.query.get(u.id)
    st.total_opened += 1
    st.last_played = datetime.utcnow()

    # XP加算＆レベル判定
    leveled = apply_xp(st, XP_CHEST_OPEN)

    db.session.commit()

    return jsonify({
        "loot": loot,
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
