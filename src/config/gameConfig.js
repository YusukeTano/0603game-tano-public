// Game configuration constants
export const GAME_CONFIG = {
    // Player constants
    PLAYER_RADIUS: 15,
    PLAYER_SPEED: 300,
    PLAYER_MAX_HP: 100,
    PLAYER_INVULNERABLE_TIME: 1000,
    PLAYER_TRAIL_LENGTH: 20,
    
    // Enemy constants
    ENEMY_SPAWN_BASE_RATE: 1000,
    ENEMY_MIN_SPAWN_RATE: 200,
    ENEMY_BASIC: { hp: 20, speed: 100, damage: 10, exp: 5, radius: 15, color: '#ff0066' },
    ENEMY_FAST: { hp: 15, speed: 200, damage: 15, exp: 8, radius: 12, color: '#ff6600' },
    ENEMY_TANK: { hp: 40, speed: 50, damage: 20, exp: 15, radius: 20, color: '#cc0000' },
    
    // Combat constants
    WEAPON_FIRE_SPREAD: 0.2,
    PROJECTILE_BASE_RADIUS: 5,
    EXPLOSION_RADIUS: 100,
    COMBO_TIMEOUT: 2000,
    COMBO_MULTIPLIER: 0.1,
    FEVER_MODE_THRESHOLD: 50,
    
    // UI constants
    MINIMAP_WIDTH: 200,
    MINIMAP_HEIGHT: 150,
    DAMAGE_WARNING_DURATION: 500,
    NOTIFICATION_DURATION: 3000,
    
    // Game mechanics
    BEAT_INTERVAL: 500,
    PHASE_DURATION: 10000,
    TOTAL_GAME_TIME: 180000,
    EXP_ORB_RADIUS: 10,
    EXP_ORB_ATTRACT_RADIUS: 100,
    EXP_ORB_SPEED: 300,
    WEAPON_DROP_CHANCE: 0.05,
    SPECIAL_ABILITY_COOLDOWN: 10000,
    
    // Performance
    MAX_PARTICLES: 500,
    PARTICLE_CLEANUP_THRESHOLD: 0.1,
    
    // Map
    VIRTUAL_MAP_WIDTH: 3000,
    VIRTUAL_MAP_HEIGHT: 2000
};

// Weapon types configuration
export const WEAPON_TYPES = [
    { name: 'ベーシック', damage: 15, range: 400, fireRate: 300, speed: 500, count: 1, color: '#00ffff' },
    { name: 'ラピッド', damage: 8, range: 300, fireRate: 100, speed: 600, count: 1, color: '#ff6600' },
    { name: 'ヘビー', damage: 35, range: 350, fireRate: 800, speed: 400, count: 1, color: '#ff0066' },
    { name: 'スプレッド', damage: 12, range: 250, fireRate: 400, speed: 450, count: 3, color: '#ffff00' },
    { name: 'スナイパー', damage: 60, range: 800, fireRate: 1500, speed: 800, count: 1, color: '#ff00ff' },
    { name: 'エクスプローシブ', damage: 25, range: 300, fireRate: 1000, speed: 350, count: 1, explosive: true, color: '#ff9900' }
];

// Skill definitions
export const SKILL_DEFINITIONS = {
    'damage': { name: 'ダメージアップ', desc: '攻撃力 +5', maxLevel: 10 },
    'range': { name: '射程延長', desc: '射程距離 +100', maxLevel: 5 },
    'speed': { name: '移動速度アップ', desc: '移動速度 +20%', maxLevel: 5 },
    'multishot': { name: '多重射撃', desc: '弾数 +1', maxLevel: 3 },
    'piercing': { name: '貫通', desc: '弾が敵を貫通', maxLevel: 1 },
    'explosion': { name: '爆発', desc: '爆発ダメージ追加', maxLevel: 1 },
    'regen': { name: 'HP回復', desc: 'HP自動回復', maxLevel: 5 },
    'shield': { name: 'シールド', desc: 'ダメージ軽減バリア', maxLevel: 3 }
};

// Audio configuration
export const AUDIO_CONFIG = {
    MASTER_VOLUME: 0.5,
    MUSIC_VOLUME: 0.8,
    SFX_VOLUME: 0.6,
    BASE_TEMPO: 120,
    TEMPO_INCREASE_PER_LEVEL: 40
};