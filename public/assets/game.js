(function(){
  'use strict';
  // Tile legend: # wall, . floor, s shadow, @ player, E exit, ^ v < > guard (direction)
  const LEVELS = [
    {
      name:'Prologue',
      map:[
        '############',
        '#@..s.#..sE#',
        '#.##s.#..#.#',
        '#...s^..s.#.#',
        '####..#####.#',
        '#..s.#..s.#.#',
        '#.##.#.##.#.#',
        '#...s#....#.#',
        '#############',
      ],
      rotate:false
    },
    {
      name:'Pivot Watch',
      map:[
        '###############',
        '#@..s.#...s...#',
        '#.##s.#..###..#',
        '#..#..#..#..s.#',
        '#..#..#..#.^..#',
        '#..#..#..#..s.#',
        '#..##.#######.#',
        '#..s.#..s..E..#',
        '###############',
      ],
      rotate:true
    },
    {
      name:'Two Cones',
      map:[
        '################',
        '#@..s#..s..E..#',
        '#.##.#.#######.#',
        '#..s.#..s.#....#',
        '####.####.#.####',
        '#..s.#..^.#..s.#',
        '#.##.#....#.##.#',
        '#..s.#.v..#..s.#',
        '################',
      ],
      rotate:true
    },
    {
      name:'Corridors',
      map:[
        '################',
        '#@..s#..s.#..s#',
        '#.##.#.##.#.#.#',
        '#..s.#.>..#.#.#',
        '####.####.#.#.#',
        '#..s.#..s.#.#E#',
        '#.##.#.##.#.#.#',
        '#..s.#..s.#..s#',
        '################',
      ],
      rotate:true
    },
    {
      name:'Key Rites',
      map:[
        '################',
        '#@..s.#..k..s..#',
        '#.##s.#.####...#',
        '#..#..#..#.....#',
        '#..#..#..#.D..#',
        '#..#..#..#.....#',
        '#..##.#####.####',
        '#..s.#..s..E...#',
        '################',
      ],
      rotate:true
    },
    {
      name:'Crate Curtain',
      map:[
        '################',
        '#@...o..s..k...#',
        '#.####.####.####',
        '#....#..o.#....#',
        '#.##.#.##.#.#..#',
        '#..D.#....#E...#',
        '#.####.####.####',
        '#...k#..s.#....#',
        '################',
      ],
      rotate:true
    },
    {
      name:'Shadow Veins',
      map:[
        '################',
        '#@s..#..s..k...#',
        '#.##.#.##.###.##',
        '#..s.#..s.#....#',
        '#.####.##.####.#',
        '#....#..o.#.D..#',
        '#.##.#.##.#.#E#',
        '#....#..s.#....#',
        '################',
      ],
      rotate:true
    }
  ];

  // State
  const cv = document.getElementById('game');
  const cx = cv.getContext('2d');
  const hudLevel = document.getElementById('hud-level');
  const hudLevels = document.getElementById('hud-levels');
  const hudTime = document.getElementById('hud-time');
  const hudBest = document.getElementById('hud-best');
  const hudKeys = document.getElementById('hud-keys');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const btnRestart = document.getElementById('btn-restart');
  const btnHelp = document.getElementById('btn-help');
  const btnSound = document.getElementById('btn-sound');
  const dlgHelp = document.getElementById('dlg-help');
  const pad = document.getElementById('touch');

  hudLevels.textContent = LEVELS.length;

  let levelIndex = 0;
  let grid = []; let W=0,H=0; let player={x:0,y:0}; let exit={x:0,y:0};
  let shadow = new Set();
  let guards=[]; // {x,y,dir,rotate}
  let crates = new Set();
  let doors = new Set();
  let keys = new Set();
  let keysCount = 0;
  let tile = 48; let margin = 24; const DPR = Math.max(1, Math.floor(window.devicePixelRatio||1));
  let last = 0; let elapsed=0; let running=true; let sounds=true;
  // presentation/feel
  let pDraw = {x:0,y:0}, moving=false, moveT=0, moveDur=0.12, from={x:0,y:0}, to={x:0,y:0};
  let particles=[]; // {x,y,vx,vy,t,life}
  let shakeAmp=0, flashT=0; // detection feedback
  // stamina / dash
  let stamina=1.0; const STAM_USE=0.6; const STAM_REC=0.25; let pending=[]; // queue of {x,y,dur}
  // heartbeat
  let hbTime=0, hbBeat=0; let danger=0;
  // input double-tap for dash
  let lastDir=''; let lastDirAt=0;

  const KEY='veilstep-progress-v1';
  function load(){ try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return{}} }
  function save(p){ try{localStorage.setItem(KEY, JSON.stringify(p));}catch{} }

  function fmtTime(ms){ const s=Math.floor(ms/1000); const m=s/60|0; const ss=(s%60+'').padStart(2,'0'); return `${m}:${ss}`; }

  function parseLevel(idx){
    const L = LEVELS[idx];
    const rows=L.map; H=rows.length; W=rows[0].length; grid=new Array(W*H).fill(0);
    guards=[]; crates.clear(); doors.clear(); keys.clear(); shadow.clear(); keysCount=0;
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const ch=rows[y][x]; const i=y*W+x;
        if(ch==='#') grid[i]=1; else grid[i]=0;
        if(ch==='s') { grid[i]=0; shadow.add(i); }
        if(ch==='@'){ player={x,y}; }
        if(ch==='E'){ exit={x,y}; }
        if(ch==='o'){ crates.add(i); }
        if(ch==='D'){ doors.add(i); }
        if(ch==='k'){ keys.add(i); }
        if('^v<>'.includes(ch)){ guards.push({x,y,dir:ch,rotate:L.rotate}); }
      }
    }
    fitCanvas();
    elapsed=0; moving=false; particles.length=0; pending.length=0; running=true; shakeAmp=0; flashT=0; stamina=1.0; hbTime=0; hbBeat=0; danger=0;
    hudLevel.textContent = idx+1;
    const prog=load(); const best = prog.best?.[idx]; hudBest.textContent = best? fmtTime(best):'—'; hudKeys.textContent = keysCount;
    pDraw={x:player.x, y:player.y};
  }

  function idx(x,y){ return y*W+x; }
  function isWall(x,y){ return grid[idx(x,y)]===1; }
  function isDoor(x,y){ return doors.has(idx(x,y)); }
  function isCrate(x,y){ return crates.has(idx(x,y)); }
  function isOpaque(x,y){ return isWall(x,y) || isDoor(x,y) || isCrate(x,y); }
  function isPassable(x,y){ return !isWall(x,y) && !isDoor(x,y) && !isCrate(x,y); }

  function fitCanvas(){
    const availW = cv.parentElement.clientWidth || 960; const availH = (cv.parentElement.clientHeight||720)-80;
    const tileW=(availW-margin*2)/W; const tileH=(availH-margin*2)/H; tile = Math.max(24, Math.min(56, Math.floor(Math.min(tileW,tileH))));
    const width = Math.ceil(W*tile+margin*2); const height=Math.ceil(H*tile+margin*2);
    cv.width = Math.floor(width*DPR); cv.height=Math.floor(height*DPR);
    cv.style.width=width+'px'; cv.style.height=height+'px';
    cx.setTransform(DPR,0,0,DPR,0,0);
  }

  function move(dx,dy){
    if(moving || pending.length) return;
    const nx=player.x+dx, ny=player.y+dy; if(nx<0||ny<0||nx>=W||ny>=H) return;
    if(isWall(nx,ny)) return;
    const ni = idx(nx,ny);
    // door handling
    if(doors.has(ni)){
      if(keysCount>0){ doors.delete(ni); keysCount--; hudKeys.textContent = keysCount; play('unlock'); }
      else return;
    }
    // crate push
    if(crates.has(ni)){
      const bx=nx+dx, by=ny+dy; if(bx<0||by<0||bx>=W||by>=H) return; if(!isPassable(bx,by)) return;
      crates.delete(ni); crates.add(idx(bx,by)); play('push');
    }
    from={x:player.x, y:player.y}; to={x:nx, y:ny}; moveT=0; moving=true; play('step');
    spawnDust(from.x, from.y, dx, dy);
  }

  function tryDash(dx,dy){
    if(moving) return false;
    if(stamina < STAM_USE) return false;
    // plan up to 2 steps
    let x=player.x, y=player.y; const path=[];
    for(let i=0;i<2;i++){
      const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) break; if(grid[ny*W+nx]===1) break; path.push({x:nx,y:ny}); x=nx; y=ny;
    }
    if(path.length===0) return false;
    stamina = Math.max(0, stamina - STAM_USE);
    // enqueue with faster duration
    pending = path.map((p,idx)=>({x:p.x,y:p.y,dur:Math.max(0.06, moveDur*0.7)}));
    // dash streaks
    spawnDash(player.x, player.y, dx, dy);
    if(!moving) startNext(); play('dash');
    return true;
  }

  function startNext(){
    if(pending.length===0){ moving=false; return; }
    const step = pending.shift(); from={x:player.x,y:player.y}; to={x:step.x,y:step.y}; moveT=0; moveDur=step.dur; moving=true;
  }

  function dirToVec(d){ if(d==='^')return{dx:0,dy:-1, px:1,py:0}; if(d==='v')return{dx:0,dy:1, px:-1,py:0}; if(d==='<')return{dx:-1,dy:0, px:0,py:-1}; return{dx:1,dy:0, px:0,py:1}; }
  function rotateDir(d){ return d==='^'?'>': d==='>'?'v': d==='v'?'<':'^'; }

  function seesPlayer(g){
    // Wedge-shaped FOV with occlusion per lateral ray
    const v = dirToVec(g.dir);
    const baseRange = 8;
    let range = baseRange;
    // modifiers: crouch/breath/shadow reduce range
    if(crouch) range -= 2;
    if(hold) range -= 2;
    if(shadow.has(player.y*W+player.x)) range -= 1;
    range = Math.max(3, range);
    const maxLateralFactor = 0.5; // half tile growth per step
    for(let d=1; d<=range; d++){
      const lat = Math.floor(d*maxLateralFactor);
      for(let o=-lat; o<=lat; o++){
        const x = g.x + v.dx*d + v.px*o;
        const y = g.y + v.dy*d + v.py*o;
        if(x<0||y<0||x>=W||y>=H) continue;
        // ray occlusion check: march along center line toward this cell
        let rx=g.x, ry=g.y; let blocked=false; const steps=Math.max(Math.abs(x-g.x),Math.abs(y-g.y)); for(let s=1;s<=steps;s++){
          rx = g.x + Math.round((x-g.x)*s/steps);
          ry = g.y + Math.round((y-g.y)*s/steps);
          if(isOpaque(rx,ry)){ blocked=true; break; }
        }
        if(blocked) continue;
        if(x===player.x && y===player.y) return true;
      }
    }
    return false;
  }

  function checkState(){
    // win
    if(player.x===exit.x && player.y===exit.y){
      running=false; play('win');
      const prog=load(); prog.last=levelIndex; prog.best=prog.best||{}; const best=prog.best[levelIndex]; const t=elapsed; prog.best[levelIndex] = best? Math.min(best,t): t; save(prog);
      setTimeout(()=>{ if(levelIndex<LEVELS.length-1) loadLevel(levelIndex+1); else toast('全レベルクリア！'); }, 450);
    }
  }

  function update(dt){
    // time scaling: danger slow-mo and focus
    const ts = (danger>0.7?0.85:1) * (hold?0.92:1);
    dt *= ts;
    elapsed += dt;
    // movement tween
    if(moving){ moveT += dt; const t = Math.min(1, moveT/moveDur); const e = easeOutCubic(t); pDraw.x = from.x + (to.x-from.x)*e; pDraw.y = from.y + (to.y-from.y)*e; if(t>=1){ moving=false; player={x:to.x,y:to.y}; checkState(); if(pending.length) startNext(); } }
    // guards rotate slowly
    guards.forEach(g=>{ if(g.rotate){ const period=1.3; g._t=(g._t||0)+dt; if(g._t>period){ g._t=0; g.dir=rotateDir(g.dir);} } });
    // detection
    for(const g of guards){ if(seesPlayer(g)){ feedbackFail(); break; } }
    // stamina regen/consumption
    if(hold){ stamina = Math.max(0, stamina - (STAM_REC*1.4)*dt); if(stamina===0) hold=false; }
    else stamina = Math.min(1, stamina + STAM_REC*dt);
    // particles
    particles = particles.filter(p=>{ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; return p.t<p.life; });
    // feedback decay
    shakeAmp *= Math.pow(0.001, dt); // fast decay
    flashT = Math.max(0, flashT - dt);
    // heartbeat
    danger = computeDanger(); hbTime += dt * (1 + danger*2.0); // faster with danger
    if((hbBeat|0) !== (hbTime%1*2|0) && danger>0.15){ hbBeat = (hbTime%1*2|0); play('heart'); }
  }

  function resetLevel(){ const idx=levelIndex; parseLevel(idx); }

  function feedbackFail(){ play('fail'); shakeAmp = Math.max(shakeAmp, 10); flashT = 0.2; resetLevel(); }

  function draw(){
    cx.clearRect(0,0,cv.width,cv.height);
    // screenshake + sway
    cx.save(); let ox=0, oy=0; if(shakeAmp>0){ ox+=(Math.random()*2-1)*shakeAmp; oy+=(Math.random()*2-1)*shakeAmp; }
    const sway = moving? Math.sin(elapsed*10)*2 : 0; ox+=sway; cx.translate(ox,oy);
    // background
    const g=cx.createRadialGradient(0,0, W*tile, 0,0, W*tile*1.2); g.addColorStop(0,'#0c1531'); g.addColorStop(1,'#080e22');
    cx.fillStyle=g; cx.fillRect(0,0,cv.width,cv.height);
    // tiles
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const sx=margin+x*tile, sy=margin+y*tile;
        cx.fillStyle = (x+y)%2?'#0f1b3b':'#0e1734';
        cx.fillRect(sx+2, sy+2, tile-4, tile-4);
        const i=y*W+x;
        if(grid[i]===1){
          // wall block
          const gr=cx.createLinearGradient(sx,sy,sx,sy+tile);
          gr.addColorStop(0,'#1f2f68'); gr.addColorStop(1,'#101a3d');
          cx.fillStyle=gr; cx.fillRect(sx+2, sy+2, tile-4, tile-4);
        } else if(doors.has(i)){
          cx.fillStyle = '#2a254a'; cx.fillRect(sx+3, sy+3, tile-6, tile-6); cx.strokeStyle='#8b7bff'; cx.lineWidth=2; cx.strokeRect(sx+3.5, sy+3.5, tile-7, tile-7);
        } else if(keys.has(i)){
          cx.fillStyle = '#ffd66b'; cx.beginPath(); cx.arc(sx+tile*0.5, sy+tile*0.45, tile*0.12, 0, Math.PI*2); cx.fill(); cx.fillRect(sx+tile*0.5, sy+tile*0.45, tile*0.18, 3);
        } else if(crates.has(i)){
          const gr=cx.createLinearGradient(sx,sy,sx+tile,sy+tile); gr.addColorStop(0,'#8b6a3a'); gr.addColorStop(1,'#5a3a1a'); cx.fillStyle=gr; cx.fillRect(sx+4, sy+4, tile-8, tile-8);
        }
        if(shadow.has(i)) { cx.fillStyle='rgba(0,0,0,0.18)'; cx.fillRect(sx+2, sy+2, tile-4, tile-4); }
      }
    }
    // cones with falloff and flicker
    const flick = 0.85 + Math.sin(performance.now()*0.004)*0.05;
    guards.forEach(gd=>{
      const v=dirToVec(gd.dir); const base=8; let range=base; if(crouch) range-=2; if(hold) range-=2; range=Math.max(3,range);
      for(let d=1; d<=range; d++){
        const lat=Math.floor(d*0.5);
        for(let o=-lat; o<=lat; o++){
          const x=gd.x+v.dx*d+v.px*o, y=gd.y+v.dy*d+v.py*o; if(x<0||y<0||x>=W||y>=H) continue; if(isOpaque(x,y)) continue;
          const a = Math.max(0, (shadow.has(y*W+x)?0.15:0.35) * flick * (1 - (d-1)/range));
          const sx=margin+x*tile, sy=margin+y*tile; cx.fillStyle=`rgba(255,223,122,${a})`; cx.fillRect(sx+2, sy+2, tile-4, tile-4);
        }
      }
    });
    // exit
    let sx=margin+exit.x*tile, sy=margin+exit.y*tile; cx.fillStyle='#0f2e1f'; cx.fillRect(sx+4, sy+4, tile-8, tile-8); cx.strokeStyle='#9cffb0'; cx.lineWidth=2; cx.strokeRect(sx+4.5, sy+4.5, tile-9, tile-9);
    // guards
    guards.forEach(gd=>{
      const gx=margin+gd.x*tile+tile/2, gy=margin+gd.y*tile+tile/2;
      cx.beginPath(); cx.arc(gx,gy,tile*0.28,0,Math.PI*2); cx.fillStyle='#ffd66b'; cx.fill();
      // nose to indicate facing
      const v=dirToVec(gd.dir); cx.beginPath(); cx.moveTo(gx,gy); cx.lineTo(gx+v.dx*tile*0.28, gy+v.dy*tile*0.28); cx.strokeStyle='#402f12'; cx.lineWidth=3; cx.stroke();
    });
    // player (smooth) + shadow tint
    sx=margin+pDraw.x*tile; sy=margin+pDraw.y*tile; const onShadow = shadow.has((Math.round(pDraw.y))*W + (Math.round(pDraw.x)));
    cx.fillStyle= onShadow? '#7bcfe8' : '#8be6ff'; cx.fillRect(sx+6, sy+6, tile-12, tile-12);
    // collectables
    const pi = Math.round(player.y)*W + Math.round(player.x);
    if(keys.has(pi)){ keys.delete(pi); keysCount++; hudKeys.textContent = keysCount; play('key'); }
    // particles
    particles.forEach(p=>{ const px=margin+p.x*tile, py=margin+p.y*tile; const r=Math.max(1, 3*(1-p.t/p.life)); cx.fillStyle='rgba(200,230,255,0.6)'; cx.beginPath(); cx.arc(px,py,r,0,Math.PI*2); cx.fill(); });
    // HUD
    hudTime.textContent = fmtTime(elapsed*1000);
    // stamina bar (dash/breath)
    const bw = Math.max(0, Math.floor((W*tile)*0.35)); const bh=8; const bx=margin+6, by=margin+6;
    cx.fillStyle='rgba(255,255,255,0.12)'; cx.fillRect(bx,by,bw,bh); cx.fillStyle= hold? '#ffaeae' : '#8be6ff'; cx.fillRect(bx,by,bw*stamina,bh); cx.strokeStyle='rgba(255,255,255,0.22)'; cx.strokeRect(bx+0.5,by+0.5,bw-1,bh-1);
    // flash overlay
    if(flashT>0){ cx.fillStyle=`rgba(200,40,40,${flashT*3})`; cx.fillRect(0,0,cv.width,cv.height); }
    // vignette/heartbeat
    const pulse = danger * (0.25 + 0.15*Math.sin(elapsed*6*(1+danger))) + (hold?0.08:0);
    const vg = cx.createRadialGradient(cv.width/2, cv.height/2, Math.min(cv.width,cv.height)*0.4, cv.width/2, cv.height/2, Math.max(cv.width,cv.height)*0.7);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(0,0,0,${0.25+pulse})`); cx.fillStyle=vg; cx.fillRect(0,0,cv.width,cv.height);
    // CRT scanlines
    crtOverlay(cx, cv.width, cv.height);
    cx.restore();
  }

  function loop(ts){ const t = ts/1000; const dt = last? t-last : 0; last = t; update(dt); draw(); requestAnimationFrame(loop); }

  function loadLevel(i){ levelIndex=i; parseLevel(i); }

  // Input
  let hold=false, crouch=false;
  function key(e){
    const k=e.key.toLowerCase(); let dir='', dx=0, dy=0;
    if(k==='arrowup'||k==='w'){ e.preventDefault(); dir='up'; dx=0; dy=-1; }
    else if(k==='arrowdown'||k==='s'){ e.preventDefault(); dir='down'; dx=0; dy=1; }
    else if(k==='arrowleft'||k==='a'){ e.preventDefault(); dir='left'; dx=-1; dy=0; }
    else if(k==='arrowright'||k==='d'){ e.preventDefault(); dir='right'; dx=1; dy=0; }
    if(dir){ const now=performance.now(); const isDouble=(dir===lastDir && now-lastDirAt<260) || e.shiftKey; lastDir=dir; lastDirAt=now; if(isDouble){ if(!tryDash(dx,dy)) move(dx,dy); } else { move(dx,dy); } return; }
    else if(k==='r'){ parseLevel(levelIndex); }
    else if(k==='c'){ crouch = !crouch; moveDur = crouch? 0.18 : 0.12; }
    else if(k===' '){ hold = true; }
    else if(k==='.' ){ if(levelIndex<LEVELS.length-1) loadLevel(levelIndex+1); }
    else if(k===',' ){ if(levelIndex>0) loadLevel(levelIndex-1); }
  }
  window.addEventListener('keyup', (e)=>{ if(e.key===' ') hold=false; });

  btnPrev.addEventListener('click', ()=>{ if(levelIndex>0) loadLevel(levelIndex-1); });
  btnNext.addEventListener('click', ()=>{ if(levelIndex<LEVELS.length-1) loadLevel(levelIndex+1); });
  btnRestart.addEventListener('click', ()=>parseLevel(levelIndex));
  btnHelp.addEventListener('click', ()=>dlgHelp.showModal());
  btnSound.addEventListener('click', ()=>{ sounds=!sounds; btnSound.textContent=sounds?'🔊':'🔇'; });
  window.addEventListener('keydown', key);

  let lastTouchDir=''; let lastTouchAt=0;
  pad.addEventListener('click', (e)=>{ const dir=e.target.getAttribute('data-dir'); if(!dir) return; const now=performance.now(); const isDouble=(dir===lastTouchDir && now-lastTouchAt<260); lastTouchDir=dir; lastTouchAt=now; const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir]; if(isDouble){ if(!tryDash(d[0],d[1])) move(d[0],d[1]); } else { move(d[0],d[1]); } });

  function play(type){ if(!sounds) return; try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.connect(g); g.connect(ctx.destination); const t=ctx.currentTime; let f=440,d=.06; if(type==='win'){f=760;d=.12} else if(type==='fail'){f=180;d=.09} else if(type==='step'){f=520;d=.035} else if(type==='dash'){f=660;d=.05} else if(type==='heart'){f=160;d=.03} else if(type==='unlock'){f=480;d=.08} else if(type==='push'){f=300;d=.06} else if(type==='key'){f=840;d=.06} o.type = (type==='heart'?'sine':'triangle'); o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(type==='heart'?0.08:0.12,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.start(t); o.stop(t+d); }catch{} }

  function easeOutCubic(x){ return 1-Math.pow(1-x,3); }
  function spawnDust(x,y,dx,dy){ for(let i=0;i<4;i++){ const vx=(Math.random()*2-1)*0.25 + (dx?dx:0)*0.18; const vy=(Math.random()*2-1)*0.25 + (dy?dy:0)*0.18; particles.push({x:x+0.5, y:y+0.5, vx, vy, t:0, life:0.28}); } // footprint
    particles.push({x:x+0.5 + (Math.random()*.2-.1), y:y+0.8 + (Math.random()*.2-.1), vx:0, vy:0, t:0, life:0.6}); }
  function spawnDash(x,y,dx,dy){ for(let i=0;i<6;i++){ particles.push({x:x+0.5 - dx*0.2*i, y:y+0.5 - dy*0.2*i, vx: -dx*1.5, vy: -dy*1.5, t:0, life:0.2}); } }
  function crtOverlay(ctx,w,h){ ctx.save(); ctx.globalAlpha=0.07; ctx.fillStyle='#000'; for(let y=0;y<h; y+=3){ ctx.fillRect(0,y,w,1); } ctx.restore(); }
  function computeDanger(){
    let d=0;
    for(const gd of guards){
      const v=dirToVec(gd.dir); // straight line ahead
      let x=gd.x+v.dx, y=gd.y+v.dy; let dist=0;
      while(true){ dist++; if(x<0||y<0||x>=W||y>=H) break; if(isOpaque(x,y)) break; if(x===player.x && y===player.y){ d=Math.max(d, Math.max(0, (3-dist+1)/3)); break; } x+=v.dx; y+=v.dy; if(dist>6) break; }
      // proximity
      const man = Math.abs(gd.x-player.x)+Math.abs(gd.y-player.y); if(man<=2) d=Math.max(d, 0.3);
    }
    return Math.min(1, d);
  }

  function toast(text){ const el=document.createElement('div'); el.textContent=text; el.style.cssText='position:absolute;left:50%;top:12px;transform:translateX(-50%);padding:.4rem .7rem;border-radius:.5rem;background:#1b2c57;color:#e9f1ff;border:1px solid #2a407a;box-shadow:0 6px 20px rgba(0,0,0,.3);z-index:20;'; cv.parentElement.appendChild(el); setTimeout(()=>{ el.style.transition='opacity .5s ease, transform .5s ease'; el.style.opacity='0'; el.style.transform='translateX(-50%) translateY(-6px)'; }, 1500); setTimeout(()=>el.remove(), 2100); }

  // boot
  (function init(){
    const prog=load(); if(Number.isInteger(prog.last)) levelIndex=Math.max(0, Math.min(LEVELS.length-1, prog.last));
    loadLevel(levelIndex);
    fitCanvas(); window.addEventListener('resize', fitCanvas);
    requestAnimationFrame(loop);
  })();
})();
