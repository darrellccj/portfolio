import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
//  KOI POND — WebGL (three.js), hand-drawn ink style
//  Each koi is a black-and-white line-art texture (bold outlines,
//  outlined/filled patches, hatched fins, barbels) drawn straight,
//  then mapped onto a finely subdivided plane that is bent each
//  frame to follow a trailing spine — so the body genuinely curves
//  along its path as it swims. Fish are unlit (flat ink), floating
//  above a calm cream water shader with faint caustics and ripples.
// ─────────────────────────────────────────────────────────────

const rand = (a, b) => a + Math.random() * (b - a);

const INK = '#1a1712';
const PAPER = '#fbfaf5';
const BENI = '#d64f2a'; // koi red-orange (hi) — the Kohaku signal
const SUMI = '#2a2622'; // soft sumi-black accents (Sanke/Showa)

// Koi colour varieties. `beni` = red-orange patches, `sumi` = black accents,
// each placed along the body at s (0 tail … 1 head) with size factor r.
// Modelled on real koi: mostly Kohaku (red on white), a couple with sumi.
const VARIETIES = [
  { beni: [{ s: 0.68, r: 1.05 }, { s: 0.47, r: 0.95 }, { s: 0.3, r: 0.7 }], sumi: [] },
  { beni: [{ s: 0.6, r: 1.2 }, { s: 0.38, r: 0.85 }], sumi: [] },
  { beni: [{ s: 0.64, r: 1.0 }, { s: 0.44, r: 0.85 }], sumi: [{ s: 0.55, r: 0.45 }, { s: 0.34, r: 0.4 }] },
  { beni: [{ s: 0.56, r: 1.3 }], sumi: [] },
  { beni: [{ s: 0.72, r: 0.85 }, { s: 0.5, r: 0.6 }], sumi: [] },
];

// Draw one ink koi to an offscreen canvas, head at the right (+X), straight
// pose. The mesh bends it, so the drawing itself stays uncurved.
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
  const noseX = 602;
  const tailBaseX = 156;
  const caudalTip = 40;
  const maxHalf = 66;
  const OUT = 4.5; // body outline weight

  // Half-width profile: widest across the shoulders (just behind the head),
  // rounding to a soft snout and tapering to a slim tail base — a koi's plump
  // fusiform body seen from directly above.
  const halfH = (s) => {
    if (s < 0.6) return 8 + (maxHalf - 8) * Math.pow(Math.sin((s / 0.6) * (Math.PI / 2)), 0.9);
    const k = (s - 0.6) / 0.4; // shoulder → nose
    return maxHalf - (maxHalf - 26) * Math.pow(k, 1.6);
  };
  const toS = (x) => (x - tailBaseX) / (noseX - tailBaseX);

  const bodyPath = () => {
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      const yy = y0 - halfH(toS(x));
      i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.quadraticCurveTo(noseX + 20, y0, noseX, y0 + halfH(1));
    for (let i = steps; i >= 0; i--) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      ctx.lineTo(x, y0 + halfH(toS(x)));
    }
    ctx.closePath();
  };

  // ---- fins: pale and translucent, so they melt into the water like real
  // koi fins rather than reading as bold black paddles ----
  const FIN_FILL = 'rgba(252,251,247,0.58)';
  const FIN_LINE = 'rgba(38,34,28,0.4)';
  const FIN_RAY = 'rgba(38,34,28,0.28)';
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

  // caudal (tail) fin — a single flowing translucent fan
  fin(
    () => {
      ctx.moveTo(tailBaseX + 4, y0 - 5);
      ctx.quadraticCurveTo(caudalTip + 8, y0 - 42, caudalTip - 14, y0 - 60);
      ctx.quadraticCurveTo(caudalTip + 2, y0 - 26, caudalTip + 2, y0);
      ctx.quadraticCurveTo(caudalTip + 2, y0 + 26, caudalTip - 14, y0 + 60);
      ctx.quadraticCurveTo(caudalTip + 8, y0 + 42, tailBaseX + 4, y0 + 5);
    },
    () => {
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(tailBaseX + 2, y0);
        ctx.lineTo(caudalTip - 6, y0 + i * 9);
        ctx.stroke();
      }
    }
  );

  // pectoral fins — small rounded translucent paddles at the shoulders
  const pectoral = (dir) => {
    const px = 452;
    const py = y0 + dir * (halfH(toS(px)) - 4);
    fin(
      () => {
        ctx.moveTo(px + 12, py - dir * 2);
        ctx.quadraticCurveTo(px - 6, py + dir * 20, px - 30, py + dir * 34);
        ctx.quadraticCurveTo(px - 12, py + dir * 40, px + 2, py + dir * 33);
        ctx.quadraticCurveTo(px + 8, py + dir * 18, px - 2, py + dir * 3);
      },
      () => {
        for (let i = 0; i < 4; i++) {
          const f = i / 3;
          ctx.beginPath();
          ctx.moveTo(px + 4, py);
          ctx.lineTo(px - 28 + f * 26, py + dir * (32 + f * 4));
          ctx.stroke();
        }
      }
    );
  };
  pectoral(1);
  pectoral(-1);

  // pelvic fins — tiny translucent paddles toward the belly
  const pelvic = (dir) => {
    const px = 322;
    const py = y0 + dir * (halfH(toS(px)) - 3);
    fin(
      () => {
        ctx.moveTo(px + 8, py - dir * 2);
        ctx.quadraticCurveTo(px - 6, py + dir * 14, px - 22, py + dir * 22);
        ctx.quadraticCurveTo(px - 8, py + dir * 26, px + 2, py + dir * 21);
        ctx.quadraticCurveTo(px + 6, py + dir * 11, px - 2, py + dir * 2);
      },
      () => {
        for (let i = 0; i < 3; i++) {
          const f = i / 2;
          ctx.beginPath();
          ctx.moveTo(px + 2, py);
          ctx.lineTo(px - 20 + f * 18, py + dir * (21 + f * 3));
          ctx.stroke();
        }
      }
    );
  };
  pelvic(1);
  pelvic(-1);

  // ---- body ----
  bodyPath();
  ctx.fillStyle = PAPER;
  ctx.fill();

  // ---- koi markings: soft red-orange (beni) blotches with optional sumi,
  // clipped to the body — the pattern that actually says "koi" ----
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
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.88 };
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
  (v.beni || []).forEach((m) => {
    const x = tailBaseX + (noseX - tailBaseX) * m.s;
    blob(x, y0 + rand(-6, 6), halfH(m.s) * 0.95 * m.r, BENI);
  });
  (v.sumi || []).forEach((m) => {
    const x = tailBaseX + (noseX - tailBaseX) * m.s;
    blob(x, y0 + rand(-10, 10), halfH(m.s) * 0.95 * m.r, SUMI);
  });

  ctx.restore();

  // ---- body outline on top ----
  bodyPath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = OUT;
  ctx.stroke();

  // ---- eyes: small dots set on the sides of the head, as seen from above ----
  for (const dir of [1, -1]) {
    const ex = 548;
    const ey = y0 + dir * (halfH(toS(ex)) - 10);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- mouth + short barbels framing the snout (top view) ----
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(noseX - 2, y0 - 7);
  ctx.quadraticCurveTo(noseX + 8, y0, noseX - 2, y0 + 7);
  ctx.stroke();
  ctx.lineWidth = 1.7;
  for (const dir of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(noseX - 1, y0 + dir * 6);
    ctx.quadraticCurveTo(noseX + 10, y0 + dir * 9, noseX + 13, y0 + dir * 16);
    ctx.stroke();
  }

  return cv;
}

// Ink line-art lily pad — paper fill, black outline, radial veins, bloom.
function makePadCanvas() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  ctx.lineCap = 'round';
  const c = S / 2;
  const r = S * 0.42;
  const gap = 0.5;
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c, r, gap / 2, Math.PI * 2 - gap / 2);
  ctx.lineTo(c, c);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 9; i++) {
    const a = gap / 2 + (i / 9) * (Math.PI * 2 - gap);
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a) * r * 0.86, c + Math.sin(a) * r * 0.86);
    ctx.stroke();
  }
  // simple bloom outline at the centre
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(c + Math.cos(a) * 7, c + Math.sin(a) * 7, 5, 10, a, 0, Math.PI * 2);
    ctx.stroke();
  }
  return cv;
}

const WATER_VERT = `
  varying vec2 vXZ;
  void main() {
    vXZ = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WATER_FRAG = `
  precision highp float;
  varying vec2 vXZ;
  uniform float uTime;
  uniform vec2 uExtent;
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
    vec2 uv = vXZ / uExtent;
    float d = length(uv);
    vec3 base = mix(vec3(0.968,0.949,0.910), vec3(0.906,0.868,0.788), smoothstep(0.0,0.9,d));

    // very faint caustics so the ink fish stay the focus
    vec2 p = vXZ * 0.05;
    float c = fbm(p + vec2(uTime*0.045, uTime*0.03));
    c += fbm(p*1.7 - vec2(uTime*0.035, uTime*0.02));
    base += vec3(0.05,0.045,0.032) * pow(smoothstep(0.6,1.5,c), 1.7);

    for(int i=0;i<MAXR;i++){
      if(i>=uRippleCount) break;
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if(age<0.0 || age>3.0) continue;
      float dist = length(vXZ - r.xy);
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
    renderer.setClearColor(0xf1e9d8, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();

    const FRUST = 100;
    let aspect = 1;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.set(0, 100, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    const uTime = { value: 0 };
    let extentX = FRUST;
    let extentZ = FRUST;

    // ---- water ----
    const MAXR = 12;
    const ripples = new Array(MAXR).fill(0).map(() => new THREE.Vector4(0, 0, -10, 0));
    const waterMat = new THREE.ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: WATER_FRAG,
      uniforms: {
        uTime,
        uExtent: { value: new THREE.Vector2(FRUST, FRUST) },
        uRippleCount: { value: 0 },
        uRipples: { value: ripples },
      },
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    water.renderOrder = 0;
    scene.add(water);

    // ---- textures ----
    const koiTextures = VARIETIES.map((v) => {
      const tex = new THREE.CanvasTexture(makeKoiCanvas(v));
      tex.anisotropy = 8;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
    const padTex = new THREE.CanvasTexture(makePadCanvas());
    padTex.colorSpace = THREE.SRGBColorSpace;

    // ---- fish ----
    // Follow-the-leader spine: the head wanders (with a gentle sway) and each
    // body segment trails the one ahead at a fixed distance; the mesh is bent
    // each frame to follow that spine so the body curves along its path.
    class Fish {
      constructor() {
        this.scale = rand(6, 11);
        this.len = this.scale * 2;
        this.width = this.len * 0.5;
        this.segCount = 40;
        this.seg = this.len / (this.segCount - 1);
        this.speed = rand(6.5, 10) / Math.sqrt(this.scale / 6);
        this.angle = rand(0, Math.PI * 2);
        this.target = this.angle;
        this.wander = 0;
        this.finPhase = rand(0, Math.PI * 2);
        this.depth = rand(0.5, 1);
        this.depthY = 0.4 * this.depth;
        this.speedBoost = 0;

        const x0 = rand(-extentX / 2, extentX / 2);
        const z0 = rand(-extentZ / 2, extentZ / 2);
        this.spine = [];
        for (let i = 0; i < this.segCount; i++) {
          this.spine.push({
            x: x0 - Math.cos(this.angle) * this.seg * i,
            z: z0 - Math.sin(this.angle) * this.seg * i,
          });
        }

        this.geo = new THREE.PlaneGeometry(this.len, this.width, 120, 4);
        const pos = this.geo.attributes.position;
        this.baseX = new Float32Array(pos.count);
        this.baseY = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
          this.baseX[i] = pos.getX(i);
          this.baseY[i] = pos.getY(i);
        }

        const vi = (Math.random() * VARIETIES.length) | 0;
        // straight alpha blend (no alphaTest) keeps the inked edges smooth
        this.mat = new THREE.MeshBasicMaterial({
          map: koiTextures[vi],
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        this.mat.opacity = 0.6 + this.depth * 0.4; // deeper fish read fainter

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
          this.target += rand(-0.9, 0.9);
          this.wander = rand(1.2, 3.2);
        }
        if (pointer.active) {
          const dx = head.x - pointer.x;
          const dz = head.z - pointer.z;
          const d = Math.hypot(dx, dz);
          const R = 24;
          if (d < R) {
            this.target = Math.atan2(dz, dx);
            this.speedBoost = (1 - d / R) * this.speed * 2.2;
          }
        }
        const mx = extentX / 2 - 8;
        const mz = extentZ / 2 - 8;
        if (head.x < -mx) this.target = 0;
        else if (head.x > mx) this.target = Math.PI;
        if (head.z < -mz) this.target = Math.PI / 2;
        else if (head.z > mz) this.target = -Math.PI / 2;

        let diff = this.target - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * Math.min(1, dt * 3.4);

        const boost = this.speedBoost;
        this.speedBoost *= 0.9;
        const v = (this.speed + boost) * dt;

        const sway = Math.sin(t * 3.5 + this.finPhase) * 0.12;
        const heading = this.angle + sway;
        head.x += Math.cos(heading) * v;
        head.z += Math.sin(heading) * v;

        for (let i = 1; i < this.spine.length; i++) {
          const p = this.spine[i - 1];
          const c = this.spine[i];
          const a = Math.atan2(c.z - p.z, c.x - p.x);
          c.x = p.x + Math.cos(a) * this.seg;
          c.z = p.z + Math.sin(a) * this.seg;
        }

        // Relax the spine: the rigid follow-the-leader chain kinks at hard
        // turns, so pull each interior joint toward the midpoint of its
        // neighbours. A couple of light passes rounds the bends off without
        // washing out the overall curve (the head is left fixed).
        for (let pass = 0; pass < 2; pass++) {
          for (let i = 1; i < this.spine.length - 1; i++) {
            const a = this.spine[i - 1];
            const b = this.spine[i];
            const c = this.spine[i + 1];
            b.x = b.x * 0.6 + (a.x + c.x) * 0.2;
            b.z = b.z * 0.6 + (a.z + c.z) * 0.2;
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
          // Catmull-Rom through the spine points → a smooth body curve
          const p0 = s[i1 - 1 < 0 ? 0 : i1 - 1];
          const p1 = s[i1];
          const p2 = s[i1 + 1];
          const p3 = s[i1 + 2 > N - 1 ? N - 1 : i1 + 2];
          const t2 = t * t;
          const t3 = t2 * t;
          const cx =
            0.5 *
            (2 * p1.x +
              (-p0.x + p2.x) * t +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
          const cz =
            0.5 *
            (2 * p1.z +
              (-p0.z + p2.z) * t +
              (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
              (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);
          // derivative of the spline → tangent (points tail-ward as f grows)
          const dx =
            0.5 *
            (-p0.x + p2.x +
              2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t +
              3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
          const dz =
            0.5 *
            (-p0.z + p2.z +
              2 * (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t +
              3 * (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t2);
          // head-ward unit tangent; perpendicular (tz, -tx) faces the camera
          let tx = -dx;
          let tz = -dz;
          const tl = Math.hypot(tx, tz) || 1;
          tx /= tl;
          tz /= tl;
          pos.setXYZ(i, cx + tz * oy, this.depthY, cz - tx * oy);
        }
        pos.needsUpdate = true;
      }

      dispose() {
        scene.remove(this.mesh);
        this.geo.dispose();
        this.mat.dispose();
      }
    }

    // ---- lily pads ----
    const pads = [];
    function makePads() {
      pads.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });
      pads.length = 0;
      const count = extentX < 90 ? 2 : 4;
      for (let i = 0; i < count; i++) {
        const size = rand(9, 15);
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(size, size),
          new THREE.MeshBasicMaterial({ map: padTex, transparent: true, depthWrite: false })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = rand(0, Math.PI * 2);
        mesh.position.set(rand(-extentX / 2, extentX / 2), 0.6, rand(-extentZ / 2, extentZ / 2));
        mesh.renderOrder = 3;
        scene.add(mesh);
        pads.push({ mesh, phase: rand(0, Math.PI * 2) });
      }
    }

    let fish = [];
    function buildFish() {
      fish.forEach((f) => f.dispose());
      const area = extentX * extentZ;
      const count = Math.max(5, Math.min(10, Math.round(area / 1400)));
      fish = Array.from({ length: count }, () => new Fish());
    }

    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      aspect = w / h;
      renderer.setSize(w, h, false);
      extentX = FRUST * aspect;
      extentZ = FRUST;
      camera.left = -extentX / 2;
      camera.right = extentX / 2;
      camera.top = extentZ / 2;
      camera.bottom = -extentZ / 2;
      camera.updateProjectionMatrix();
      water.scale.set(extentX * 1.3, extentZ * 1.3, 1);
      waterMat.uniforms.uExtent.value.set(extentX * 0.5, extentZ * 0.5);
    }

    resize();
    buildFish();
    makePads();

    // ---- interaction (window-level; the canvas is a fixed backdrop) ----
    const pointer = { x: 0, z: 0, active: false };
    let rippleIdx = 0;
    function toWorld(cx, cy) {
      const ndcx = (cx / canvas.clientWidth) * 2 - 1;
      const ndcy = (cy / canvas.clientHeight) * 2 - 1;
      return { x: ndcx * extentX * 0.5, z: ndcy * extentZ * 0.5 };
    }
    function onMove(e) {
      const w = toWorld(e.clientX, e.clientY);
      pointer.x = w.x;
      pointer.z = w.z;
      pointer.active = true;
    }
    function onLeave() {
      pointer.active = false;
    }
    function onDown(e) {
      if (e.target.closest && e.target.closest('a, button, input, textarea')) return;
      const w = toWorld(e.clientX, e.clientY);
      ripples[rippleIdx % MAXR].set(w.x, w.z, uTime.value, 1);
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
      pads.forEach((p) => {
        p.mesh.position.y = 0.6 + Math.sin(uTime.value * 0.8 + p.phase) * 0.15;
        p.mesh.rotation.z += dt * 0.02;
      });
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
      pads.forEach((p) => {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });
      waterMat.dispose();
      koiTextures.forEach((t) => t.dispose());
      padTex.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="koi-canvas" aria-hidden="true" />;
}
