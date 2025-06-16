import math

# 基本設定
base_rare_weapon_chance = 0.009  # 0.9% (ニューク+スーパーホーミング+スーパーショットガン)
base_rarity_weights = {
    'common': 67.679,
    'uncommon': 17.591,
    'rare': 8.329,
    'epic': 5.391,
    'legendary': 1.010
}

# 運スキル取得パターン
scenarios = [
    {'name': '序盤（運 I × 3回）', 'luck_bonus': 30, 'luck_level': 3},
    {'name': '中盤（運 I × 5回）', 'luck_bonus': 50, 'luck_level': 5},
    {'name': '中盤2（運 I × 3, 運 II × 2）', 'luck_bonus': 70, 'luck_level': 7},
    {'name': '後半（運 I × 5, 運 II × 3）', 'luck_bonus': 110, 'luck_level': 11},
    {'name': '終盤（運 I × 10）', 'luck_bonus': 100, 'luck_level': 10},
    {'name': '終盤2（運 I × 5, 運 II × 2, 運 III × 2）', 'luck_bonus': 150, 'luck_level': 13},
    {'name': '極後期（運 I × 20）', 'luck_bonus': 200, 'luck_level': 20},
    {'name': '超後期（運 I × 30）', 'luck_bonus': 300, 'luck_level': 30},
    {'name': '運特化ビルド（運 I × 50）', 'luck_bonus': 500, 'luck_level': 50}
]

print("🎲 運スキル効果シミュレーション（抑制なし版）")
print("=" * 80)

for scenario in scenarios:
    luck_bonus = scenario['luck_bonus']
    luck_level = scenario['luck_level']
    
    # レア武器確率計算（線形成長）
    luck_multiplier = 1 + (luck_bonus / 100)
    rare_weapon_chance = base_rare_weapon_chance * luck_multiplier
    rare_weapon_percent = rare_weapon_chance * 100
    
    # 個別武器確率
    individual_weapon_chance = rare_weapon_chance / 3
    individual_weapon_percent = individual_weapon_chance * 100
    
    # スキルレアリティ確率調整
    # 高レアスキル確率 = 運ボーナス * 0.5（スキル効果の半分）
    skill_luck_bonus = luck_bonus * 0.5
    
    # レアリティ重み調整
    total_base_weight = sum(base_rarity_weights.values())
    adjusted_weights = base_rarity_weights.copy()
    
    # Commonを減らし、高レアを増やす
    common_reduction = min(skill_luck_bonus * 0.3, 50)  # 最大50%減少
    adjusted_weights['common'] = max(20, base_rarity_weights['common'] - common_reduction)
    
    # 高レアリティを増加
    adjusted_weights['uncommon'] += skill_luck_bonus * 0.1
    adjusted_weights['rare'] += skill_luck_bonus * 0.15
    adjusted_weights['epic'] += skill_luck_bonus * 0.1
    adjusted_weights['legendary'] += skill_luck_bonus * 0.05
    
    # 合計で100%に正規化
    total_adjusted = sum(adjusted_weights.values())
    
    print(f"\n📊 {scenario['name']} (運Lv.{luck_level}, ボーナス+{luck_bonus}%)")
    print(f"   レア武器合計確率: {rare_weapon_percent:.2f}% (通常: 0.90%)")
    print(f"   ニューク確率: {individual_weapon_percent:.3f}%")
    print(f"   スーパーホーミング確率: {individual_weapon_percent:.3f}%")
    print(f"   スーパーショットガン確率: {individual_weapon_percent:.3f}%")
    
    print(f"   スキルレアリティ確率:")
    for rarity, weight in adjusted_weights.items():
        original = base_rarity_weights[rarity]
        percent = (weight / total_adjusted) * 100
        change = percent - original
        change_str = f"(+{change:.1f}%)" if change > 0 else f"({change:.1f}%)" if change < 0 else ""
        print(f"     {rarity.capitalize()}: {percent:.1f}% {change_str}")

# 特殊ケース：100回レベルアップした場合の極端例
print(f"\n🚀 極端ケース：運 I を100回取得")
extreme_luck = 1000  # +1000%
extreme_multiplier = 1 + (extreme_luck / 100)
extreme_rare_chance = base_rare_weapon_chance * extreme_multiplier * 100
print(f"   レア武器合計確率: {extreme_rare_chance:.1f}%")
print(f"   各武器確率: {extreme_rare_chance/3:.1f}%")
print(f"   確率倍率: {extreme_multiplier:.1f}倍")

# 実用的な確率変化の比較
print(f"\n📈 確率変化の比較")
print("運レベル | レア武器確率 | 倍率 | Epic確率 | Legendary確率")
print("-" * 60)
for lv in [0, 3, 5, 10, 15, 20, 30, 50]:
    if lv == 0:
        luck = 0
    else:
        luck = lv * 10  # 運 I をlv回取得と仮定
    
    multiplier = 1 + (luck / 100)
    rare_chance = base_rare_weapon_chance * multiplier * 100
    
    # スキル確率計算（簡易版）
    skill_bonus = luck * 0.5
    epic_base = 5.391
    legendary_base = 1.010
    epic_adjusted = epic_base + skill_bonus * 0.1
    legendary_adjusted = legendary_base + skill_bonus * 0.05
    total_weight = 100 + skill_bonus * 0.4  # 概算
    epic_percent = (epic_adjusted / total_weight) * 100
    legendary_percent = (legendary_adjusted / total_weight) * 100
    
    print(f"   Lv.{lv:2d}  |    {rare_chance:5.2f}%    | {multiplier:4.1f}x |  {epic_percent:5.1f}%  |    {legendary_percent:4.1f}%")