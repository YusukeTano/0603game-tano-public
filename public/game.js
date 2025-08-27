const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const powerEl = document.getElementById('power');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const pauseBanner = document.getElementById('pause');
const bossHP = document.getElementById('bossHP');
const bossFill = document.getElementById('bossFill');
const hiscoreList = document.getElementById('hiscoreList');
const finalScoreValue = document.getElementById('finalScoreValue');
const scoreSummary = document.getElementById('scoreSummary');
const nameInput = document.getElementById('nameInput');
const saveScoreBtn = document.getElementById('saveScoreBtn');

let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let W = 0, H = 0;

function resize() {
  DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const { innerWidth, innerHeight } = window;
  W = innerWidth; H = innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true;
}
resize();
window.addEventListener('resize', resize);

const rnd = (a=1,b=0)=>Math.random()*(a-b)+b;
const rndi = (a,b)=>Math.floor(rnd(a,b));
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const len=(x,y)=>Math.hypot(x,y);
const dist2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy;};
const nowMs=()=>performance.now();

const audio = {
  ctx: null,
  master: null,
  enabled: false,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.15;
      this.master.connect(this.ctx.destination);
    } catch (e) {
      this.enabled = false;
    }
  },
  resume() {
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') this.ctx.resume();
    this.enabled = true;
  },
  play(freq, dur=0.08, type='square', vol=0.8) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }
};

const input = {
  keys: new Set(),
  pointer: { active:false, x:0, y:0 },
  shootHeld: false,
};

window.addEventListener('keydown', (e)=>{
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  input.keys.add(e.key);
  if (e.key === 'p' || e.key === 'P') togglePause();
  if ((e.key === 'Enter' || e.key === ' ') && state.phase !== 'playing') startGame();
});
window.addEventListener('keyup', (e)=>{ input.keys.delete(e.key); });

canvas.addEventListener('pointerdown', (e)=>{
  canvas.setPointerCapture(e.pointerId);
  const r = canvas.getBoundingClientRect();
  input.pointer.active = true;
  input.pointer.x = e.clientX - r.left;
  input.pointer.y = e.clientY - r.top;
  input.shootHeld = true;
  if (state.phase !== 'playing') startGame();
});
canvas.addEventListener('pointermove', (e)=>{
  if (!input.pointer.active) return;
  const r = canvas.getBoundingClientRect();
  input.pointer.x = e.clientX - r.left;
  input.pointer.y = e.clientY - r.top;
});
canvas.addEventListener('pointerup', ()=>{
  input.pointer.active = false;
  input.shootHeld = false;
});

const state = {
  phase: 'menu',
  t: 0,
  score: 0,
  paused: false,
  nextBossAt: 150,
};

const stars = [];
function initStars() {
  stars.length = 0;
  const count = Math.floor((W*H)/1400);
  for (let i=0;i<count;i++) {
    stars.push({
      x: rnd(W),
      y: rnd(H),
      z: rnd(1,0),
      s: rnd(0.6,0.2),
      hue: rndi(170, 210)
    });
  }
}
initStars();

const player = {
  x: W/2, y: H*0.8,
  vx: 0, vy: 0,
  speed: 520,
  drag: 0.88,
  r: 13,
  fireCd: 0,
  baseFire: 0.16,
  rapidTimer: 0,
  spreadLevel: 0,
  shieldTimer: 0,
  lives: 3,
  invuln: 0,
  alive: true,
};

const bullets = [];
const eBullets = [];
const enemies = [];
const particles = [];
const powerups = [];
let boss = null;
const pTrail = [];
let pTrailTimer = 0;

// Screen shake and flash
let shakeT = 0, shakeMag = 0;
let flashAlpha = 0;
function addShake(mag=8, dur=0.2) { shakeMag = Math.max(shakeMag, mag); shakeT = Math.max(shakeT, dur); }
function addFlash(a=0.5) { flashAlpha = Math.max(flashAlpha, a); }

function resetPlayer() {
  player.x = W/2; player.y = H*0.8;
  player.vx = 0; player.vy = 0;
  player.rapidTimer = 0; player.spreadLevel = 0; player.shieldTimer = 0;
  player.fireCd = 0; player.invuln = 1.2;
  player.alive = true;
}

const spawner = { t: 0, level: 1, next: 0 };

function startGame() {
  overlay.classList.remove('show');
  audio.init();
  audio.resume();
  state.phase = 'playing';
  state.paused = false;
  pauseBanner.classList.remove('show');
  state.score = 0;
  bullets.length = 0; eBullets.length = 0; enemies.length = 0; particles.length = 0; powerups.length = 0;
  spawner.t = 0; spawner.level = 1; spawner.next = 0;
  resetPlayer();
  boss = null;
  state.nextBossAt = 150;
  updateBossBar();
  scoreSummary?.classList.add('hide');
  last = nowMs();
}

function gameOver() {
  state.phase = 'menu';
  overlay.classList.add('show');
  startBtn.textContent = 'リスタート';
  finalScoreValue.textContent = state.score.toString();
  scoreSummary.classList.remove('hide');
  maybeQualifyAndPrompt();
  refreshScoresUI();
}

function togglePause() {
  if (state.phase !== 'playing') return;
  state.paused = !state.paused;
  pauseBanner.classList.toggle('show', state.paused);
}

startBtn.addEventListener('click', startGame);

function addBullet(x,y,ang,speed, friendly=true, dmg=1) {
  bullets.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,r:4,life:2, friendly, dmg, hue: friendly?190:350});
}

function addEnemyBullet(x,y,ang,speed,dmg=1) {
  eBullets.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,r:4,life:5, dmg, hue: 350});
}

function addEnemy(e) { enemies.push(e); }

function addParticle(x,y, vx,vy, life, size, hue, alpha=1) {
  particles.push({x,y,vx,vy,life,size,hue,alpha});
}

function burst(x,y, hue=190, power=1) {
  const n = 16 + rndi(0,8);
  for (let i=0;i<n;i++) {
    const a = rnd(Math.PI*2); const s = rnd(60, 220)*power;
    addParticle(x,y, Math.cos(a)*s, Math.sin(a)*s, rnd(0.4,0.9), rnd(1,3), hue, 1);
  }
}

function thruster(x,y, dir) {
  const a = dir + Math.PI + rnd(0.5,-0.5);
  const s = rnd(60,120);
  addParticle(x,y, Math.cos(a)*s, Math.sin(a)*s, rnd(0.2,0.4), rnd(1,2), 190, 0.9);
}

function tryShoot(dt) {
  const want = input.keys.has(' ') || input.keys.has('Spacebar') || input.shootHeld;
  player.fireCd -= dt; if (!want) return;
  const rate = Math.max(0.06, player.baseFire * (player.rapidTimer>0 ? 0.55 : 1));
  if (player.fireCd > 0) return;
  player.fireCd = rate;
  const spread = player.spreadLevel;
  const shots = 1 + spread;
  const base = -Math.PI/2;
  const spreadAngle = spread>0 ? 0.28 : 0;
  for (let i=0;i<shots;i++) {
    const t = shots===1?0:(i/(shots-1)-0.5);
    const ang = base + t*spreadAngle;
    addBullet(player.x, player.y-16, ang, 900, true, 1);
  }
  audio.play(880, 0.06, 'square', 0.5);
}

function tryMove(dt) {
  let ax=0, ay=0;
  if (input.keys.has('ArrowLeft')||input.keys.has('a')||input.keys.has('A')) ax -= 1;
  if (input.keys.has('ArrowRight')||input.keys.has('d')||input.keys.has('D')) ax += 1;
  if (input.keys.has('ArrowUp')||input.keys.has('w')||input.keys.has('W')) ay -= 1;
  if (input.keys.has('ArrowDown')||input.keys.has('s')||input.keys.has('S')) ay += 1;
  if (input.pointer.active) {
    const dx = input.pointer.x - player.x;
    const dy = input.pointer.y - player.y;
    const L = len(dx,dy);
    if (L>8) { ax += dx/L; ay += dy/L; }
  }
  const L = len(ax,ay);
  if (L>0) { ax/=L; ay/=L; }
  player.vx += ax * player.speed * dt;
  player.vy += ay * player.speed * dt;
  player.vx *= player.drag; player.vy *= player.drag;
  const maxV = 420;
  const vL = len(player.vx, player.vy);
  if (vL>maxV) { player.vx = player.vx/maxV*maxV; player.vy = player.vy/maxV*maxV; }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = clamp(player.x, 14, W-14);
  player.y = clamp(player.y, 14, H-14);
  thruster(player.x, player.y+14, Math.atan2(player.vy, player.vx));
}

function spawnWave(dt) {
  if (boss) return; // ボス中は雑魚を止める
  spawner.t += dt; spawner.next -= dt;
  if (spawner.next>0) return;
  spawner.level += 0.03;
  const kind = rndi(0,3);
  if (kind===0) {
    const n = 5 + rndi(0,3);
    const amp = rnd(20, 60);
    const spd = rnd(60, 110) + spawner.level*6;
    for (let i=0;i<n;i++) {
      const x = rnd(W*0.15, W*0.85);
      const y = -rndi(20,140) - i*30;
      addEnemy(makeEnemy('sine', x, y, spd, amp, 0.8));
    }
    spawner.next = rnd(1.2, 2.1);
  } else if (kind===1) {
    const n = 6 + rndi(0,4);
    const baseX = rnd(W*0.2, W*0.8);
    for (let i=0;i<n;i++) {
      addEnemy(makeEnemy('drone', baseX + (i-3)*20, -40 - i*26, 140 + spawner.level*10, 0, 1));
    }
    spawner.next = rnd(1.0, 1.8);
  } else {
    const n = 3 + rndi(0,3);
    for (let i=0;i<n;i++) {
      addEnemy(makeEnemy('shooter', rnd(40, W-40), -60 - i*40, 90 + spawner.level*8, 0, 3));
    }
    spawner.next = rnd(1.6, 2.4);
  }
}

function makeEnemy(type, x, y, speed, amp=0, hp=1) {
  return {
    type, x, y, baseX: x, t: 0, hp, r: 14, speed, amp,
    fire: rnd(0.6,1.2),
    alive: true,
  };
}

function updateEnemy(e, dt) {
  e.t += dt;
  if (e.type === 'sine') {
    e.y += e.speed * dt;
    e.x = e.baseX + Math.sin(e.t*2.4) * e.amp;
  } else if (e.type === 'drone') {
    e.y += e.speed * dt;
  } else if (e.type === 'shooter') {
    e.y += e.speed * dt * 0.8;
    e.fire -= dt;
    if (e.fire<=0) {
      e.fire = rnd(0.9, 1.6);
      const ang = Math.atan2(player.y - e.y, player.x - e.x);
      addEnemyBullet(e.x, e.y, ang, 220 + spawner.level*6, 1);
      audio.play(240, 0.09, 'sawtooth', 0.35);
    }
  }
  if (e.y > H + 40) e.alive = false;
}

function drawEnemy(e) {
  const g = ctx.createLinearGradient(e.x, e.y-16, e.x, e.y+16);
  g.addColorStop(0, 'hsl(12 90% 60% / 0.95)');
  g.addColorStop(1, 'hsl(350 90% 55% / 0.95)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y-16);
  ctx.lineTo(e.x-12, e.y+10);
  ctx.lineTo(e.x+12, e.y+10);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'hsla(350 100% 80% / 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPlayer() {
  const shield = player.shieldTimer>0 || player.invuln>0;
  if (shield) {
    ctx.strokeStyle = 'hsla(190 100% 70% / 0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r+6, 0, Math.PI*2);
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(player.x, player.y-18, player.x, player.y+18);
  g.addColorStop(0, 'hsl(200 95% 65% / 1)');
  g.addColorStop(1, 'hsl(185 95% 55% / 1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y-18);
  ctx.lineTo(player.x-12, player.y+14);
  ctx.lineTo(player.x+12, player.y+14);
  ctx.closePath();
  if (player.invuln>0 && Math.floor(state.t*30)%2===0) {
    // 被弾点滅（点滅中は半透明）
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fill();
  }
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'hsla(185 100% 90% / 0.5)';
  ctx.stroke();
}

function drawBullet(b) {
  const color = `hsl(${b.hue} 95% 65%)`;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawEBullet(b) {
  const color = `hsl(350 95% 65%)`;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawPowerup(p) {
  const color = p.kind==='rapid' ? 'hsl(50 90% 55%)' : p.kind==='spread' ? 'hsl(280 90% 65%)' : p.kind==='shield' ? 'hsl(190 90% 60%)' : 'hsl(130 80% 55%)';
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI*2);
  ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
}

function update(dt) {
  state.t += dt;
  if (shakeT>0) { shakeT -= dt; if (shakeT<0) shakeT=0; }
  if (flashAlpha>0) { flashAlpha = Math.max(0, flashAlpha - dt*2.2); }
  for (let s of stars) {
    const v = 20 + s.z*120;
    s.y += v*dt;
    if (s.y>H) { s.y = -2; s.x = rnd(W); s.z = rnd(1,0); s.hue = rndi(170,210); }
  }

  if (!player.alive) return;
  player.invuln = Math.max(0, player.invuln - dt);
  player.rapidTimer = Math.max(0, player.rapidTimer - dt);
  player.shieldTimer = Math.max(0, player.shieldTimer - dt);

  tryMove(dt);
  tryShoot(dt);
  spawnWave(dt);
  if (!boss && state.score >= state.nextBossAt) spawnBoss();

  // Player trail update
  pTrailTimer -= dt;
  if (pTrailTimer<=0) {
    pTrailTimer = 0.03;
    pTrail.push({x: player.x, y: player.y, life: 0.4});
    if (pTrail.length>40) pTrail.shift();
  }
  for (let i=pTrail.length-1;i>=0;i--) {
    const t = pTrail[i]; t.life -= dt; if (t.life<=0) pTrail.splice(i,1);
  }

  for (let i=bullets.length-1;i>=0;i--) {
    const b = bullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.y<-20 || b.y>H+20 || b.life<=0) { bullets.splice(i,1); continue; }
  }
  for (let i=eBullets.length-1;i>=0;i--) {
    const b = eBullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.y<-20 || b.y>H+20 || b.life<=0) { eBullets.splice(i,1); continue; }
  }

  for (let i=enemies.length-1;i>=0;i--) {
    const e = enemies[i];
    updateEnemy(e, dt);
    if (!e.alive) { enemies.splice(i,1); continue; }
  }

  if (boss) updateBoss(boss, dt);

  for (let i=powerups.length-1;i>=0;i--) {
    const p = powerups[i];
    p.y += 60*dt;
    if (p.y>H+20) { powerups.splice(i,1); continue; }
  }

  for (let i=particles.length-1;i>=0;i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.98; p.vy *= 0.98;
    if (p.life<=0) particles.splice(i,1);
  }

  for (let i=enemies.length-1;i>=0;i--) {
    const e = enemies[i];
    for (let j=bullets.length-1;j>=0;j--) {
      const b = bullets[j];
      if (!b.friendly) continue;
      const rr = (e.r+ b.r)*1.0; if (dist2(e,b) <= rr*rr) {
        bullets.splice(j,1);
        e.hp -= b.dmg;
        addParticle(b.x, b.y, b.vx*0.2, b.vy*0.2, 0.2, 2, 45);
        if (e.hp<=0) {
          enemies.splice(i,1);
          burst(e.x, e.y, 12, 1);
          state.score += 10;
          if (Math.random()<0.12) dropPowerup(e.x, e.y);
          audio.play(120, 0.1, 'triangle', 0.6);
          addShake(6, 0.15);
        }
        break;
      }
    }
  }

  if (boss) {
    for (let j=bullets.length-1;j>=0;j--) {
      const b = bullets[j];
      if (!b.friendly) continue;
      const rr = boss.r + b.r;
      const dx = b.x - boss.x, dy = b.y - boss.y;
      if (dx*dx+dy*dy <= rr*rr) {
        bullets.splice(j,1);
        damageBoss(1);
      }
    }
  }

  for (let i=eBullets.length-1;i>=0;i--) {
    const b = eBullets[i];
    const rr = (player.r + b.r) * 1.0;
    if (dist2(player, b) <= rr*rr) {
      eBullets.splice(i,1);
      hitPlayer();
    }
  }
  for (let i=enemies.length-1;i>=0;i--) {
    const e = enemies[i];
    const rr = (player.r + e.r) * 0.9;
    if (dist2(player, e) <= rr*rr) {
      enemies.splice(i,1);
      burst(e.x,e.y,350,0.6);
      hitPlayer();
    }
  }
  if (boss) {
    const rr = (player.r + boss.r) * 0.9;
    if (dist2(player, boss) <= rr*rr) {
      hitPlayer();
      addShake(10, 0.2);
    }
  }
  for (let i=powerups.length-1;i>=0;i--) {
    const p = powerups[i];
    const rr = (player.r + 9) * 1.0;
    if (dist2(player, p) <= rr*rr) {
      powerups.splice(i,1);
      collectPowerup(p.kind);
    }
  }

  scoreEl.textContent = state.score.toString();
  livesEl.textContent = player.lives.toString();
  powerEl.textContent = player.shieldTimer>0 ? 'SHIELD' : player.spreadLevel>0 && player.rapidTimer>0 ? 'SPREAD+RAPID' : player.spreadLevel>0 ? 'SPREAD' : player.rapidTimer>0 ? 'RAPID' : 'NORMAL';
}

function collectPowerup(kind) {
  if (kind==='rapid') player.rapidTimer = Math.max(player.rapidTimer, 6.0);
  if (kind==='spread') player.spreadLevel = Math.min(3, player.spreadLevel+1);
  if (kind==='shield') player.shieldTimer = Math.max(player.shieldTimer, 5.5);
  if (kind==='heal') player.lives = Math.min(5, player.lives+1);
  audio.play(1320, 0.08, 'square', 0.5);
}

function dropPowerup(x,y) {
  const r = Math.random();
  const kind = r<0.3? 'rapid' : r<0.6? 'spread' : r<0.85? 'shield' : 'heal';
  powerups.push({x,y,kind});
}

function hitPlayer() {
  if (player.shieldTimer>0) { player.shieldTimer = Math.max(0, player.shieldTimer-1.6); burst(player.x, player.y, 190, 0.7); audio.play(420, 0.06, 'sine', 0.4); return; }
  if (player.invuln>0) return;
  burst(player.x, player.y, 350, 1);
  player.invuln = 1.1;
  player.lives -= 1;
  audio.play(100, 0.12, 'triangle', 0.6);
  addShake(12, 0.25);
  addFlash(0.6);
  if (player.lives<=0) {
    player.alive = false;
    gameOver();
  }
}

function render() {
  ctx.fillStyle = '#070a18';
  ctx.fillRect(0,0,W,H);
  for (let s of stars) {
    const a = 0.35 + s.z*0.5;
    ctx.fillStyle = `hsla(${s.hue} 80% 70% / ${a})`;
    ctx.fillRect(s.x, s.y, s.s*(1+s.z*0.8), s.s*(1+s.z*0.8));
  }
  const ox = (shakeT>0? (rnd(-1,1)*shakeMag*shakeT*8) : 0);
  const oy = (shakeT>0? (rnd(-1,1)*shakeMag*shakeT*8) : 0);
  ctx.save();
  ctx.translate(ox, oy);
  for (let p of particles) {
    ctx.fillStyle = `hsla(${p.hue} 90% 60% / ${clamp(p.life*2*p.alpha,0,1)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  for (let b of bullets) drawBullet(b);
  for (let e of enemies) drawEnemy(e);
  for (let b of eBullets) drawEBullet(b);
  // draw trail behind player
  if (player.alive) {
    for (let i=0;i<pTrail.length;i++) {
      const t = pTrail[i];
      const a = clamp(t.life/0.4, 0, 1);
      ctx.save();
      ctx.globalAlpha = a*0.35;
      ctx.fillStyle = 'hsl(190 95% 60%)';
      ctx.beginPath();
      ctx.moveTo(t.x, t.y-18);
      ctx.lineTo(t.x-12, t.y+14);
      ctx.lineTo(t.x+12, t.y+14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    drawPlayer();
  }
  if (boss) drawBoss(boss);
  ctx.restore();

  if (flashAlpha>0) {
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.fillRect(0,0,W,H);
  }
}

let last = nowMs();
function loop() {
  requestAnimationFrame(loop);
  if (state.phase!=='playing' || state.paused) return;
  const t = nowMs();
  let dt = (t - last)/1000;
  last = t;
  dt = Math.min(dt, 0.033);
  update(dt);
  render();
}
loop();

function bootRender() {
  ctx.fillStyle = '#070a18';
  ctx.fillRect(0,0,W,H);
  for (let s of stars) {
    const a = 0.35 + s.z*0.5;
    ctx.fillStyle = `hsla(${s.hue} 80% 70% / ${a})`;
    ctx.fillRect(s.x, s.y, s.s*(1+s.z*0.8), s.s*(1+s.z*0.8));
  }
}
bootRender();

document.addEventListener('visibilitychange', ()=>{
  if (document.hidden) { if (state.phase==='playing') togglePause(); }
});

window.addEventListener('blur', ()=>{ if (state.phase==='playing') togglePause(); });

window.addEventListener('resize', ()=>{ initStars(); if (state.phase==='playing') render(); else bootRender(); });

overlay.classList.add('show');
refreshScoresUI();

// ---------- Boss ----------
function spawnBoss() {
  boss = {
    x: W/2, y: -120, vx: 0, vy: 120, r: 40,
    hp: 120, hpMax: 120, phase: 1, t: 0, fire: 0, entry: true
  };
  bossHP.classList.remove('hide');
  updateBossBar();
}

function updateBoss(b, dt) {
  b.t += dt;
  if (b.entry) {
    b.y += b.vy * dt;
    if (b.y >= 110) { b.y = 110; b.entry = false; b.vx = 80; }
    return;
  }
  b.x += b.vx * dt;
  if (b.x < 60 || b.x > W-60) b.vx *= -1;

  b.fire -= dt;
  if (b.phase === 1) {
    if (b.fire<=0) { b.fire = 1.0; patternRing(b, 14, 180 + state.t*40, 180); }
  } else if (b.phase === 2) {
    if (b.fire<=0) { b.fire = 0.65; patternSpiral(b, 14, 240); patternAimedSpread(b, 5, 260); }
  } else {
    if (b.fire<=0) { b.fire = 0.5; patternSpiral(b, 18, 280, 0.35); patternMinions(); }
  }
}

function drawBoss(b) {
  // Core
  const g = ctx.createLinearGradient(b.x, b.y-40, b.x, b.y+40);
  g.addColorStop(0, 'hsl(345 85% 62%)');
  g.addColorStop(1, 'hsl(20 85% 58%)');
  ctx.save();
  ctx.shadowColor = 'rgba(255,120,120,0.6)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y-44);
  ctx.lineTo(b.x-34, b.y+26);
  ctx.lineTo(b.x, b.y+40);
  ctx.lineTo(b.x+34, b.y+26);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function damageBoss(dmg) {
  if (!boss) return;
  boss.hp -= dmg;
  addShake(8,0.15); addFlash(0.35);
  burst(boss.x, boss.y, 12, 0.2);
  updateBossBar();
  if (boss.hp <= 0) {
    const p = boss.phase;
    if (p < 3) {
      // 次フェーズへ
      boss.phase = p+1;
      boss.hpMax = p===1? 160 : 200;
      boss.hp = boss.hpMax;
      boss.fire = 0.4;
      burst(boss.x, boss.y, 12, 1.5);
      addShake(16, 0.35);
      updateBossBar();
    } else {
      // 撃破
      burst(boss.x, boss.y, 12, 2.2);
      addShake(22, 0.6); addFlash(0.8);
      state.score += 500;
      for (let i=0;i<4;i++) dropPowerup(boss.x + rnd(-30,30), boss.y + rnd(-10,10));
      boss = null;
      bossHP.classList.add('hide');
      updateBossBar();
      state.nextBossAt += 250; // 次のボス閾値を上げる
    }
  }
}

function patternRing(b, count, baseAngle=0, speed=200) {
  for (let i=0;i<count;i++) {
    const ang = baseAngle*Math.PI/180 + i*(Math.PI*2/count);
    addEnemyBullet(b.x, b.y, ang, speed, 1);
  }
  audio.play(220, 0.1, 'sawtooth', 0.4);
}
function patternSpiral(b, count, speed=240, rate=0.5) {
  for (let i=0;i<count;i++) {
    const ang = (state.t*rate + i/count) * Math.PI*2;
    addEnemyBullet(b.x, b.y, ang, speed, 1);
  }
  audio.play(260, 0.08, 'sawtooth', 0.35);
}
function patternAimedSpread(b, n=5, speed=260) {
  const ang = Math.atan2(player.y-b.y, player.x-b.x);
  const spread = 0.35;
  for (let i=0;i<n;i++) {
    const t = n===1?0:(i/(n-1)-0.5);
    addEnemyBullet(b.x, b.y, ang + t*spread, speed + Math.abs(t)*80, 1);
  }
}
function patternMinions() {
  if (Math.random()<0.8) return;
  const n = 3 + rndi(0,2);
  for (let i=0;i<n;i++) addEnemy(makeEnemy('drone', rnd(60, W-60), -40-i*20, 160+spawner.level*12, 0, 1));
}

function updateBossBar() {
  if (!boss) { bossFill.style.width = '0%'; return; }
  const w = Math.max(0, Math.min(1, boss.hp/boss.hpMax))*100;
  bossFill.style.width = w.toFixed(1)+'%';
}

// ---------- High scores ----------
const store = {
  loadScores() { try { return JSON.parse(localStorage.getItem('starSurgeScores')||'[]'); } catch { return []; } },
  saveScores(arr) { try { localStorage.setItem('starSurgeScores', JSON.stringify(arr)); } catch {} },
  loadName() { try { return localStorage.getItem('starSurgeName')||''; } catch { return ''; } },
  saveName(n) { try { localStorage.setItem('starSurgeName', n); } catch {} },
};

function refreshScoresUI() {
  const list = store.loadScores().sort((a,b)=>b.score-a.score).slice(0,10);
  hiscoreList.innerHTML = '';
  list.forEach((r, idx)=>{
    const li = document.createElement('li');
    const name = document.createElement('span'); name.className='name'; name.textContent = `${idx+1}. ${r.name}`;
    const score = document.createElement('span'); score.className='score'; score.textContent = r.score;
    li.appendChild(name); li.appendChild(score); hiscoreList.appendChild(li);
  });
}

function maybeQualifyAndPrompt() {
  const list = store.loadScores().sort((a,b)=>b.score-a.score);
  const min = list.length<10 ? 0 : (list[list.length-1]?.score||0);
  const qualify = state.score > min || list.length<10;
  const prev = store.loadName();
  if (qualify) {
    nameInput.value = prev || '';
    document.getElementById('entry').classList.remove('hide');
    saveScoreBtn.disabled = false;
  } else {
    document.getElementById('entry').classList.add('hide');
  }
}

saveScoreBtn?.addEventListener('click', ()=>{
  const name = (nameInput.value||'').trim();
  if (name.length<3 || name.length>12) { nameInput.focus(); return; }
  store.saveName(name);
  const list = store.loadScores();
  list.push({ name, score: state.score, date: Date.now() });
  list.sort((a,b)=>b.score-a.score);
  while (list.length>10) list.pop();
  store.saveScores(list);
  refreshScoresUI();
  saveScoreBtn.disabled = true;
});
