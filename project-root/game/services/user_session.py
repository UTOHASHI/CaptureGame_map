# game/services/user_session.py
from ..models import User, Inventory, Stats
from .. import db
import time

def get_or_create_user():
    """
    MVP用の簡易ユーザー生成。
    本来はセッション/ログイン連携だが、ここでは最初の1ユーザーを作成して固定。
    将来は session['user_id'] を見て切替える。
    """
    u = User.query.first()
    if u:
        return u

    # 初回のみゲスト作成
    u = User(name=f"guest-{time.time()}")
    db.session.add(u)

    inv = Inventory(user_id=u.id)                # 在庫初期値 0
    st  = Stats(user_id=u.id, level=1, xp=0)     # レベル/XP 初期化
    db.session.add_all([inv, st])

    db.session.commit()
    return u
