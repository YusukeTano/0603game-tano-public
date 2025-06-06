import { GAME_CONFIG } from '../config/gameConfig.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pool = [];
    }
    
    getPooledParticle() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return {
            x: 0, y: 0, vx: 0, vy: 0, color: '#ffffff',
            life: 1, size: 2, maxLife: 1
        };
    }
    
    returnParticleToPool(particle) {
        this.pool.push(particle);
    }
    
    createParticles(x, y, color, count, options = {}) {
        // Performance check: limit total particles
        if (this.particles.length >= GAME_CONFIG.MAX_PARTICLES) {
            this.cleanupOldParticles();
        }
        
        const {
            minSpeed = 100,
            maxSpeed = 300,
            minSize = 2,
            maxSize = 6,
            life = 1,
            spread = Math.PI * 2
        } = options;
        
        for (let i = 0; i < count && this.particles.length < GAME_CONFIG.MAX_PARTICLES; i++) {
            const angle = Math.random() * spread;
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const size = minSize + Math.random() * (maxSize - minSize);
            
            const particle = this.getPooledParticle();
            Object.assign(particle, {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                life: life,
                size: size,
                maxLife: life
            });
            this.particles.push(particle);
        }
    }
    
    cleanupOldParticles() {
        // Remove particles with very low life and return them to pool
        const remainingParticles = [];
        for (const particle of this.particles) {
            if (particle.life > GAME_CONFIG.PARTICLE_CLEANUP_THRESHOLD) {
                remainingParticles.push(particle);
            } else {
                this.returnParticleToPool(particle);
            }
        }
        this.particles = remainingParticles;
    }
    
    // Specialized particle creation functions
    createExplosionParticles(x, y, color = '#ff6600', intensity = 1) {
        this.createParticles(x, y, color, Math.floor(15 * intensity), {
            minSpeed: 150,
            maxSpeed: 400,
            minSize: 3,
            maxSize: 8
        });
    }
    
    createDeathParticles(x, y, color = '#ff00ff') {
        this.createParticles(x, y, color, 15, {
            minSpeed: 100,
            maxSpeed: 200,
            minSize: 2,
            maxSize: 5
        });
    }
    
    createPickupParticles(x, y, color = '#00ff00') {
        this.createParticles(x, y, color, 5, {
            minSpeed: 50,
            maxSpeed: 150,
            minSize: 1,
            maxSize: 3
        });
    }
    
    update(dt) {
        const remainingParticles = [];
        for (const particle of this.particles) {
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            particle.life -= dt * 2;
            
            if (particle.life > 0) {
                remainingParticles.push(particle);
            } else {
                this.returnParticleToPool(particle);
            }
        }
        this.particles = remainingParticles;
    }
    
    render(ctx) {
        ctx.shadowBlur = 0;
        this.particles.forEach(particle => {
            ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            ctx.fillRect(particle.x - particle.size/2, particle.y - particle.size/2, particle.size, particle.size);
        });
    }
}