import math

# 基本設定
base_weapon_chances = {
    'nuke': 0.003,          # 0.3%
    'superHoming': 0.003,   # 0.3% 
    'superShotgun': 0.003   # 0.3%
}
base_total_rare = 0.009  # 0.9%

# 2段階成長システムの運ボーナス計算
def calculate_luck_bonus(luck_level):
    if luck_level <= 15:
        return luck_level * 15  # +15%/レベル
    else:
        return 15 * 15 + (luck_level - 15) * 20  # +20%/レベル

print("🎯 ドロップ武器確率詳細分析（2段階成長システム）")
print("=" * 80)

print(f"📋 基本確率設定:")
print(f"   ニューク: {base_weapon_chances['nuke']*100:.1f}%")
print(f"   スーパーホーミング: {base_weapon_chances['superHoming']*100:.1f}%")
print(f"   スーパーショットガン: {base_weapon_chances['superShotgun']*100:.1f}%")
print(f"   合計レア武器: {base_total_rare*100:.1f}%")

print(f"\n📊 運レベル別ドロップ武器確率:")
print("運Lv | 運ボーナス | ニューク | スーパーホーミング | スーパーショットガン | 合計レア武器 | 合計倍率")
print("-" * 100)

# 主要なレベルでの分析
levels = [0, 3, 5, 7, 10, 15, 20, 25, 30, 35, 40, 50]

for level in levels:
    luck_bonus = calculate_luck_bonus(level)
    luck_multiplier = 1 + (luck_bonus / 100)
    
    # 各武器の確率計算
    nuke_chance = base_weapon_chances['nuke'] * luck_multiplier
    homing_chance = base_weapon_chances['superHoming'] * luck_multiplier
    shotgun_chance = base_weapon_chances['superShotgun'] * luck_multiplier
    total_rare = base_total_rare * luck_multiplier
    
    # パーセント表示
    nuke_percent = nuke_chance * 100
    homing_percent = homing_chance * 100
    shotgun_percent = shotgun_chance * 100
    total_percent = total_rare * 100
    
    print(f" {level:3d} |   +{luck_bonus:3.0f}%   | {nuke_percent:6.3f}% |    {homing_percent:6.3f}%     |     {shotgun_percent:6.3f}%      |   {total_percent:6.2f}%   |  {luck_multiplier:5.1f}x")

# 実用的な確率の意味
print(f"\n💡 実用的な確率の意味:")
print(f"   100回敵を倒した場合の期待ドロップ数:")

key_levels = [0, 10, 20, 30, 50]
for level in key_levels:
    luck_bonus = calculate_luck_bonus(level)
    luck_multiplier = 1 + (luck_bonus / 100)
    
    # 100回敵撃破での期待ドロップ数
    nuke_drops = base_weapon_chances['nuke'] * luck_multiplier * 100
    homing_drops = base_weapon_chances['superHoming'] * luck_multiplier * 100
    shotgun_drops = base_weapon_chances['superShotgun'] * luck_multiplier * 100
    total_drops = base_total_rare * luck_multiplier * 100
    
    print(f"\n   運Lv.{level} (100回敵撃破):")
    print(f"     ニューク: {nuke_drops:.1f}個")
    print(f"     スーパーホーミング: {homing_drops:.1f}個")
    print(f"     スーパーショットガン: {shotgun_drops:.1f}個")
    print(f"     レア武器合計: {total_drops:.1f}個")

# ゲーム進行での体感分析
print(f"\n🎮 ゲーム進行での体感分析:")

scenarios = [
    {'stage': '序盤', 'level': 3, 'enemies_per_wave': 10, 'waves': 5},
    {'stage': '中盤', 'level': 10, 'enemies_per_wave': 15, 'waves': 10},
    {'stage': '後期', 'level': 20, 'enemies_per_wave': 20, 'waves': 15},
    {'stage': '終盤', 'level': 30, 'enemies_per_wave': 25, 'waves': 20}
]

for scenario in scenarios:
    level = scenario['level']
    enemies = scenario['enemies_per_wave'] * scenario['waves']
    
    luck_bonus = calculate_luck_bonus(level)
    luck_multiplier = 1 + (luck_bonus / 100)
    
    # このステージでの期待ドロップ数
    expected_rare = base_total_rare * luck_multiplier * enemies
    expected_nuke = base_weapon_chances['nuke'] * luck_multiplier * enemies
    
    print(f"\n   {scenario['stage']} (運Lv.{level}, 敵{enemies}体撃破):")
    print(f"     レア武器期待値: {expected_rare:.2f}個")
    print(f"     ニューク期待値: {expected_nuke:.2f}個")
    print(f"     レア武器ドロップ確率: {(1-(1-base_total_rare*luck_multiplier)**enemies)*100:.1f}%")

# 目標達成度評価
print(f"\n✅ 目標達成度評価:")
print(f"   Lv.30での各武器確率:")

level_30_bonus = calculate_luck_bonus(30)
level_30_multiplier = 1 + (level_30_bonus / 100)

nuke_30 = base_weapon_chances['nuke'] * level_30_multiplier * 100
homing_30 = base_weapon_chances['superHoming'] * level_30_multiplier * 100
shotgun_30 = base_weapon_chances['superShotgun'] * level_30_multiplier * 100
total_30 = base_total_rare * level_30_multiplier * 100

print(f"     ニューク: {nuke_30:.3f}% (通常の{level_30_multiplier:.1f}倍)")
print(f"     スーパーホーミング: {homing_30:.3f}% (通常の{level_30_multiplier:.1f}倍)")
print(f"     スーパーショットガン: {shotgun_30:.3f}% (通常の{level_30_multiplier:.1f}倍)")
print(f"     合計: {total_30:.2f}% ✅ 目標5%超達成!")

# バランス懸念点
print(f"\n⚠️  バランス懸念点:")
level_50_bonus = calculate_luck_bonus(50)
level_50_multiplier = 1 + (level_50_bonus / 100)
total_50 = base_total_rare * level_50_multiplier * 100

print(f"   Lv.50での合計確率: {total_50:.1f}%")
if total_50 > 10:
    print(f"   ⚠️  10%超でバランス崩壊の可能性")
else:
    print(f"   ✅ 10%以下で適切な範囲")