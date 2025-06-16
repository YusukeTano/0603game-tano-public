import math

# 基本設定
base_rare_weapon_chance = 0.009  # 0.9%

print("🎲 運スキル強化版仕様提案（Lv.30で5%超目標）")
print("=" * 80)

# 提案A: 効果量を1.5倍に強化
print("\n📈 提案A: 効果量1.5倍強化")
print("   運 I: +10% → +15%")
print("   運 II: +20% → +30%") 
print("   運 III: +30% → +45%")

scenarios_a = [
    {'name': '序盤（運 I × 3回）', 'luck_bonus': 45, 'luck_level': 3},
    {'name': '中盤（運 I × 7回）', 'luck_bonus': 105, 'luck_level': 7},
    {'name': '後半（運 I × 15回）', 'luck_bonus': 225, 'luck_level': 15},
    {'name': '目標（運 I × 20回）', 'luck_bonus': 300, 'luck_level': 20},
    {'name': '極後期（運 I × 30回）', 'luck_bonus': 450, 'luck_level': 30}
]

for scenario in scenarios_a:
    luck_bonus = scenario['luck_bonus']
    luck_level = scenario['luck_level']
    luck_multiplier = 1 + (luck_bonus / 100)
    rare_weapon_chance = base_rare_weapon_chance * luck_multiplier
    rare_weapon_percent = rare_weapon_chance * 100
    
    print(f"   Lv.{luck_level:2d}: {rare_weapon_percent:5.2f}% (倍率: {luck_multiplier:.1f}x)")

# 提案B: 2段階成長システム
print(f"\n📈 提案B: 2段階成長システム")
print("   Lv.1-15: +15%/レベル (線形)")
print("   Lv.16+: +20%/レベル (加速)")

scenarios_b = []
for lv in [3, 7, 10, 15, 20, 25, 30]:
    if lv <= 15:
        luck_bonus = lv * 15  # 15%/レベル
    else:
        luck_bonus = 15 * 15 + (lv - 15) * 20  # 15レベルまで225% + 追加20%/レベル
    scenarios_b.append({'name': f'Lv.{lv}', 'luck_bonus': luck_bonus, 'luck_level': lv})

for scenario in scenarios_b:
    luck_bonus = scenario['luck_bonus']
    luck_level = scenario['luck_level']
    luck_multiplier = 1 + (luck_bonus / 100)
    rare_weapon_chance = base_rare_weapon_chance * luck_multiplier
    rare_weapon_percent = rare_weapon_chance * 100
    
    print(f"   Lv.{luck_level:2d}: {rare_weapon_percent:5.2f}% (ボーナス: +{luck_bonus}%, 倍率: {luck_multiplier:.1f}x)")

# 提案C: 平方根成長システム
print(f"\n📈 提案C: 平方根成長システム")
print("   効果量 = sqrt(運レベル) × 50%")

scenarios_c = []
for lv in [3, 7, 10, 15, 20, 25, 30, 40, 50]:
    luck_bonus = math.sqrt(lv) * 50
    scenarios_c.append({'name': f'Lv.{lv}', 'luck_bonus': luck_bonus, 'luck_level': lv})

for scenario in scenarios_c:
    luck_bonus = scenario['luck_bonus']
    luck_level = scenario['luck_level']
    luck_multiplier = 1 + (luck_bonus / 100)
    rare_weapon_chance = base_rare_weapon_chance * luck_multiplier
    rare_weapon_percent = rare_weapon_chance * 100
    
    print(f"   Lv.{luck_level:2d}: {rare_weapon_percent:5.2f}% (ボーナス: +{luck_bonus:.0f}%, 倍率: {luck_multiplier:.1f}x)")

# 提案D: 指数成長システム
print(f"\n📈 提案D: 指数成長システム")
print("   効果量 = 運レベル^1.3 × 5%")

scenarios_d = []
for lv in [3, 7, 10, 15, 20, 25, 30, 40, 50]:
    luck_bonus = (lv ** 1.3) * 5
    scenarios_d.append({'name': f'Lv.{lv}', 'luck_bonus': luck_bonus, 'luck_level': lv})

for scenario in scenarios_d:
    luck_bonus = scenario['luck_bonus']
    luck_level = scenario['luck_level']
    luck_multiplier = 1 + (luck_bonus / 100)
    rare_weapon_chance = base_rare_weapon_chance * luck_multiplier
    rare_weapon_percent = rare_weapon_chance * 100
    
    print(f"   Lv.{luck_level:2d}: {rare_weapon_percent:5.2f}% (ボーナス: +{luck_bonus:.0f}%, 倍率: {luck_multiplier:.1f}x)")

# 推奨提案: ハイブリッド方式
print(f"\n🌟 推奨提案: ハイブリッド方式")
print("   運 I (Common): +15% (強化)")
print("   運 II (Uncommon): +25% (強化)")  
print("   運 III (Rare): +35% (強化)")
print("   + Lv.20以降は追加ボーナス: +5%/レベル")

print(f"\n   実用的なレベル達成例:")
scenarios_hybrid = [
    {'desc': '運 I × 3回', 'levels': 3, 'base_bonus': 45},
    {'desc': '運 I × 5回, 運 II × 1回', 'levels': 7, 'base_bonus': 100},
    {'desc': '運 I × 6回, 運 II × 2回', 'levels': 10, 'base_bonus': 140},
    {'desc': '運 I × 8回, 運 II × 2回, 運 III × 1回', 'levels': 13, 'base_bonus': 205},
    {'desc': '運 I × 10回, 運 II × 3回, 運 III × 2回', 'levels': 19, 'base_bonus': 295},
    {'desc': '上記 + 追加成長', 'levels': 25, 'base_bonus': 295 + (25-20)*5},
    {'desc': '上記 + さらに成長', 'levels': 30, 'base_bonus': 295 + (30-20)*5}
]

for scenario in scenarios_hybrid:
    luck_level = scenario['levels']
    base_bonus = scenario['base_bonus']
    
    # Lv.20以降の追加ボーナス
    if luck_level > 20:
        extra_bonus = (luck_level - 20) * 5
        total_bonus = base_bonus + extra_bonus
    else:
        total_bonus = base_bonus
    
    luck_multiplier = 1 + (total_bonus / 100)
    rare_weapon_chance = base_rare_weapon_chance * luck_multiplier
    rare_weapon_percent = rare_weapon_chance * 100
    
    status = "🎯 目標達成!" if rare_weapon_percent >= 5.0 else ""
    print(f"   Lv.{luck_level:2d} ({scenario['desc']})")
    print(f"        レア武器: {rare_weapon_percent:5.2f}% (ボーナス: +{total_bonus}%) {status}")

print(f"\n💡 実装仕様案:")
print(f"   1. 基本効果量を1.5倍強化")
print(f"   2. Lv.20以降は線形追加ボーナス(+5%/レベル)")
print(f"   3. Lv.25-30で目標5%超を達成")
print(f"   4. 極後期(Lv.50+)でも10%以下に制御")