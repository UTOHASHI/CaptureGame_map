# game/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from pathlib import Path
import os

db = SQLAlchemy()

def create_app():
    # .../project-root/game/__init__.py → project-root の絶対パスを算出
    here = Path(__file__).resolve()
    project_root = here.parent.parent              # .../project-root
    templates_dir = project_root / "templates"
    static_dir    = project_root / "static"

    app = Flask(
        __name__,
        template_folder=str(templates_dir),        # ここを明示
        static_folder=str(static_dir),             # ここを明示
        static_url_path="/static",                 # URL は /static に固定
    )

    app.secret_key = os.environ.get("SECRET_KEY", "devkey")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///game.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # ---- Blueprints ----
    from .routes.state import bp as state_bp
    from .routes.chest import bp as chest_bp
    from .routes.capture import bp as capture_bp
    app.register_blueprint(state_bp, url_prefix="/api")
    app.register_blueprint(chest_bp, url_prefix="/api")
    app.register_blueprint(capture_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    # 確認ログ（絶対パスが出るはず）
    print("TEMPLATES:", app.template_folder)
    print("STATIC   :", app.static_folder)

    return app
