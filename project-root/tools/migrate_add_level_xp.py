import os, sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# tools/migrate_add_level_xp.py
from game import create_app, db

app = create_app()

with app.app_context():
    # 既存DBに列を追加（存在する場合はスキップ）
    try:
        db.session.execute(db.text("ALTER TABLE stats ADD COLUMN level INTEGER DEFAULT 1"))
        print("added column: level")
    except Exception as e:
        print("level 追加済みか、他のエラー:", e)

    try:
        db.session.execute(db.text("ALTER TABLE stats ADD COLUMN xp INTEGER DEFAULT 0"))
        print("added column: xp")
    except Exception as e:
        print("xp 追加済みか、他のエラー:", e)

    db.session.commit()
    print("done.")