import { WEAPON_TYPES } from '../../config/gameConfig.js';

export class WeaponSystem {
    constructor() {
        this.ownedWeapons = [0]; // Start with basic weapon
        this.currentWeaponIndex = 0;
        this.lastFireTime = 0;
        this.autoAttackEnabled = true; // Auto-attack is enabled by default
    }
    
    getCurrentWeapon() {
        // Safety check to prevent attacks from stopping
        if (!this.ownedWeapons || this.ownedWeapons.length === 0) {
            console.warn('ownedWeapons reset');
            this.ownedWeapons = [0]; // Reset to default weapon
            this.currentWeaponIndex = 0;
        }
        
        if (this.currentWeaponIndex >= this.ownedWeapons.length || this.currentWeaponIndex < 0) {
            console.warn('currentWeaponIndex reset, index was', this.currentWeaponIndex);
            this.currentWeaponIndex = 0; // Reset to first weapon
        }
        
        const weaponIndex = this.ownedWeapons[this.currentWeaponIndex];
        if (weaponIndex >= WEAPON_TYPES.length || weaponIndex < 0) {
            console.warn('Invalid weaponIndex reset, index was', weaponIndex);
            this.ownedWeapons[this.currentWeaponIndex] = 0; // Reset to default weapon
            return WEAPON_TYPES[0];
        }
        
        return WEAPON_TYPES[weaponIndex];
    }
    
    switchWeapon() {
        if (this.ownedWeapons.length > 1) {
            this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.ownedWeapons.length;
            return true;
        }
        return false;
    }
    
    addWeapon(weaponIndex) {
        if (!this.ownedWeapons.includes(weaponIndex)) {
            this.ownedWeapons.push(weaponIndex);
            return true; // New weapon added
        }
        return false; // Already owned
    }
    
    canFire() {
        const weapon = this.getCurrentWeapon();
        const now = Date.now();
        return (now - this.lastFireTime) > weapon.fireRate;
    }
    
    fire() {
        this.lastFireTime = Date.now();
    }
    
    // Auto-attack methods
    toggleAutoAttack() {
        this.autoAttackEnabled = !this.autoAttackEnabled;
        return this.autoAttackEnabled;
    }
    
    findNearestEnemies(enemies, player, count = 1) {
        return enemies
            .map(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return { enemy, distance, dx, dy };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count);
    }
    
    canAutoFire(enemies, player) {
        if (!this.autoAttackEnabled) return false;
        if (!this.canFire()) return false;
        
        const weapon = this.getCurrentWeapon();
        const nearestEnemies = this.findNearestEnemies(enemies, player, 1);
        
        // Check if there are enemies within range
        if (nearestEnemies.length > 0) {
            const { distance } = nearestEnemies[0];
            return distance <= weapon.range;
        }
        
        return false;
    }
    
    getAutoAttackTargets(enemies, player, skills) {
        const weapon = this.getCurrentWeapon();
        const projectileCount = weapon.count + (skills.find(s => s.id === 'multishot')?.level || 0);
        
        return this.findNearestEnemies(enemies, player, projectileCount);
    }
}