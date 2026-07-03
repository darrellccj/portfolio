import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
//  KOI POND — a procedural canvas animation.
//  Aerial view of a cream-toned pond. Fish are drawn as segmented
//  spines (follow-the-leader) so their bodies curve naturally as
//  they swim. Light caustics drift across the surface; lily pads
//  float; the cursor gently disturbs nearby fish and clicks send
//  out ripples.
// ─────────────────────────────────────────────────────────────

// Koi colour varieties. `base` is the body, `patches` are ellipse
// blobs painted along the spine to fake koi markings.
const VARIETIES = [
  // Kohaku — white with red-orange
  { base: '#fbf7f0', patches: ['#d2662f', '#e07f3e'], fin: 'rgba(210,102,47,0.22)' },
  // Solid orange / gold
  { base: '#e58a3c', patches: ['#f0a659', '#cf6f28'], fin: 'rgba(240,166,89,0.25)' },
  // White with a charcoal + orange (utsuri-ish)
  { base: '#f7f2ea', patches: ['#2f2a25', '#d2662f'], fin: 'rgba(80,72,64,0.20)' },
  // Deep red
  { base: '#c9522a', patches: ['#e07f3e', '#a5401f'], fin: 'rgba(201,82,42,0.25)' },
];

function rand(a, b) {
  return a + Math.random() * (b - a);
}

// One fish: a chain of spine points that trail the head.
class Koi {
  constructor(w, h) {
    this.reset(w, h, true);
  }

  reset(w, h, spread) {
    this.segCount = 13;
    this.scale = rand(0.7, 1.25);
    this.seg = 9 * this.scale; // distance between spine points
    this.speed = rand(0.5, 0.95) / Math.sqrt(this.scale);
    this.angle = rand(0, Math.PI * 2);
    this.targetAngle = this.angle;
    // depth: deeper fish are fainter + softer (underwater feel)
    this.depth = rand(0.55, 1);
    this.variety = VARIETIES[(Math.random() * VARIETIES.length) | 0];
    this.wanderTimer = 0;
    this.finPhase = rand(0, Math.PI * 2);

    const x = spread ? rand(0, w) : rand(-50, w + 50);
    const y = spread ? rand(0, h) : rand(-50, h + 50);
    this.spine = [];
    for (let i = 0; i < this.segCount; i++) {
      this.spine.push({
        x: x - Math.cos(this.angle) * this.seg * i,
        y: y - Math.sin(this.angle) * this.seg * i,
      });
    }

    // body half-width along the spine (head → tail taper)
    this.widths = this.spine.map((_, i) => {
      const t = i / (this.segCount - 1);
      // fat near the shoulders (~20%), tapering to the tail
      const bulge = Math.sin(Math.min(t * 1.35, 1) * Math.PI);
      return (2 + bulge * 7) * this.scale;
    });
  }

  update(w, h, t, pointer, dt) {
    const head = this.spine[0];

    // gentle wandering — pick a new heading now and then
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.targetAngle += rand(-0.9, 0.9);
      this.wanderTimer = rand(1.2, 3.2);
    }

    // steer away from the pointer if it's close (fish get spooked)
    if (pointer.active) {
      const dx = head.x - pointer.x;
      const dy = head.y - pointer.y;
      const d = Math.hypot(dx, dy);
      const R = 150;
      if (d < R) {
        const flee = Math.atan2(dy, dx);
        const strength = (1 - d / R) * 2.4;
        this.targetAngle = flee;
        this.speedBoost = strength;
      }
    }

    // keep fish inside the pond — steer back toward centre near edges
    const margin = 80;
    if (head.x < margin) this.targetAngle = this.approach(0);
    else if (head.x > w - margin) this.targetAngle = this.approach(Math.PI);
    if (head.y < margin) this.targetAngle = this.approach(Math.PI / 2);
    else if (head.y > h - margin) this.targetAngle = this.approach(-Math.PI / 2);

    // ease current angle toward target
    let diff = this.targetAngle - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.angle += diff * Math.min(1, dt * 2.2);

    const boost = this.speedBoost ? this.speedBoost : 0;
    this.speedBoost *= 0.9;
    const v = (this.speed + boost) * dt * 60;

    // add a subtle side-to-side sway to the swim path
    const sway = Math.sin(t * 3.5 + this.finPhase) * 0.12;
    const heading = this.angle + sway;

    head.x += Math.cos(heading) * v;
    head.y += Math.sin(heading) * v;

    // follow-the-leader: each segment trails the previous at fixed dist
    for (let i = 1; i < this.spine.length; i++) {
      const prev = this.spine[i - 1];
      const cur = this.spine[i];
      const a = Math.atan2(cur.y - prev.y, cur.x - prev.x);
      cur.x = prev.x + Math.cos(a) * this.seg;
      cur.y = prev.y + Math.sin(a) * this.seg;
    }
  }

  // heading toward a target angle, but softened
  approach(a) {
    return a;
  }

  draw(ctx, t) {
    const s = this.spine;
    const w = this.widths;

    // left & right edge points, perpendicular to the local spine dir
    const left = [];
    const right = [];
    for (let i = 0; i < s.length; i++) {
      const p = s[i];
      const nxt = s[Math.min(i + 1, s.length - 1)];
      const prv = s[Math.max(i - 1, 0)];
      const a = Math.atan2(nxt.y - prv.y, nxt.x - prv.x);
      const nx = Math.cos(a + Math.PI / 2);
      const ny = Math.sin(a + Math.PI / 2);
      left.push({ x: p.x + nx * w[i], y: p.y + ny * w[i] });
      right.push({ x: p.x - nx * w[i], y: p.y - ny * w[i] });
    }

    ctx.save();
    ctx.globalAlpha = this.depth;

    // soft shadow on the pond floor (offset down-right)
    ctx.save();
    ctx.translate(6, 8);
    ctx.fillStyle = 'rgba(60,45,30,0.10)';
    ctx.filter = 'blur(3px)';
    this.tracePath(ctx, left, right, s);
    ctx.fill();
    ctx.restore();

    // tail fin — a translucent fan that sways
    const tail = s[s.length - 1];
    const tailPrev = s[s.length - 3];
    const ta = Math.atan2(tail.y - tailPrev.y, tail.x - tailPrev.x);
    const swish = Math.sin(t * 6 + this.finPhase) * 0.5;
    ctx.fillStyle = this.variety.fin;
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    const fl = 16 * this.scale;
    ctx.lineTo(
      tail.x + Math.cos(ta + 0.5 + swish) * fl,
      tail.y + Math.sin(ta + 0.5 + swish) * fl
    );
    ctx.quadraticCurveTo(
      tail.x + Math.cos(ta + swish) * fl * 1.3,
      tail.y + Math.sin(ta + swish) * fl * 1.3,
      tail.x + Math.cos(ta - 0.5 + swish) * fl,
      tail.y + Math.sin(ta - 0.5 + swish) * fl
    );
    ctx.closePath();
    ctx.fill();

    // pectoral fins near the shoulders
    const sh = s[3];
    const shDir = Math.atan2(s[2].y - s[4].y, s[2].x - s[4].x);
    const fw = Math.sin(t * 6 + this.finPhase) * 0.4;
    for (const side of [1, -1]) {
      ctx.beginPath();
      const base = shDir + side * (Math.PI / 2);
      ctx.moveTo(sh.x, sh.y);
      const fpl = 13 * this.scale;
      ctx.quadraticCurveTo(
        sh.x + Math.cos(base + side * (0.3 + fw)) * fpl,
        sh.y + Math.sin(base + side * (0.3 + fw)) * fpl,
        sh.x + Math.cos(base - side * 0.2) * fpl * 0.7,
        sh.y + Math.sin(base - side * 0.2) * fpl * 0.7
      );
      ctx.closePath();
      ctx.fill();
    }

    // body
    ctx.fillStyle = this.variety.base;
    this.tracePath(ctx, left, right, s);
    ctx.fill();

    // koi markings — clip to the body, paint blobs along the spine
    ctx.save();
    this.tracePath(ctx, left, right, s);
    ctx.clip();
    this.variety.patches.forEach((color, k) => {
      ctx.fillStyle = color;
      const idx = 2 + k * 3;
      const p = s[Math.min(idx, s.length - 2)];
      if (!p) return;
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y,
        w[Math.min(idx, w.length - 1)] * 1.15,
        w[Math.min(idx, w.length - 1)] * 0.85,
        this.angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  }

  // build a smooth closed outline down the left edge and up the right
  tracePath(ctx, left, right, s) {
    ctx.beginPath();
    // round the nose
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < left.length; i++) {
      const xc = (left[i].x + left[i - 1].x) / 2;
      const yc = (left[i].y + left[i - 1].y) / 2;
      ctx.quadraticCurveTo(left[i - 1].x, left[i - 1].y, xc, yc);
    }
    for (let i = right.length - 1; i > 0; i--) {
      const xc = (right[i].x + right[i - 1].x) / 2;
      const yc = (right[i].y + right[i - 1].y) / 2;
      ctx.quadraticCurveTo(right[i].x, right[i].y, xc, yc);
    }
    ctx.closePath();
  }
}

// A drifting light caustic — soft radial highlight on the water.
class Caustic {
  constructor(w, h) {
    this.x = rand(0, w);
    this.y = rand(0, h);
    this.r = rand(120, 260);
    this.driftX = rand(-0.15, 0.15);
    this.driftY = rand(-0.1, 0.1);
    this.phase = rand(0, Math.PI * 2);
  }
  update(w, h, dt) {
    this.x += this.driftX * dt * 60;
    this.y += this.driftY * dt * 60;
    if (this.x < -this.r) this.x = w + this.r;
    if (this.x > w + this.r) this.x = -this.r;
    if (this.y < -this.r) this.y = h + this.r;
    if (this.y > h + this.r) this.y = -this.r;
  }
  draw(ctx, t) {
    const pulse = 0.5 + Math.sin(t * 0.6 + this.phase) * 0.5;
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0, `rgba(255,252,244,${0.10 * pulse})`);
    g.addColorStop(1, 'rgba(255,252,244,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A floating lily pad with an optional bloom.
class LilyPad {
  constructor(w, h) {
    this.x = rand(0.08, 0.92) * w;
    this.y = rand(0.08, 0.92) * h;
    this.r = rand(26, 46);
    this.rot = rand(0, Math.PI * 2);
    this.drift = rand(0.02, 0.06);
    this.phase = rand(0, Math.PI * 2);
    this.hasFlower = Math.random() > 0.5;
  }
  draw(ctx, t) {
    const bob = Math.sin(t * 0.8 + this.phase) * 2;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.rotate(this.rot + Math.sin(t * 0.3 + this.phase) * 0.05);
    ctx.globalAlpha = 0.92;

    const gap = 0.55; // angular width of the wedge notch

    // shadow — same notched shape, offset
    ctx.fillStyle = 'rgba(40,60,35,0.10)';
    ctx.beginPath();
    ctx.arc(4, 6, this.r, gap / 2, Math.PI * 2 - gap / 2);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();

    // pad body — a circle with a V wedge cut out
    const grad = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
    grad.addColorStop(0, '#88a06e');
    grad.addColorStop(1, '#6d8757');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, gap / 2, Math.PI * 2 - gap / 2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // faint radial veins for a bit of texture
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const a = gap / 2 + (i / 7) * (Math.PI * 2 - gap);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * this.r * 0.9, Math.sin(a) * this.r * 0.9);
      ctx.stroke();
    }

    if (this.hasFlower) {
      ctx.fillStyle = 'rgba(244,225,232,0.92)';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(a) * 6,
          Math.sin(a) * 6,
          4,
          8,
          a,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.fillStyle = '#e6b34a';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Expanding ripple ring from a click.
class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 4;
    this.life = 1;
  }
  update(dt) {
    this.r += dt * 90;
    this.life -= dt * 0.9;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.strokeStyle = `rgba(120,95,70,${0.25 * this.life})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export default function KoiPond() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let koi = [];
    let caustics = [];
    let pads = [];
    const ripples = [];
    const pointer = { x: 0, y: 0, active: false };
    let raf = 0;
    let last = performance.now();
    let visible = true;

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // scale fish count to screen area (fewer on phones)
      const count = Math.max(5, Math.min(11, Math.round((w * h) / 90000)));
      koi = Array.from({ length: count }, () => new Koi(w, h));
      caustics = Array.from({ length: 6 }, () => new Caustic(w, h));
      pads = Array.from(
        { length: w < 640 ? 2 : 4 },
        () => new LilyPad(w, h)
      );
    }

    function drawWater(t) {
      // cream base, lit from the centre-top as if sun overhead
      const g = ctx.createRadialGradient(
        w * 0.5,
        h * 0.35,
        0,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.75
      );
      g.addColorStop(0, '#f7f2e8');
      g.addColorStop(0.6, '#efe7d7');
      g.addColorStop(1, '#e6dcc7');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = 'lighter';
      caustics.forEach((c) => {
        if (!reduced) c.update(w, h, 1 / 60);
        c.draw(ctx, t);
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // clamp after tab-switches
      const t = now / 1000;

      drawWater(t);
      pads.forEach((p) => p.draw(ctx, t));

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].update(dt);
        ripples[i].draw(ctx);
        if (ripples[i].life <= 0) ripples.splice(i, 1);
      }

      koi.forEach((k) => {
        if (!reduced) k.update(w, h, t, pointer, dt);
        k.draw(ctx, t);
      });
    }

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    }
    function onLeave() {
      pointer.active = false;
    }
    function onClick(e) {
      const r = canvas.getBoundingClientRect();
      ripples.push(new Ripple(e.clientX - r.left, e.clientY - r.top));
    }

    // pause the loop when the hero scrolls out of view
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onClick);

    if (reduced) {
      // one static frame, no animation
      drawWater(0);
      pads.forEach((p) => p.draw(ctx, 0));
      koi.forEach((k) => k.draw(ctx, 0));
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="koi-canvas" aria-hidden="true" />;
}
