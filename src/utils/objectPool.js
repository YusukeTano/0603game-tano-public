export class ObjectPool {
    constructor() {
        this.projectiles = [];
        this.enemies = [];
    }
    
    getPooledProjectile() {
        if (this.projectiles.length > 0) {
            return this.projectiles.pop();
        }
        return {
            x: 0, y: 0, vx: 0, vy: 0, damage: 0, range: 0, traveled: 0,
            piercing: false, explosive: false, color: '#00ffff', hits: []
        };
    }
    
    returnProjectileToPool(projectile) {
        // Reset projectile state
        projectile.hits.length = 0;
        projectile.traveled = 0;
        this.projectiles.push(projectile);
    }
    
    getPooledEnemy() {
        if (this.enemies.length > 0) {
            return this.enemies.pop();
        }
        return {
            x: 0, y: 0, type: 'basic', angle: 0, radius: 15,
            hp: 20, maxHp: 20, speed: 40, damage: 8, exp: 5
        };
    }
    
    returnEnemyToPool(enemy) {
        this.enemies.push(enemy);
    }
}