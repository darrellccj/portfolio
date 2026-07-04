import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
//  KOI POND — WebGL (three.js), hand-drawn ink style, side view.
//  Each koi is a black-and-white line-art SIDE profile (bold
//  outline, translucent fins, Kohaku red patches, barbels, eye)
//  drawn straight, then mapped onto a finely subdivided plane that
//  is bent each frame to follow a trailing spine — so the body
//  genuinely undulates as it swims. Fish cruise through a vertical
//  slab of water at varied depths (parallax), seen through a gently
//  angled perspective camera, above a depth-graded pond with faint
//  caustics and light shafts falling from the surface.
// ─────────────────────────────────────────────────────────────

const rand = (a, b) => a + Math.random() * (b - a);

const INK = '#1a1712';
const PAPER = '#fbfaf5';
const BENI = '#d64f2a'; // koi red-orange (hi) — the Kohaku signal
const SUMI = '#2a2622'; // soft sumi-black accents (Sanke/Showa)

// Koi colour varieties. Side view: `beni`/`sumi` patches placed at
// s (0 tail … 1 head) with size factor r and vertical offset y (- = up).
const VARIETIES = [
  { beni: [{ s: 0.66, r: 1.0, y: -10 }, { s: 0.46, r: 0.9, y: -14 }, { s: 0.3, r: 0.6, y: -8 }], sumi: [] },
  { beni: [{ s: 0.6, r: 1.15, y: -12 }, { s: 0.38, r: 0.8, y: -6 }], sumi: [] },
  { beni: [{ s: 0.62, r: 0.95, y: -12 }, { s: 0.42, r: 0.8, y: -10 }], sumi: [{ s: 0.52, r: 0.4, y: -20 }, { s: 0.32, r: 0.35, y: 6 }] },
  { beni: [{ s: 0.54, r: 1.2, y: -10 }], sumi: [] },
  { beni: [{ s: 0.7, r: 0.8, y: -14 }, { s: 0.48, r: 0.6, y: -8 }], sumi: [] },
];

// Draw one ink koi in SIDE profile to an offscreen canvas, head at the
// right (+X), straight pose. The mesh bends it, so the drawing stays uncurved.
function makeKoiCanvas(v) {
  const W = 640;
  const H = 320;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const y0 = H / 2;
  const noseX = 590;
  const tailBaseX = 150;
  const OUT = 4.5;
  const bMax = 60; // max back height above the centreline
  const blMax = 52; // max belly depth below it
  const toS = (x) => (x - tailBaseX) / (noseX - tailBaseX);

  const backH = (s) => {
    if (s <= 0.6) return 7 + (bMax - 7) * Math.pow(Math.sin((s / 0.6) * Math.PI / 2), 0.9);
    const k = (s - 0.6) / 0.4;
    return bMax - (bMax - 18) * Math.pow(k, 1.5);
  };
  const bellyH = (s) => {
    if (s <= 0.48) return 7 + (blMax - 7) * Math.pow(Math.sin((s / 0.48) * Math.PI / 2), 0.9);
    const k = (s - 0.48) / 0.52;
    return blMax - (blMax - 15) * Math.pow(k, 1.4);
  };

  const bodyPath = () => {
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      const yy = y0 - backH(toS(x));
      i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.quadraticCurveTo(noseX + 20, y0, noseX, y0 + bellyH(1));
    for (let i = steps; i >= 0; i--) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      ctx.lineTo(x, y0 + bellyH(toS(x)));
    }
    ctx.closePath();
  };

  // ---- translucent pale fins (drawn first; body fill hides their roots) ----
  const FIN_FILL = 'rgba(252,251,247,0.55)';
  const FIN_LINE = 'rgba(38,34,28,0.42)';
  const FIN_RAY = 'rgba(38,34,28,0.3)';
  const fin = (build, rays) => {
    ctx.fillStyle = FIN_FILL;
    ctx.strokeStyle = FIN_LINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    build();
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    build();
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = FIN_RAY;
    ctx.lineWidth = 1.5;
    rays();
    ctx.restore();
  };

  // caudal (tail) — big flowing fan, gently forked
  fin(
    () => {
      ctx.moveTo(158, y0 - 6);
      ctx.quadraticCurveTo(70, y0 - 44, 40, y0 - 58);
      ctx.quadraticCurveTo(92, y0 - 22, 66, y0);
      ctx.quadraticCurveTo(92, y0 + 22, 40, y0 + 58);
      ctx.quadraticCurveTo(70, y0 + 44, 158, y0 + 6);
    },
    () => {
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(156, y0);
        ctx.lineTo(52, y0 + i * 9);
        ctx.stroke();
      }
    }
  );

  // dorsal fin — long low fin along the back
  const dA = 300;
  const dB = 452;
  fin(
    () => {
      ctx.moveTo(dA, y0 - backH(toS(dA)) + 2);
      ctx.quadraticCurveTo(dA + 30, y0 - backH(toS(dA)) - 24, dA + 70, y0 - backH(toS(dA + 70)) - 22);
      ctx.quadraticCurveTo(dB - 20, y0 - backH(toS(dB)) - 16, dB, y0 - backH(toS(dB)) + 2);
    },
    () => {
      for (let i = 0; i <= 8; i++) {
        const x = dA + ((dB - dA) * i) / 8;
        ctx.beginPath();
        ctx.moveTo(x, y0 - backH(toS(x)) + 2);
        ctx.lineTo(x, y0 - backH(toS(x)) - 18);
        ctx.stroke();
      }
    }
  );

  // pelvic fin — small, mid-belly, hanging down/back
  (() => {
    const px = 360;
    const by = y0 + bellyH(toS(px));
    fin(
      () => {
        ctx.moveTo(px + 6, by - 4);
        ctx.quadraticCurveTo(px - 8, by + 20, px - 26, by + 30);
        ctx.quadraticCurveTo(px - 6, by + 14, px - 4, by - 2);
      },
      () => {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(px, by - 2);
          ctx.lineTo(px - 26 + i * 7, by + 28 - i * 3);
          ctx.stroke();
        }
      }
    );
  })();

  // anal fin — small, near tail underside
  (() => {
    const px = 232;
    const by = y0 + bellyH(toS(px));
    fin(
      () => {
        ctx.moveTo(px + 6, by - 4);
        ctx.quadraticCurveTo(px - 6, by + 16, px - 20, by + 24);
        ctx.quadraticCurveTo(px - 4, by + 12, px - 4, by - 2);
      },
      () => {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(px, by - 2);
          ctx.lineTo(px - 20 + i * 7, by + 22 - i * 3);
          ctx.stroke();
        }
      }
    );
  })();

  // ---- body ----
  bodyPath();
  ctx.fillStyle = PAPER;
  ctx.fill();

  // ---- markings clipped to the body ----
  ctx.save();
  bodyPath();
  ctx.clip();
  const blob = (cx, cy, rr, color) => {
    ctx.beginPath();
    const n = 13;
    const radii = [];
    for (let i = 0; i < n; i++) radii.push(rr * (0.78 + Math.random() * 0.42));
    const pt = (i) => {
      const a = (i / n) * Math.PI * 2;
      const r = radii[(i + n) % n];
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.9 };
    };
    let a = pt(n - 1);
    let b = pt(0);
    ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
    for (let i = 0; i < n; i++) {
      const c = pt(i);
      const d = pt(i + 1);
      ctx.quadraticCurveTo(c.x, c.y, (c.x + d.x) / 2, (c.y + d.y) / 2);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const patchR = (s) => (backH(s) + bellyH(s)) * 0.42;
  (v.beni || []).forEach((m) => {
    const x = tailBaseX + (noseX - tailBaseX) * m.s;
    blob(x, y0 + (m.y || 0) + rand(-4, 4), patchR(m.s) * m.r, BENI);
  });
  (v.sumi || []).forEach((m) => {
    const x = tailBaseX + (noseX - tailBaseX) * m.s;
    blob(x, y0 + (m.y || 0) + rand(-4, 4), patchR(m.s) * m.r, SUMI);
  });
  // faint scale rows over the mid-body
  ctx.strokeStyle = 'rgba(38,34,28,0.12)';
  ctx.lineWidth = 1.2;
  for (let col = 0; col < 7; col++) {
    const x = 250 + col * 42;
    for (let row = -2; row <= 2; row++) {
      const yy = y0 + row * 18;
      ctx.beginPath();
      ctx.arc(x, yy, 12, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ---- body outline ----
  bodyPath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = OUT;
  ctx.stroke();

  // gill plate line
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(508, y0 - backH(toS(508)) + 6);
  ctx.quadraticCurveTo(494, y0, 512, y0 + bellyH(toS(512)) - 6);
  ctx.stroke();

  // pectoral fin — behind the gill, hanging down/back (over the body)
  (() => {
    const px = 486;
    const by = y0 + bellyH(toS(px)) - 8;
    fin(
      () => {
        ctx.moveTo(px + 6, by - 6);
        ctx.quadraticCurveTo(px - 10, by + 22, px - 34, by + 34);
        ctx.quadraticCurveTo(px - 8, by + 16, px - 6, by - 4);
      },
      () => {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(px - 2, by - 4);
          ctx.lineTo(px - 32 + i * 8, by + 32 - i * 3);
          ctx.stroke();
        }
      }
    );
  })();

  // ---- eye ----
  const ex = 548;
  const ey = y0 - 20;
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(ex, ey, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(ex, ey, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.arc(ex - 1.4, ey - 1.4, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // ---- mouth + barbels ----
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(noseX + 14, y0 + 6);
  ctx.quadraticCurveTo(noseX + 2, y0 + 12, noseX - 14, y0 + 11);
  ctx.stroke();
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(noseX + 12, y0 + 8);
  ctx.quadraticCurveTo(noseX + 24, y0 + 16, noseX + 20, y0 + 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(noseX + 6, y0 + 10);
  ctx.quadraticCurveTo(noseX + 14, y0 + 22, noseX + 6, y0 + 34);
  ctx.stroke();

  return cv;
}

const WATER_VERT = `
  varying vec2 vW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vW = wp.xy;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const WATER_FRAG = `
  precision highp float;
  varying vec2 vW;
  uniform float uTime;
  uniform float uTop;
  uniform float uBottom;
  #define MAXR 12
  uniform int uRippleCount;
  uniform vec4 uRipples[MAXR];

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
  }
  float fbm(vec2 p){
    float s=0.0, a=0.5;
    for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.0; a*=0.5; }
    return s;
  }

  void main(){
    float depth = clamp((uTop - vW.y) / (uTop - uBottom), 0.0, 1.0); // 0 top … 1 deep
    vec3 top = vec3(0.933,0.950,0.929);
    vec3 bot = vec3(0.706,0.760,0.727);
    vec3 base = mix(top, bot, pow(depth, 1.1));

    // faint caustic shimmer, fading with depth
    vec2 p = vW * 0.06;
    float c = fbm(p + vec2(0.0, uTime * 0.05));
    base += vec3(0.05,0.05,0.045) * pow(smoothstep(0.5,1.2,c*1.25),1.5) * (1.0 - depth*0.6);

    // soft light shafts falling from the surface
    float ang = vW.x * 0.12 + fbm(vec2(vW.x*0.03, uTime*0.04)) * 2.5;
    float shaft = pow(0.5 + 0.5*sin(ang), 4.0) * (1.0 - depth);
    base += vec3(0.07,0.07,0.06) * shaft;

    // bright wavy surface band near the top
    float wob = fbm(vec2(vW.x*0.15, uTime*0.2)) * 1.6;
    float surf = smoothstep(3.5, 0.0, abs(vW.y - (uTop - 1.0 + wob)));
    base += vec3(0.06,0.06,0.05) * surf;

    for(int i=0;i<MAXR;i++){
      if(i>=uRippleCount) break;
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if(age<0.0 || age>3.0) continue;
      float dist = length(vW - r.xy);
      float ring = sin(dist*0.5 - age*6.0) * exp(-dist*0.03) * exp(-age*1.4);
      base += vec3(0.05) * ring * r.w;
    }

    gl_FragColor = vec4(base, 1.0);
  }
`;

export default function KoiPondGL() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch (err) {
      return; // no WebGL — leave the cream page background
    }
    renderer.setClearColor(0xdfe8e2, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();

    // Gently angled perspective camera looking into the pond. A small x/y
    // offset from the axis gives a 3/4 tilt while the koi (billboards in the
    // XY plane) still read as clean side profiles.
    const FOV = 42;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
    const CAM = new THREE.Vector3(5, 6, 58);
    const TARGET = new THREE.Vector3(0, 0, 0);
    camera.position.copy(CAM);
    camera.lookAt(TARGET);

    const uTime = { value: 0 };
    let extentX = 60;
    let extentY = 44;
    let yTop = 22;
    let yBot = -22;

    // ---- water backdrop ----
    const MAXR = 12;
    const ripples = new Array(MAXR).fill(0).map(() => new THREE.Vector4(0, 0, -10, 0));
    const waterMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      uniforms: {
        uTime,
        uTop: { value: yTop },
        uBottom: { value: yBot },
        uRippleCount: { value: 0 },
        uRipples: { value: ripples },
      },
    });
    const WATER_Z = -26;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), waterMat);
    water.position.z = WATER_Z;
    water.renderOrder = 0;
    scene.add(water);

    // ---- textures ----
    const koiTextures = VARIETIES.map((v) => {
      const tex = new THREE.CanvasTexture(makeKoiCanvas(v));
      tex.anisotropy = 8;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });

    // ---- fish ----
    // The head cruises horizontally (turning at the walls) with a gentle
    // vertical drift; each body segment trails the one ahead at a fixed
    // distance; the mesh is bent each frame to follow that spine so the body
    // undulates. Fish sit at varied depths (z) for parallax.
    class Fish {
      constructor() {
        this.scale = rand(5.5, 10);
        this.len = this.scale * 2.2;
        this.height = this.len * 0.5; // texture is 2:1
        this.segCount = 40;
        this.seg = this.len / (this.segCount - 1);
        this.speed = rand(6, 9.5) / Math.sqrt(this.scale / 6);
        this.dirX = Math.random() < 0.5 ? 1 : -1;
        this.beat = rand(3.0, 4.2);
        this.phase = rand(0, Math.PI * 2);
        this.z = rand(-14, 5);
        this.tgtY = rand(yBot + 5, yTop - 5);
        this.wander = rand(1, 4);
        this.speedBoost = 0;

        const x0 = rand(-extentX / 2, extentX / 2);
        const y0 = rand(yBot + 5, yTop - 5);
        this.spine = [];
        for (let i = 0; i < this.segCount; i++) {
          this.spine.push({ x: x0 - this.dirX * this.seg * i, y: y0 });
        }

        this.geo = new THREE.PlaneGeometry(this.len, this.height, 40, 4);
        const pos = this.geo.attributes.position;
        this.baseX = new Float32Array(pos.count);
        this.baseY = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
          this.baseX[i] = pos.getX(i);
          this.baseY[i] = pos.getY(i);
        }

        const vi = (Math.random() * VARIETIES.length) | 0;
        this.mat = new THREE.MeshBasicMaterial({
          map: koiTextures[vi],
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const depthT = (this.z + 14) / 19; // 0 deep … 1 near
        this.mat.opacity = 0.5 + depthT * 0.5; // deeper fish read fainter

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.mesh.renderOrder = 2;
        this.mesh.frustumCulled = false;
        scene.add(this.mesh);

        this.deform();
      }

      update(dt, t, pointer) {
        const head = this.spine[0];

        this.wander -= dt;
        if (this.wander <= 0) {
          this.tgtY = rand(yBot + 5, yTop - 5);
          this.wander = rand(2, 5);
          if (Math.random() < 0.22) this.dirX *= -1;
        }

        const xMax = extentX / 2 - 4;
        if (head.x < -xMax) this.dirX = 1;
        else if (head.x > xMax) this.dirX = -1;

        let vx = this.dirX * (this.speed + this.speedBoost);
        let vy = (this.tgtY - head.y) * 0.7;

        if (pointer.active) {
          const dx = head.x - pointer.x;
          const dy = head.y - pointer.y;
          const d = Math.hypot(dx, dy);
          const R = 16;
          if (d < R && d > 0.001) {
            const push = (1 - d / R) * this.speed * 2.4;
            vx += (dx / d) * push;
            vy += (dy / d) * push;
          }
        }
        this.speedBoost *= 0.9;

        // keep clear of the surface and floor
        if (head.y > yTop - 4) vy -= (head.y - (yTop - 4)) * 1.5;
        if (head.y < yBot + 4) vy += ((yBot + 4) - head.y) * 1.5;
        vy = Math.max(-this.speed * 0.8, Math.min(this.speed * 0.8, vy));

        const sway = Math.sin(t * this.beat + this.phase) * 0.12;
        const heading = Math.atan2(vy, vx) + sway;
        const spd = Math.hypot(vx, vy) * dt;
        head.x += Math.cos(heading) * spd;
        head.y += Math.sin(heading) * spd;

        // follow-the-leader spine
        for (let i = 1; i < this.spine.length; i++) {
          const p = this.spine[i - 1];
          const c = this.spine[i];
          const a = Math.atan2(c.y - p.y, c.x - p.x);
          c.x = p.x + Math.cos(a) * this.seg;
          c.y = p.y + Math.sin(a) * this.seg;
        }
        // relax kinks so the bends stay smooth
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < this.spine.length - 1; i++) {
            const a = this.spine[i - 1];
            const b = this.spine[i];
            const c = this.spine[i + 1];
            b.x = b.x * 0.6 + (a.x + c.x) * 0.2;
            b.y = b.y * 0.6 + (a.y + c.y) * 0.2;
          }
        }

        this.deform();
      }

      deform() {
        const pos = this.geo.attributes.position;
        const N = this.segCount;
        const s = this.spine;
        for (let i = 0; i < pos.count; i++) {
          const ox = this.baseX[i];
          const oy = this.baseY[i];
          const u = (ox + this.len / 2) / this.len; // 0 tail … 1 head
          const f = (1 - u) * (N - 1);
          let i1 = Math.floor(f);
          if (i1 < 0) i1 = 0;
          if (i1 > N - 2) i1 = N - 2;
          const t = f - i1;
          const p0 = s[i1 - 1 < 0 ? 0 : i1 - 1];
          const p1 = s[i1];
          const p2 = s[i1 + 1];
          const p3 = s[i1 + 2 > N - 1 ? N - 1 : i1 + 2];
          const t2 = t * t;
          const t3 = t2 * t;
          const cx =
            0.5 *
            (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
          const cy =
            0.5 *
            (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
          const dx =
            0.5 * (-p0.x + p2.x + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
          const dy =
            0.5 * (-p0.y + p2.y + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);
          // head-ward unit tangent; perpendicular kept dorsal-up so the fish
          // mirrors correctly (head-left, back-up) when swimming left
          let tx = -dx;
          let ty = -dy;
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl;
          ty /= tl;
          let px = -ty;
          let py = tx;
          if (py < 0) {
            px = -px;
            py = -py;
          }
          pos.setXYZ(i, cx + px * oy, cy + py * oy, this.z);
        }
        pos.needsUpdate = true;
      }

      dispose() {
        scene.remove(this.mesh);
        this.geo.dispose();
        this.mat.dispose();
      }
    }

    let fish = [];
    function buildFish() {
      fish.forEach((f) => f.dispose());
      const area = extentX * extentY;
      const count = Math.max(4, Math.min(9, Math.round(area / 320)));
      fish = Array.from({ length: count }, () => new Fish());
    }

    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      const dist = camera.position.distanceTo(TARGET);
      extentY = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist;
      extentX = extentY * camera.aspect;
      yTop = extentY / 2;
      yBot = -extentY / 2;
      waterMat.uniforms.uTop.value = yTop;
      waterMat.uniforms.uBottom.value = yBot;

      // size the backdrop to cover the view at its depth
      const backH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (dist - WATER_Z);
      water.scale.set(backH * camera.aspect * 1.2, backH * 1.2, 1);
    }

    resize();
    buildFish();

    // ---- interaction (window-level; the canvas is a fixed backdrop) ----
    const pointer = { x: 0, y: 0, active: false };
    const raycaster = new THREE.Raycaster();
    const planeZ0 = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    let rippleIdx = 0;
    function toWorld(cx, cy) {
      const ndc = new THREE.Vector2((cx / canvas.clientWidth) * 2 - 1, -(cy / canvas.clientHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(planeZ0, hit);
      return hit;
    }
    function onMove(e) {
      const w = toWorld(e.clientX, e.clientY);
      if (w) {
        pointer.x = w.x;
        pointer.y = w.y;
        pointer.active = true;
      }
    }
    function onLeave() {
      pointer.active = false;
    }
    function onDown(e) {
      if (e.target.closest && e.target.closest('a, button, input, textarea')) return;
      const w = toWorld(e.clientX, e.clientY);
      if (!w) return;
      ripples[rippleIdx % MAXR].set(w.x, w.y, uTime.value, 1);
      rippleIdx++;
      waterMat.uniforms.uRippleCount.value = Math.min(rippleIdx, MAXR);
    }
    let running = true;
    let last = performance.now();
    function onVisibility() {
      running = !document.hidden;
      last = performance.now();
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    // ---- loop ----
    let raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!running) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      uTime.value = now / 1000;

      fish.forEach((f) => f.update(dt, uTime.value, pointer));
      renderer.render(scene, camera);
    }

    if (reduced) {
      renderer.render(scene, camera);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      fish.forEach((f) => f.dispose());
      waterMat.dispose();
      koiTextures.forEach((t) => t.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="koi-canvas" aria-hidden="true" />;
}
