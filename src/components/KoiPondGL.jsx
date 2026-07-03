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

// Ink patterning variants. `marks` are koi patches placed along the body
// (s = 0 tail … 1 head); `fill: true` = a solid sumi patch, false = outline.
const VARIETIES = [
  { marks: [{ s: 0.72, r: 1.1, fill: false }, { s: 0.5, r: 0.9, fill: false }, { s: 0.3, r: 0.8, fill: true }] },
  { marks: [{ s: 0.66, r: 1.15, fill: true }, { s: 0.4, r: 0.9, fill: false }] },
  { marks: [{ s: 0.7, r: 1.0, fill: false }, { s: 0.52, r: 0.85, fill: true }, { s: 0.32, r: 0.75, fill: true }] },
  { marks: [] }, // plain white koi
  { marks: [{ s: 0.6, r: 1.2, fill: false }, { s: 0.34, r: 0.7, fill: false }] },
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
  const noseX = 600;
  const tailBaseX = 150;
  const caudalTip = 40;
  const maxHalf = 70;
  const OUT = 6; // body outline weight
  const RAY = 2.4; // fin ray weight
  const MID = 3; // interior line weight

  const halfH = (s) => {
    if (s < 0.72) return 9 + (maxHalf - 9) * Math.pow(Math.sin((s / 0.72) * (Math.PI / 2)), 0.9);
    const k = (s - 0.72) / 0.28;
    return maxHalf - (maxHalf - 24) * Math.pow(k, 1.5);
  };
  const toS = (x) => (x - tailBaseX) / (noseX - tailBaseX);

  const bodyPath = () => {
    ctx.beginPath();
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      const yy = y0 - halfH(toS(x));
      i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.quadraticCurveTo(noseX + 24, y0, noseX, y0 + halfH(1));
    for (let i = steps; i >= 0; i--) {
      const x = tailBaseX + ((noseX - tailBaseX) * i) / steps;
      ctx.lineTo(x, y0 + halfH(toS(x)));
    }
    ctx.closePath();
  };

  // ---- fins (drawn first; the body fill hides their roots) ----
  const finShape = (build, rays) => {
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = OUT * 0.7;
    ctx.beginPath();
    build();
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = RAY;
    rays();
  };

  // caudal (tail) fin — long and flowing with fanned rays
  finShape(
    () => {
      ctx.moveTo(tailBaseX, y0 - 6);
      ctx.quadraticCurveTo(caudalTip + 28, y0 - 66, caudalTip - 8, y0 - 74);
      ctx.quadraticCurveTo(caudalTip + 30, y0 - 12, tailBaseX + 6, y0);
      ctx.quadraticCurveTo(caudalTip + 30, y0 + 12, caudalTip - 8, y0 + 74);
      ctx.quadraticCurveTo(caudalTip + 28, y0 + 66, tailBaseX, y0 + 6);
    },
    () => {
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(tailBaseX, y0);
        ctx.lineTo(caudalTip + 14, y0 + i * 11.5);
        ctx.stroke();
      }
    }
  );

  // pectoral fins (both sides)
  const pectoral = (dir) => {
    const px = 440;
    const py = y0 + dir * (halfH(toS(px)) - 6);
    finShape(
      () => {
        ctx.moveTo(px + 8, py - dir * 4);
        ctx.quadraticCurveTo(px - 34, py + dir * 22, px - 54, py + dir * 50);
        ctx.quadraticCurveTo(px - 2, py + dir * 34, px - 8, py - dir * 2);
      },
      () => {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(px - 6, py);
          ctx.lineTo(px - 46 + i * 8, py + dir * (52 - i * 4));
          ctx.stroke();
        }
      }
    );
  };
  pectoral(1);
  pectoral(-1);

  // ---- body ----
  bodyPath();
  ctx.fillStyle = PAPER;
  ctx.fill();

  // interior detail, clipped to the body
  ctx.save();
  bodyPath();
  ctx.clip();

  // organic koi patches (outlined, some filled sumi-black)
  const blob = (cx, cy, rr, fill) => {
    ctx.beginPath();
    const n = 11;
    const radii = [];
    for (let i = 0; i < n; i++) radii.push(rr * (0.72 + Math.random() * 0.5));
    const pt = (i) => {
      const a = (i / n) * Math.PI * 2;
      const r = radii[(i + n) % n];
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.82 };
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
    if (fill) {
      ctx.fillStyle = INK;
      ctx.fill();
    } else {
      ctx.strokeStyle = INK;
      ctx.lineWidth = MID;
      ctx.stroke();
    }
  };
  v.marks.forEach((m) => {
    const x = tailBaseX + (noseX - tailBaseX) * m.s;
    blob(x, y0 + rand(-8, 8), halfH(m.s) * 0.85 * m.r, m.fill);
  });

  // dorsal centre line down the spine
  ctx.strokeStyle = INK;
  ctx.lineWidth = MID;
  ctx.beginPath();
  ctx.moveTo(185, y0 + 2);
  ctx.quadraticCurveTo(360, y0 - 4, 520, y0 + 1);
  ctx.stroke();

  ctx.restore();

  // ---- body outline on top (bold) ----
  bodyPath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = OUT;
  ctx.stroke();

  // ---- eyes ----
  for (const dir of [1, -1]) {
    const ex = 548;
    const ey = y0 + dir * 26;
    ctx.strokeStyle = INK;
    ctx.lineWidth = MID;
    ctx.beginPath();
    ctx.arc(ex, ey, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- barbels (whiskers) ----
  ctx.strokeStyle = INK;
  ctx.lineWidth = MID;
  for (const dir of [1, -1]) {
    ctx.beginPath();
    ctx.moveTo(noseX - 8, y0 + dir * 10);
    ctx.quadraticCurveTo(noseX + 30, y0 + dir * 16, noseX + 40, y0 + dir * 38);
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

        const x0 = rand(-extentX / 2, extentX / 2);
        const z0 = rand(-extentZ / 2, extentZ / 2);
        this.spine = [];
        for (let i = 0; i < this.segCount; i++) {
          this.spine.push({
            x: x0 - Math.cos(this.angle) * this.seg * i,
            z: z0 - Math.sin(this.angle) * this.seg * i,
          });
        }

        this.geo = new THREE.PlaneGeometry(this.len, this.width, 26, 2);
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
          alphaTest: 0.4,
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
        this.angle += diff * Math.min(1, dt * 2.2);

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
          let i0 = Math.floor(f);
          if (i0 > N - 2) i0 = N - 2;
          if (i0 < 0) i0 = 0;
          const frac = f - i0;
          const a = s[i0];
          const b = s[i0 + 1];
          const cx = a.x + (b.x - a.x) * frac;
          const cz = a.z + (b.z - a.z) * frac;
          let tx = a.x - b.x;
          let tz = a.z - b.z;
          const tl = Math.hypot(tx, tz) || 1;
          tx /= tl;
          tz /= tl;
          // perpendicular (tz, -tx) keeps the drawn face toward the camera
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
          new THREE.MeshBasicMaterial({ map: padTex, transparent: true, alphaTest: 0.4, depthWrite: false })
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
