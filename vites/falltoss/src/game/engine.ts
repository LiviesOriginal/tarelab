import {
  LW,
  LH,
  GRAV,
  MAXDRAG,
  MAXPOWER,
  ANCHOR,
  MUG,
  MUG_PLACEMENT,
  COLORS,
  MAKE_WORDS,
  pick,
} from './constants';
import type { EngineCallbacks, GameConfig, GameEngine } from './types';

type Phase = 'idle' | 'aim' | 'fly' | 'resolve' | 'over';

interface Ball {
  x: number; y: number; vx: number; vy: number; r: number; rot: number; spin: number;
}
interface Particle {
  x: number; y: number; r: number; life: number; max: number; kind: string; vx?: number; vy?: number;
}
interface Splash { x: number; y: number; life: number; max: number; }
interface Steam { x: number; y: number; vy: number; drift: number; r: number; life: number; max: number; o: number; }
interface Puff { x: number; y: number; r: number; sp: number; o: number; }

export function createEngine(canvas: HTMLCanvasElement, cbs: EngineCallbacks): GameEngine {
  const ctx = canvas.getContext('2d')!;
  let scale = 1;

  // ---- mug image (public/mug.png); placeholder until it loads ----
  const mugImg = new Image();
  let mugReady = false;
  mugImg.onload = () => {
    mugReady = mugImg.naturalWidth > 0;
  };
  mugImg.onerror = () => {
    mugReady = false;
  };
  mugImg.src = '/vites/falltoss/mug.png';

  const mug = { x: MUG.cx, phase: 0 };

  const st = {
    phase: 'idle' as Phase,
    hard: false,
    target: 5,
    timeLimit: 25,
    timeLeft: 25,
    score: 0,
    timerRunning: false,
    finishTime: 0,
    paused: false,
    running: false,
    lastTickSec: -1,
  };

  let ball: Ball | null = null;
  let aiming = false;
  const dragCur = { x: 0, y: 0 };
  let particles: Particle[] = [];
  let splashes: Splash[] = [];
  const steam: Steam[] = [];
  const bgpuffs: Puff[] = [];
  let resolveTimer = 0;
  let finishTimeout: number | null = null;

  for (let i = 0; i < 7; i++) {
    bgpuffs.push({
      x: Math.random() * LW,
      y: Math.random() * LH,
      r: 14 + Math.random() * 26,
      sp: 6 + Math.random() * 10,
      o: 0.03 + Math.random() * 0.04,
    });
  }
  function newSteam(spread: boolean): Steam {
    return {
      x: mug.x + (Math.random() * 40 - 20),
      y: MUG.rimY - (spread ? Math.random() * 80 : 0),
      vy: -14 - Math.random() * 10,
      drift: Math.random() * 10 - 5,
      r: 6 + Math.random() * 8,
      life: 0,
      max: 2.2 + Math.random() * 1.6,
      o: 0,
    };
  }
  for (let i = 0; i < 10; i++) steam.push(newSteam(true));

  // ---- canvas sizing ----
  function resize(): void {
    const r = canvas.getBoundingClientRect();
    if (r.width === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    scale = canvas.width / LW;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener('resize', resize);

  // ---- input ----
  function pointerLogical(e: PointerEvent): { x: number; y: number } {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * LW,
      y: ((e.clientY - r.top) / r.height) * LH,
    };
  }
  function down(e: PointerEvent): void {
    if (st.phase !== 'aim' || st.paused) return;
    aiming = true;
    const p = pointerLogical(e);
    dragCur.x = p.x;
    dragCur.y = p.y;
    e.preventDefault();
  }
  function move(e: PointerEvent): void {
    if (!aiming) return;
    const p = pointerLogical(e);
    dragCur.x = p.x;
    dragCur.y = p.y;
    e.preventDefault();
  }
  function up(e: PointerEvent): void {
    if (!aiming) return;
    aiming = false;
    const pull = { x: ANCHOR.x - dragCur.x, y: ANCHOR.y - dragCur.y };
    const len = Math.hypot(pull.x, pull.y);
    if (len < 18) return;
    const clamped = Math.min(len, MAXDRAG);
    const nx = pull.x / len;
    const ny = pull.y / len;
    const power = (clamped / MAXDRAG) * MAXPOWER;
    ball = {
      x: ANCHOR.x,
      y: ANCHOR.y,
      vx: nx * power,
      vy: ny * power,
      r: 33,
      rot: 0,
      spin: (nx > 0 ? -1 : 1) * (3 + Math.random() * 3),
    };
    st.timerRunning = true;
    st.phase = 'fly';
    e.preventDefault();
  }
  canvas.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);

  // ---- status helpers ----
  function emitAimStatus(): void {
    cbs.onStatus(st.timerRunning ? `${st.target - st.score} to go!` : 'Toss to start the clock ⏱');
  }

  // ---- round flow ----
  function scoreMake(): void {
    st.score += 1;
    cbs.onScore(st.score);
    splashes.push({ x: mug.x, y: MUG.rimY, life: 0, max: 0.6 });
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
      const sp = 120 + Math.random() * 160;
      particles.push({
        x: mug.x, y: MUG.rimY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        r: 5 + Math.random() * 5, life: 0, max: 0.6, kind: 'splash',
      });
    }
    ball = null;
    const left = st.target - st.score;
    cbs.onStatus(left > 0 ? `${pick(MAKE_WORDS)} ${left} to go` : pick(MAKE_WORDS));
    if (st.score >= st.target) {
      st.finishTime = Math.round((st.timeLimit - st.timeLeft) * 10) / 10;
      st.timerRunning = false;
      st.phase = 'over';
      scheduleFinish(true, 700);
      return;
    }
    st.phase = 'resolve';
    resolveTimer = 0.55;
  }

  function endTurn(): void {
    cbs.onStatus('missed! keep tossing');
    ball = null;
    st.phase = 'resolve';
    resolveTimer = 0.35;
  }

  function nextAim(): void {
    if (st.phase === 'over') return;
    st.phase = 'aim';
    emitAimStatus();
  }

  function scheduleFinish(won: boolean, delay: number): void {
    if (finishTimeout !== null) window.clearTimeout(finishTimeout);
    finishTimeout = window.setTimeout(() => {
      finishTimeout = null;
      st.running = false;
      cbs.onFinish({
        won,
        finishTime: st.finishTime,
        score: st.score,
        target: st.target,
        hard: st.hard,
      });
    }, delay);
  }

  // ---- update ----
  function update(dt: number): void {
    // Expert mode: the mug glides; Novice stays centered.
    if (st.running && st.hard) {
      mug.phase += MUG.omega * dt;
      mug.x = MUG.cx + MUG.amp * Math.sin(mug.phase);
    } else {
      mug.x = MUG.cx;
    }

    if (st.running && st.timerRunning && st.phase !== 'over') {
      st.timeLeft -= dt;
      if (st.timeLeft <= 0) {
        st.timeLeft = 0;
        st.timerRunning = false;
        cbs.onTick(0);
        st.phase = 'over';
        scheduleFinish(false, 400);
      } else if (st.phase !== 'resolve') {
        const sec = Math.ceil(st.timeLeft);
        if (sec !== st.lastTickSec) {
          st.lastTickSec = sec;
          cbs.onTick(sec);
        }
      }
    }

    for (const p of bgpuffs) {
      p.x += p.sp * dt;
      if (p.x - p.r > LW) p.x = -p.r;
    }
    for (const s of steam) {
      s.life += dt;
      s.y += s.vy * dt;
      s.x += s.drift * dt;
      s.o = Math.sin(Math.min(s.life / s.max, 1) * Math.PI) * 0.5;
      if (s.life >= s.max) Object.assign(s, newSteam(false));
    }

    if (st.phase === 'fly' && ball) {
      ball.vy += GRAV * dt;
      const py = ball.y;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.rot += ball.spin * dt;
      if (Math.random() < 0.5) {
        particles.push({ x: ball.x, y: ball.y, r: ball.r * 0.5, life: 0, max: 0.4, kind: 'trail' });
      }
      const descending = ball.vy > 0;
      if (descending && py < MUG.rimY && ball.y >= MUG.rimY) {
        if (Math.abs(ball.x - mug.x) < MUG.rimRx * 0.82) {
          scoreMake();
          return;
        }
      }
      if (descending && ball.y >= MUG.rimY - 4 && ball.y <= MUG.rimY + 18) {
        const dx = ball.x - mug.x;
        const a = Math.abs(dx);
        if (a >= MUG.rimRx * 0.82 && a < MUG.rimRx * 1.15) {
          ball.vy *= -0.42;
          ball.vx *= 0.5;
          ball.x += (dx > 0 ? 1 : -1) * 6;
          for (let i = 0; i < 6; i++) {
            particles.push({
              x: ball.x, y: MUG.rimY, r: 5, life: 0, max: 0.4,
              vx: (Math.random() * 2 - 1) * 120, vy: -60 - Math.random() * 80, kind: 'chip',
            });
          }
          cbs.onStatus('clank! so close');
        }
      }
      const ground = LH - 40;
      if (ball.y > ground) {
        ball.y = ground;
        endTurn();
        return;
      }
      if (ball.x < -60 || ball.x > LW + 60 || ball.y < -400) {
        endTurn();
        return;
      }
    }

    for (const p of particles) {
      p.life += dt;
      if (p.vx !== undefined) {
        p.x += p.vx * dt;
        p.vy = (p.vy ?? 0) + GRAV * 0.6 * dt;
        p.y += p.vy * dt;
      }
    }
    particles = particles.filter((p) => p.life < p.max);
    for (const s of splashes) s.life += dt;
    splashes = splashes.filter((s) => s.life < s.max);

    if (st.phase === 'resolve') {
      resolveTimer -= dt;
      if (resolveTimer <= 0) nextAim();
    }
  }

  // ---- draw helpers ----
  const circle = (x: number, y: number, r: number): void => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const puff = (x: number, y: number, r: number): void => {
    ctx.beginPath();
    ctx.arc(x - r * 0.5, y, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 0.5, y, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x, y - r * 0.4, r * 0.8, 0, Math.PI * 2);
    ctx.arc(x, y + r * 0.2, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
  };
  const roundRect = (x: number, y: number, w: number, h: number, r: number): void => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  function drawMug(): void {
    if (mugReady) {
      const iw = MUG_PLACEMENT.drawW;
      const ih = iw * (mugImg.naturalHeight / mugImg.naturalWidth);
      const dx = mug.x - iw * MUG_PLACEMENT.openXFrac;
      const dy = MUG.rimY - ih * MUG_PLACEMENT.openYFrac;
      try {
        ctx.drawImage(mugImg, dx, dy, iw, ih);
      } catch {
        drawPlaceholderMug();
      }
    } else {
      drawPlaceholderMug();
    }
  }

  function drawPlaceholderMug(): void {
    const w = MUG_PLACEMENT.drawW;
    const h = 230;
    const left = mug.x - w * MUG_PLACEMENT.openXFrac;
    const top = MUG.rimY - h * MUG_PLACEMENT.openYFrac;
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,246,235,.5)';
    roundRect(left, top, w, h, 22);
    ctx.stroke();
    ctx.setLineDash([]);
    // scoring opening
    ctx.strokeStyle = 'rgba(255,246,235,.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(mug.x, MUG.rimY, MUG.rimRx, MUG.rimRy, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,246,235,.85)';
    circle(mug.x, MUG.rimY, 3);
    // labels
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,246,235,.85)';
    ctx.font = "600 22px Fredoka, system-ui, sans-serif";
    ctx.fillText('mug.png', mug.x, top + h * 0.62);
    ctx.font = '600 13px Nunito, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,246,235,.6)';
    ctx.fillText('drop a transparent PNG in /public', mug.x, top + h * 0.62 + 22);
    ctx.restore();
  }

  function drawSlingAndAim(): void {
    const baseX = ANCHOR.x;
    const groundY = LH - 40;
    const forkY = 488;
    const tipL = { x: ANCHOR.x - 30, y: 426 };
    const tipR = { x: ANCHOR.x + 30, y: 426 };
    const stretched = st.phase === 'aim' && aiming;
    const px = stretched ? dragCur.x : ANCHOR.x;
    const py = stretched ? dragCur.y : ANCHOR.y;
    const holdL = { x: px - 16, y: py };
    const holdR = { x: px + 16, y: py };

    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5c4130';
    ctx.lineWidth = 18;
    ctx.beginPath(); ctx.moveTo(baseX, groundY); ctx.lineTo(baseX, forkY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(baseX, forkY); ctx.lineTo(tipL.x, tipL.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(baseX, forkY); ctx.lineTo(tipR.x, tipR.y); ctx.stroke();
    ctx.strokeStyle = '#7a5636';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(baseX, groundY); ctx.lineTo(baseX, forkY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(baseX, forkY); ctx.lineTo(tipL.x, tipL.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(baseX, forkY); ctx.lineTo(tipR.x, tipR.y); ctx.stroke();
    ctx.fillStyle = '#4b3527';
    circle(tipL.x, tipL.y, 7);
    circle(tipR.x, tipR.y, 7);

    ctx.strokeStyle = stretched ? COLORS.p1 : '#6b4632';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(tipL.x, tipL.y); ctx.lineTo(holdL.x, holdL.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tipR.x, tipR.y); ctx.lineTo(holdR.x, holdR.y); ctx.stroke();

    ctx.strokeStyle = '#5a3a2c';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(holdL.x, holdL.y);
    ctx.quadraticCurveTo(px, py + 15, holdR.x, holdR.y);
    ctx.stroke();

    if (stretched) {
      const pull = { x: ANCHOR.x - dragCur.x, y: ANCHOR.y - dragCur.y };
      const len = Math.hypot(pull.x, pull.y);
      if (len > 4) {
        const clamped = Math.min(len, MAXDRAG);
        const nx = pull.x / len;
        const ny = pull.y / len;
        const power = (clamped / MAXDRAG) * MAXPOWER;
        // predicted arc (shown in both modes)
        let sx = ANCHOR.x;
        let sy = ANCHOR.y;
        let vx = nx * power;
        let vy = ny * power;
        const step = 0.026;
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        for (let i = 0; i < 42; i++) {
          vy += GRAV * step;
          sx += vx * step;
          sy += vy * step;
          if (sy > LH - 40 || sx > LW || sx < 0) break;
          if (i % 2 === 0) {
            ctx.globalAlpha = Math.max(0, 0.7 - i * 0.016);
            circle(sx, sy, 4.2);
          }
        }
        ctx.globalAlpha = 1;
        const pct = clamped / MAXDRAG;
        ctx.fillStyle = 'rgba(255,255,255,.15)';
        roundRect(40, 40, 180, 14, 7);
        ctx.fill();
        ctx.fillStyle = COLORS.p1;
        roundRect(40, 40, 180 * pct, 14, 7);
        ctx.fill();
      }
    }
  }

  function drawMarsh(x: number, y: number, r: number, rot: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.75, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    const w = r * 1.7;
    const h = r * 1.55;
    ctx.fillStyle = '#FFFFFF';
    roundRect(-w / 2, -h / 2, w, h, r * 0.7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.42, r * 0.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,82,40,.22)';
    circle(-r * 0.3, r * 0.2, 2);
    circle(r * 0.25, -r * 0.1, 1.6);
    circle(r * 0.05, r * 0.35, 1.4);
    ctx.restore();
  }

  // ---- render ----
  function render(): void {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, LW, LH);

    const bg = ctx.createLinearGradient(0, 0, 0, LH);
    if (st.hard) {
      bg.addColorStop(0, '#8a2b22');
      bg.addColorStop(1, '#3a120f');
    } else {
      bg.addColorStop(0, '#7a4320');
      bg.addColorStop(1, '#3d1e11');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, LW, LH);

    for (const p of bgpuffs) {
      ctx.globalAlpha = p.o;
      ctx.fillStyle = '#ffe9c9';
      puff(p.x, p.y, p.r);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(0,0,0,.18)';
    roundRect(0, LH - 46, LW, 60, 0);
    ctx.fill();

    drawMug();

    for (const s of steam) {
      ctx.globalAlpha = s.o;
      ctx.fillStyle = 'rgba(255,247,238,1)';
      puff(s.x, s.y, s.r);
    }
    ctx.globalAlpha = 1;

    for (const s of splashes) {
      const t = s.life / s.max;
      ctx.globalAlpha = (1 - t) * 0.6;
      ctx.strokeStyle = '#6b3a22';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(
        s.x, s.y,
        MUG.rimRx * 0.5 + t * MUG.rimRx * 0.7,
        MUG.rimRy * 0.5 + t * MUG.rimRy * 0.7,
        0, 0, Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    drawSlingAndAim();

    for (const p of particles) {
      const t = p.life / p.max;
      ctx.globalAlpha = 1 - t;
      if (p.kind === 'splash' || p.kind === 'chip') {
        ctx.fillStyle = '#efe0c8';
      } else {
        ctx.fillStyle = COLORS.p1;
        ctx.globalAlpha = (1 - t) * 0.4;
      }
      circle(p.x, p.y, p.r * (1 - t * 0.5));
    }
    ctx.globalAlpha = 1;

    if (ball) drawMarsh(ball.x, ball.y, ball.r, ball.rot);
    if (st.phase === 'aim') {
      const bx = aiming ? dragCur.x : ANCHOR.x;
      const by = aiming ? dragCur.y : ANCHOR.y;
      drawMarsh(bx, by, 33, 0);
    }
  }

  // ---- loop ----
  let last = performance.now();
  let raf = 0;
  function frame(now: number): void {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (!st.paused) update(dt);
    render();
    raf = requestAnimationFrame(frame);
  }
  resize();
  raf = requestAnimationFrame(frame);

  // ---- public API ----
  return {
    start(cfg: GameConfig) {
      if (finishTimeout !== null) {
        window.clearTimeout(finishTimeout);
        finishTimeout = null;
      }
      st.hard = cfg.hard;
      st.target = cfg.target;
      st.timeLimit = cfg.timeLimit;
      st.timeLeft = cfg.timeLimit;
      st.score = 0;
      st.timerRunning = false;
      st.finishTime = 0;
      st.paused = false;
      st.running = true;
      st.phase = 'aim';
      st.lastTickSec = -1;
      ball = null;
      aiming = false;
      particles = [];
      splashes = [];
      cbs.onScore(0);
      cbs.onTick(cfg.timeLimit);
      emitAimStatus();
    },
    pause() {
      st.paused = true;
    },
    resume() {
      st.paused = false;
    },
    stop() {
      if (finishTimeout !== null) {
        window.clearTimeout(finishTimeout);
        finishTimeout = null;
      }
      st.running = false;
      st.paused = false;
      st.phase = 'idle';
      ball = null;
      aiming = false;
      cbs.onStatus('');
    },
    destroy() {
      cancelAnimationFrame(raf);
      if (finishTimeout !== null) window.clearTimeout(finishTimeout);
      ro.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    },
  };
}
