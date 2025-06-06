import { GAME_CONFIG } from '../../config/gameConfig.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = GAME_CONFIG.PLAYER_RADIUS;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.hp = GAME_CONFIG.PLAYER_MAX_HP;
        this.maxHp = GAME_CONFIG.PLAYER_MAX_HP;
        this.exp = 0;
        this.expToNext = 10;
        this.level = 1;
        this.trail = [];
        this.invulnerable = false;
        this.invulnerableTime = 0;
    }
    
    update(dt, mouseX, mouseY, cameraOffset, virtualMapSize, skills) {
        // Convert mouse position to world coordinates
        const worldMouseX = mouseX + cameraOffset.x;
        const worldMouseY = mouseY + cameraOffset.y;
        
        const dx = worldMouseX - this.x;
        const dy = worldMouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveDistance = Math.min(distance, this.speed * dt);
            const newX = this.x + (dx / distance) * moveDistance;
            const newY = this.y + (dy / distance) * moveDistance;
            
            // Keep player within map bounds
            this.x = Math.max(this.radius, Math.min(virtualMapSize.width - this.radius, newX));
            this.y = Math.max(this.radius, Math.min(virtualMapSize.height - this.radius, newY));
        }

        // Update trail
        this.trail.push({ x: this.x, y: this.y, time: Date.now() });
        this.trail = this.trail.filter(p => Date.now() - p.time < 200);

        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= dt * 1000;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // HP regeneration
        const regenSkill = skills.find(s => s.id === 'regen');
        if (regenSkill) {
            this.hp = Math.min(this.maxHp, this.hp + regenSkill.level * 2 * dt);
        }
    }
    
    takeDamage(damage) {
        if (this.invulnerable) return false;
        
        this.hp -= damage;
        this.invulnerable = true;
        this.invulnerableTime = GAME_CONFIG.PLAYER_INVULNERABLE_TIME;
        
        return true;
    }
    
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToNext) {
            this.levelUp();
            return true;
        }
        return false;
    }
    
    levelUp() {
        this.level++;
        this.exp = 0;
        this.expToNext = 10 + this.level * 5;
        this.hp = this.maxHp; // Full heal on level up
    }
    
    render(ctx, feverMode) {
        // Draw player trail
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.trail.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
        
        // Draw player
        ctx.fillStyle = this.invulnerable ? 'rgba(0, 255, 255, 0.5)' : '#00ffff';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
}