import random

RARITY_COEF = {"common":1.0, "rare":0.9, "epic":0.8}
ROPE_COEF   = {"rope_basic":0.35, "rope_silver":0.55, "rope_gold":0.75}

def capture_chance(level:int, rarity:str, rope_key:str) -> float:
    # レベル補正: 1/(1+0.1*(level-1))
    level_coef = 1.0 / (1.0 + 0.1 * (level-1))
    
    base = ROPE_COEF.get(rope_key, 0.4)
    rarity_c = RARITY_COEF.get(rarity, 1.0)

    p = base * level_coef * rarity_c
    return max(0.05, min(0.95, p))

def chest_loot(tier: str):
    loot = {"rope_basic": 0, "rope_silver": 0, "rope_gold": 0}
    roll = random.random()

    if tier == "gold":
        # 金の宝箱 : 75%で金ロープ１つ, 15%で金ロープ２つ, 10%で銀ロープ２つ
        if roll < 0.75:
            loot["rope_gold"] += 1
        elif roll < 0.90:
            loot["rope_gold"] += 2
        else:
            loot["rope_silver"] += 2

    elif tier == "blue":
        # 青の宝箱 : 10%で金ロープ１つ, 50%で銀ロープ1つ, 20%で銀ロープ２つ, 20％で通常縄2つ
        if roll < 0.10:
            loot["rope_gold"] += 1
        elif roll < 0.60:  # 0.10〜0.60
            loot["rope_silver"] += 1
        elif roll < 0.80:  # 0.60〜0.80
            loot["rope_silver"] += 2
        else:              # 0.80〜1.00
            loot["rope_basic"] += 2

    else:  # red
        # 赤の宝箱 : 69%で通常縄1つ, 20%で通常縄2つ, 10%で銀ロープ１つ, 1%で金ロープ１つ
        if roll < 0.69:
            loot["rope_basic"] += 1
        elif roll < 0.89:  # 0.69〜0.89
            loot["rope_basic"] += 2
        elif roll < 0.99:  # 0.89〜0.99
            loot["rope_silver"] += 1
        else:              # 0.99〜1.00
            loot["rope_gold"] += 1

    return loot


# game/utils.py （追記）
def level_threshold(level: int) -> int:
    """次レベルに必要な XP。MVPのシンプル式。"""
    if level < 1:
        level = 1
    return 100 + 25 * (level - 1) * (level - 1)

def apply_xp(stats, gain:int):
    """XP加算して必要ならレベルアップ。stats は Stats インスタンス。"""
    if gain <= 0:
        return False

    stats.xp = (stats.xp or 0) + gain
    leveled = False

    while True:
        need = level_threshold(stats.level or 1)
        if stats.xp >= need:
            stats.xp -= need
            stats.level = (stats.level or 1) + 1
            leveled = True
        else:
            break
    return leveled

