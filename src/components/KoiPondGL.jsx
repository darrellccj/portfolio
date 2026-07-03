import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
//  KOI POND — WebGL (three.js)
//  Each koi is a detailed painted texture on a finely subdivided
//  plane that flexes with a traveling-wave vertex shader, so the
//  whole body undulates and the tail swishes as one. Fish are lit
//  for a soft wet sheen and swim above a custom water shader with
//  animated caustics and interactive ripples.
// ─────────────────────────────────────────────────────────────

const rand = (a, b) => a + Math.random() * (b - a);

// Authentic koi varieties. `marks` are organic colour patches placed
// along the body (s = 0 tail … 1 head); `fin` is the translucent fin RGB.
const VARIETIES = [
  {
    name: 'kohaku', // white + red
    base: ['#fbf7f0', '#f2ebdf'],
    fin: '250,246,239',
    marks: [
      { c: '#d2662f', s: 0.72, r: 1.25 },
      { c: '#c6531f', s: 0.5, r: 1.05 },
      { c: '#d2662f', s: 0.28, r: 0.85 },
    ],
  },
  {
    name: 'sanke', // white + red + black flecks
    base: ['#faf6ee', '#efe7d8'],
    fin: '250,246,239',
    marks: [
      { c: '#cf5a24', s: 0.66, r: 1.15 },
      { c: '#cf5a24', s: 0.38, r: 0.95 },
      { c: '#2a2620', s: 0.55, r: 0.42 },
      { c: '#2a2620', s: 0.24, r: 0.36 },
    ],
  },
  {
    name: 'showa', // black base + red + white
    base: ['#2a201b', '#1c1512'],
    fin: '90,78,70',
    marks: [
      { c: '#eae2d4', s: 0.7, r: 1.15 },
      { c: '#cf5a24', s: 0.5, r: 1.1 },
      { c: '#eae2d4', s: 0.3, r: 0.95 },
      { c: '#cf5a24', s: 0.6, r: 0.55 },
    ],
  },
  {
    name: 'ogon', // metallic solid orange-gold
    base: ['#eaa24a', '#d9812f'],
    fin: '240,190,130',
    marks: [],
  },
  {
    name: 'platinum', // metallic near-white
    base: ['#eef0ea', '#dfe0d8'],
    fin: '245,246,240',
    marks: [{ c: '#d9dcd2', s: 0.5, r: 1.0 }],
  },
];

// Draw one koi to an offscreen canvas (head at the right / +X). The mesh
// bending animates it, so this art can be static and highly detailed.
function makeKoiCanvas(v) {
  const W = 640;
  const H = 320;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  const y0 = H / 2;
  const noseX = 590;
  const tailBaseX = 150;
  const caudalTip = 44;
  const maxHalf = 66;

  // body half-height at normalised position s (0 = tail base, 1 = nose)
  const halfH = (s) => {
    if (s < 0.7) return 8 + (maxHalf - 8) * Math.pow(Math.sin((s / 0.7) * (Math.PI / 2)), 0.9);
    const k = (s - 0.7) / 0.3;
    return maxHalf - (maxHalf - 22) * Math.pow(k, 1.4);
  };
  const toS = (x) => (x - tailBaseX) / (noseX - tailBaseX);

  const finCol = (a) => `rgba(${v.fin},${a})`;

  // ---- caudal (tail) fin: two flowing lobes with rays ----
  const drawCaudal = () => {
    const bx = tailBaseX;
    const g = ctx.createLinearGradient(bx, y0, caudalTip, y0);
    g.addColorStop(0, finCol(0.34));
    g.addColorStop(1, finCol(0.04));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx, y0 - 6);
    ctx.quadraticCurveTo(caudalTip + 40, y0 - 70, caudalTip, y0 - 78);
    ctx.quadraticCurveTo(caudalTip + 46, y0 - 20, bx + 6, y0);
    ctx.quadraticCurveTo(caudalTip + 46, y0 + 20, caudalTip, y0 + 78);
    ctx.quadraticCurveTo(caudalTip + 40, y0 + 70, bx, y0 + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = finCol(0.16);
    ctx.lineWidth = 1.3;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(bx, y0);
      ctx.lineTo(caudalTip + 26, y0 + i * 12);
      ctx.stroke();
    }
  };

  // ---- pectoral fins (paired, mid-body, flowing translucent) ----
  const drawPectoral = (dir) => {
    const px = 430;
    const py = y0 + dir * (halfH(toS(px)) - 6);
    const g = ctx.createRadialGradient(px, py, 4, px, py, 62);
    g.addColorStop(0, finCol(0.3));
    g.addColorStop(1, finCol(0.03));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(px + 6, py);
    ctx.quadraticCurveTo(px - 40, py + dir * 28, px - 58, py + dir * 54);
    ctx.quadraticCurveTo(px - 6, py + dir * 40, px - 10, py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = finCol(0.14);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 44 + i * 6, py + dir * (56 - i * 4));
      ctx.stroke();
    }
  };

  drawCaudal();
  drawPectoral(1);
  drawPectoral(-1);

  // ---- body silhouette path ----
  const bodyPath = () => {
    ctx.beginPath();
    const steps = 48;
    // top edge, tail → nose
    for (let i = 0; i <= steps; i++) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      const yy = y0 - halfH(toS(x));
      i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    // round the nose
    ctx.quadraticCurveTo(noseX + 22, y0, noseX, y0 + halfH(1));
    // bottom edge, nose → tail
    for (let i = steps; i >= 0; i--) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      ctx.lineTo(x, y0 + halfH(toS(x)));
    }
    ctx.closePath();
  };

  // base body fill
  bodyPath();
  const bg = ctx.createLinearGradient(0, y0 - maxHalf, 0, y0 + maxHalf);
  bg.addColorStop(0, v.base[1]);
  bg.addColorStop(0.5, v.base[0]);
  bg.addColorStop(1, v.base[1]);
  ctx.fillStyle = bg;
  ctx.fill();

  // interior detail, clipped to the body
  ctx.save();
  bodyPath();
  ctx.clip();

  // organic colour patches
  const blob = (cx, cy, rr, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    const n = 10;
    const rad = [];
    for (let i = 0; i < n; i++) rad.push(rr * (0.72 + Math.random() * 0.5));
    const pt = (i) => {
      const a = (i / n) * Math.PI * 2;
      const r = rad[(i + n) % n];
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8 };
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
    ctx.fill();
  };
  v.marks.forEach((m) => {
    const x = tailBaseX + (noseX - tailBaseX) * m.s;
    blob(x, y0 + rand(-10, 10), halfH(m.s) * 0.9 * m.r, m.c);
  });

  // cross-body volume shading (cylinder): lighter centre, darker edges
  const vg = ctx.createLinearGradient(0, y0 - maxHalf, 0, y0 + maxHalf);
  vg.addColorStop(0, 'rgba(0,0,0,0.16)');
  vg.addColorStop(0.32, 'rgba(255,255,255,0.12)');
  vg.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  vg.addColorStop(0.68, 'rgba(255,255,255,0.06)');
  vg.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // faint scale stipple for texture
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let x = tailBaseX + 20; x < noseX - 40; x += 16) {
    const h = halfH(toS(x));
    for (let y = -h + 8; y < h - 8; y += 12) {
      ctx.beginPath();
      ctx.arc(x, y0 + y, 7, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  }
  ctx.restore();

  // ---- dorsal fin: translucent ridge along the mid-back ----
  ctx.fillStyle = finCol(0.16);
  ctx.beginPath();
  ctx.moveTo(220, y0 - 4);
  ctx.quadraticCurveTo(300, y0 - 30, 380, y0 - 4);
  ctx.quadraticCurveTo(300, y0 + 2, 220, y0 - 4);
  ctx.closePath();
  ctx.fill();

  // ---- eyes ----
  const ex = 540;
  for (const dir of [1, -1]) {
    const ey = y0 + dir * 26;
    ctx.fillStyle = 'rgba(26,20,15,0.92)';
    ctx.beginPath();
    ctx.arc(ex, ey, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(ex - 2, ey - 2, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- barbels (whiskers) ----
  ctx.strokeStyle = 'rgba(40,30,22,0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const dir of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(noseX - 6, y0 + dir * 8);
    ctx.quadraticCurveTo(noseX + 24, y0 + dir * 14, noseX + 30, y0 + dir * 30);
    ctx.stroke();
  }

  return cv;
}

function makePadCanvas() {
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  const c = S / 2;
  const r = S * 0.44;
  const gap = 0.5;
  const g = ctx.createRadialGradient(c, c, r * 0.2, c, c, r);
  g.addColorStop(0, '#86a06c');
  g.addColorStop(1, '#657f52');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, r, gap / 2, Math.PI * 2 - gap / 2);
  ctx.lineTo(c, c);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = gap / 2 + (i / 8) * (Math.PI * 2 - gap);
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + Math.cos(a) * r * 0.9, c + Math.sin(a) * r * 0.9);
    ctx.stroke();
  }
  return cv;
}

// soft radial shadow blob
function makeShadowCanvas() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(40,30,18,0.5)');
  g.addColorStop(1, 'rgba(40,30,18,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return cv;
}

const WATER_VERT = `
  varying vec2 vXZ;
  void main() {
    vXZ = position.xy; // plane is built in XY then laid flat
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
  uniform vec4 uRipples[MAXR]; // xy=center, z=startTime, w=strength

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
    vec2 uv = vXZ / uExtent;            // roughly -0.5..0.5
    float d = length(uv);

    // cream base, lit toward the centre
    vec3 base = mix(vec3(0.968,0.949,0.910), vec3(0.902,0.863,0.780), smoothstep(0.0,0.9,d));

    // drifting caustics — bright veins where the noise fields overlap
    vec2 p = vXZ * 0.055;
    float c = fbm(p + vec2(uTime*0.05, uTime*0.03));
    c += fbm(p*1.7 - vec2(uTime*0.04, uTime*0.02));
    float veins = pow(smoothstep(0.55, 1.5, c), 1.6);
    base += vec3(0.14,0.125,0.09) * veins;
    // faint darker troughs for contrast
    base -= vec3(0.05,0.045,0.03) * smoothstep(0.9, 0.2, c);

    // interactive ripples
    for(int i=0;i<MAXR;i++){
      if(i>=uRippleCount) break;
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if(age<0.0 || age>3.0) continue;
      float dist = length(vXZ - r.xy);
      float ring = sin(dist*0.5 - age*6.0) * exp(-dist*0.03) * exp(-age*1.4);
      base += vec3(0.08) * ring * r.w;
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
      // No WebGL — leave the cream page background as a graceful fallback.
      return;
    }
    renderer.setClearColor(0xf1e9d8, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);

    const scene = new THREE.Scene();

    // top-down orthographic camera; screen-up = -Z so world +X is right
    const FRUST = 100;
    let aspect = 1;
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    camera.position.set(0, 100, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    // lighting for a soft wet sheen
    scene.add(new THREE.HemisphereLight(0xfff6e8, 0x5b4a36, 1.05));
    const key = new THREE.DirectionalLight(0xfff1dc, 1.15);
    key.position.set(-40, 80, -30);
    scene.add(key);

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

    // ---- shared textures ----
    const koiTextures = VARIETIES.map((v) => {
      const tex = new THREE.CanvasTexture(makeKoiCanvas(v));
      tex.anisotropy = 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
    const padTex = new THREE.CanvasTexture(makePadCanvas());
    padTex.colorSpace = THREE.SRGBColorSpace;
    const shadowTex = new THREE.CanvasTexture(makeShadowCanvas());

    // ---- fish ----
    // Movement is the follow-the-leader spine from the original 2D pond: the
    // head wanders (with a gentle sway) and each body segment trails the one
    // ahead at a fixed distance, so the body genuinely curves along its path.
    // Each frame the koi mesh is bent to follow that spine.
    class Fish {
      constructor() {
        this.scale = rand(6, 11);
        this.len = this.scale * 2; // world length (nose → tail-fin tip)
        this.width = this.len * 0.5;
        this.segCount = 12;
        this.seg = this.len / (this.segCount - 1);
        this.speed = rand(6.5, 10) / Math.sqrt(this.scale / 6);
        this.angle = rand(0, Math.PI * 2);
        this.target = this.angle;
        this.wander = 0;
        this.finPhase = rand(0, Math.PI * 2);
        this.depth = rand(0.5, 1);
        this.depthY = 0.4 * this.depth;
        this.speedBoost = 0;

        // trailing spine (world XZ), head at index 0
        const x0 = rand(-extentX / 2, extentX / 2);
        const z0 = rand(-extentZ / 2, extentZ / 2);
        this.spine = [];
        for (let i = 0; i < this.segCount; i++) {
          this.spine.push({
            x: x0 - Math.cos(this.angle) * this.seg * i,
            z: z0 - Math.sin(this.angle) * this.seg * i,
          });
        }

        // subdivided plane; we mutate its positions to follow the spine
        this.geo = new THREE.PlaneGeometry(this.len, this.width, 26, 2);
        const pos = this.geo.attributes.position;
        this.baseX = new Float32Array(pos.count);
        this.baseY = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
          this.baseX[i] = pos.getX(i);
          this.baseY[i] = pos.getY(i);
        }
        // fish lies flat facing up; pin normals up for even lighting
        const nrm = this.geo.attributes.normal;
        for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
        nrm.needsUpdate = true;

        const vi = (Math.random() * VARIETIES.length) | 0;
        const metal = VARIETIES[vi].name === 'ogon' || VARIETIES[vi].name === 'platinum';
        this.mat = new THREE.MeshStandardMaterial({
          map: koiTextures[vi],
          transparent: true,
          alphaTest: 0.02,
          depthWrite: false,
          roughness: 0.55,
          metalness: metal ? 0.45 : 0.12,
          side: THREE.DoubleSide,
        });
        this.mat.color.setScalar(0.7 + this.depth * 0.3);
        this.mat.opacity = 0.55 + this.depth * 0.45;

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.mesh.renderOrder = 2;
        this.mesh.frustumCulled = false; // verts live in world space
        scene.add(this.mesh);

        // soft shadow on the pond floor
        this.shadow = new THREE.Mesh(
          new THREE.PlaneGeometry(this.len * 1.1, this.width * 1.15),
          new THREE.MeshBasicMaterial({
            map: shadowTex,
            transparent: true,
            depthWrite: false,
            opacity: 0.5 * this.depth,
          })
        );
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.renderOrder = 1;
        scene.add(this.shadow);

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
        this.angle += diff * Math.min(1, dt * 2.2);

        const boost = this.speedBoost;
        this.speedBoost *= 0.9;
        const v = (this.speed + boost) * dt;

        // gentle side-to-side sway gives the swimming S-curve
        const sway = Math.sin(t * 3.5 + this.finPhase) * 0.12;
        const heading = this.angle + sway;
        head.x += Math.cos(heading) * v;
        head.z += Math.sin(heading) * v;

        // follow-the-leader: each segment trails the previous at fixed dist
        for (let i = 1; i < this.spine.length; i++) {
          const p = this.spine[i - 1];
          const c = this.spine[i];
          const a = Math.atan2(c.z - p.z, c.x - p.x);
          c.x = p.x + Math.cos(a) * this.seg;
          c.z = p.z + Math.sin(a) * this.seg;
        }

        this.deform();

        // shadow follows the body centre, offset toward the light
        const mid = this.spine[(this.segCount / 2) | 0];
        this.shadow.position.set(mid.x + 2, -0.45, mid.z + 2);
        this.shadow.rotation.z = 0;
        this.shadow.rotation.y = -this.angle;
      }

      // Bend the plane so its length axis follows the spine curve.
      deform() {
        const pos = this.geo.attributes.position;
        const N = this.segCount;
        const s = this.spine;
        for (let i = 0; i < pos.count; i++) {
          const ox = this.baseX[i];
          const oy = this.baseY[i];
          const u = (ox + this.len / 2) / this.len; // 0 tail … 1 head
          const f = (1 - u) * (N - 1); // 0 head … N-1 tail
          let i0 = Math.floor(f);
          if (i0 > N - 2) i0 = N - 2;
          if (i0 < 0) i0 = 0;
          const frac = f - i0;
          const a = s[i0];
          const b = s[i0 + 1];
          const cx = a.x + (b.x - a.x) * frac;
          const cz = a.z + (b.z - a.z) * frac;
          // head-ward tangent, then perpendicular for the across offset
          let tx = a.x - b.x;
          let tz = a.z - b.z;
          const tl = Math.hypot(tx, tz) || 1;
          tx /= tl;
          tz /= tl;
          // perpendicular (tz, -tx) keeps the lit face pointing up at the camera
          pos.setXYZ(i, cx + tz * oy, this.depthY, cz - tx * oy);
        }
        pos.needsUpdate = true;
      }

      dispose() {
        scene.remove(this.mesh);
        scene.remove(this.shadow);
        this.geo.dispose();
        this.mat.dispose();
        this.shadow.geometry.dispose();
        this.shadow.material.dispose();
      }
    }

    // ---- lily pads ----
    const pads = [];
    function makePads() {
      pads.forEach((p) => scene.remove(p.mesh));
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

    // ---- interaction (window-level, since the canvas is a fixed backdrop) ----
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
    let last = performance.now();
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
      waterMat.dispose();
      koiTextures.forEach((t) => t.dispose());
      padTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="koi-canvas" aria-hidden="true" />;
}
