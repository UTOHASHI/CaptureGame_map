from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY", "devkey")
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///game.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    # API Blueprints
    from .routes.state import bp as state_bp
    from .routes.chest import bp as chest_bp
    from .routes.capture import bp as capture_bp
    app.register_blueprint(state_bp, url_prefix="/api")
    app.register_blueprint(chest_bp, url_prefix="/api")
    app.register_blueprint(capture_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app
