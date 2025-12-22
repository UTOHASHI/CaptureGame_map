from . import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Inventory(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    rope_basic = db.Column(db.Integer, default=3)
    rope_silver = db.Column(db.Integer, default=1)
    rope_gold  = db.Column(db.Integer, default=0)

class DexEntry(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    mon_id  = db.Column(db.String,  primary_key=True)
    name    = db.Column(db.String)
    seen    = db.Column(db.Integer, default=0)
    caught  = db.Column(db.Integer, default=0)
    best_lv = db.Column(db.Integer, default=0)

class Stats(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    total_caught = db.Column(db.Integer, default=0)
    total_opened = db.Column(db.Integer, default=0)
    last_played  = db.Column(db.DateTime, default=datetime.utcnow)

    level       = db.Column(db.Integer, default=1, nullable=False)
    xp          = db.Column(db.Integer, default=0, nullable=False)
