import { WEAPON_TYPES } from '../../config/gameConfig.js';

export class WeaponSystem {
    constructor() {
        this.ownedWeapons = [0]; // Start with basic weapon
        this.currentWeaponIndex = 0;
        this.lastFireTime = 0;
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
}