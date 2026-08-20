import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
//  SKY — WebGL (three.js), duotone daytime sky
//  A single full-screen fragment shader raycasts from a ground
//  camera into a Rayleigh-style gradient, then composites three
//  cloud decks (near cumulus, far cumulus, high cirrus) projected
//  onto altitude planes: domain-warped fbm with sun-offset
//  self-shadowing, drifting on independent winds so the sky
//  visibly moves and slowly morphs. The photoreal render is then
//  pressed to luminance and re-inked on the site's two-colour
//  ramp — navy ink to sky-blue paper — so the sky never leaves
//  the palette.
// ─────────────────────────────────────────────────────────────

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uRes;
  varying vec2 vUv;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  const mat2 ROT = mat2(1.6, 1.2, -1.2, 1.6);

  float fbm6(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * vnoise(p);
      p = ROT * p;
      a *= 0.53;
    }
    return v;
  }

  float fbm3(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * vnoise(p);
      p = ROT * p;
      a *= 0.5;
    }
    return v;
  }

  // Cloud body field: broad fbm shape plus a high-frequency octave so
  // edges break into cauliflower detail instead of smooth smears.
  float densField(vec2 p) {
    return fbm6(p) + 0.14 * (fbm3(p * 4.7) - 0.5);
  }

  // One cumulus deck: intersect the view ray with a plane at height h,
  // read domain-warped fbm there, light it by re-sampling toward the sun.
  vec4 cumulus(
    vec3 ro, vec3 rd, vec3 sd, float t,
    float h, float scale, vec2 wind, float cover, float soft, float mu
  ) {
    if (rd.y < 0.015) return vec4(0.0);
    float dist = (h - ro.y) / rd.y;
    vec2 base = (ro + rd * dist).xz * scale + wind * t;

    // Slowly-evolving warp field makes the clouds billow instead of
    // sliding past as a frozen texture.
    float w = fbm3(base * 0.6 + t * 0.008);
    vec2 p = base + 1.0 * vec2(w, w * 0.62);

    // Low-frequency coverage variation: clumps of cloud, patches of blue.
    float cov = cover + 0.34 * (fbm3(base * 0.19 + t * 0.0015) - 0.5);

    float f = densField(p);
    float den = smoothstep(cov, cov + soft, f);
    if (den < 0.002) return vec4(0.0);

    // Self-shadowing: density a small step toward the sun.
    float fl = densField(p + normalize(sd.xz) * 0.24);
    float dl = smoothstep(cov, cov + soft, fl);
    float lit = clamp(0.62 + 0.75 * (den - dl), 0.0, 1.0);

    // Core thickness: heavy hearts go grey-blue underneath.
    float thick = clamp((f - cov) / max(soft, 1e-3), 0.0, 1.0);

    vec3 bright = vec3(1.03, 1.01, 0.98);
    vec3 shade = vec3(0.585, 0.635, 0.745);
    vec3 col = mix(shade, bright, lit * (1.0 - 0.42 * thick));

    // Silver lining: thin edges facing the sun catch fire.
    col += vec3(1.0, 0.92, 0.78) * pow(mu, 3.0) * 0.22 * (1.0 - thick) * den;

    // Aerial perspective: far decks dissolve into horizon haze.
    float fade = exp(-dist * dist * 2.2e-6);
    return vec4(col, den * fade);
  }

  void main() {
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 uv = vUv;
    float t = uTime;

    // Ground-level camera, horizon sitting near the bottom of the frame.
    vec3 ro = vec3(0.0, 1.2, 0.0);
    vec3 rd = normalize(vec3(uv.x * aspect * 0.66, 0.30 + uv.y * 0.42, 1.0));
    vec3 sd = normalize(vec3(0.62, 0.50, 0.52)); // sun, upper right, off-frame
    float mu = max(dot(rd, sd), 0.0);

    // Rayleigh-style gradient: deep azure zenith to pale warm horizon.
    float ry = clamp(rd.y, 0.0, 1.0);
    vec3 zenith = vec3(0.165, 0.385, 0.745);
    vec3 horizon = vec3(0.79, 0.875, 0.95);
    vec3 col = mix(horizon, zenith, pow(ry, 0.58));

    // Warm forward-scatter haze plus the sun's bloom bleeding in.
    col += vec3(1.0, 0.85, 0.62) * pow(mu, 6.0) * 0.10;
    col += vec3(1.0, 0.96, 0.86) *
      (pow(mu, 1200.0) * 6.0 + pow(mu, 64.0) * 0.22 + pow(mu, 6.0) * 0.08);

    // High cirrus: thin streaks stretched along the wind.
    if (rd.y > 0.02) {
      float cd = (300.0 - ro.y) / rd.y;
      vec2 cp = (ro + rd * cd).xz;
      float cir = fbm3(cp * vec2(0.0016, 0.0072) + vec2(t * 0.006, t * 0.0014));
      cir = smoothstep(0.58, 0.92, cir) * exp(-cd * cd * 2.6e-7);
      col = mix(col, vec3(0.985, 0.99, 1.0), cir * 0.42);
    }

    // Far deck first, near deck over it.
    vec4 far = cumulus(ro, rd, sd, t, 150.0, 0.0042, vec2(0.011, 0.0045), 0.50, 0.34, mu);
    col = mix(col, far.rgb, far.a * 0.78);

    vec4 near = cumulus(ro, rd, sd, t, 80.0, 0.0105, vec2(0.016, 0.006), 0.50, 0.22, mu);
    col = mix(col, near.rgb, near.a);

    // Duotone press: collapse the photoreal render to luminance, then
    // re-ink it on a two-colour ramp — deep navy ink to sky-blue paper.
    // The site owns exactly these two colours; the sky must too.
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    float tone = pow(smoothstep(0.13, 0.97, lum), 1.35);
    vec3 ink = vec3(0.051, 0.200, 0.447);   // #0d3372
    vec3 paper = vec3(0.624, 0.831, 0.969); // #9fd4f7
    col = mix(ink, paper, tone);

    // Ordered grain kills gradient banding in the big two-tone field.
    col += (hash12(gl_FragCoord.xy + fract(t) * 61.7) - 0.5) * (2.0 / 255.0);

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export default function SkyGL() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Start deep into the timeline so the first frame already has a
    // well-developed cloudscape rather than a raw noise seed.
    const T0 = 1370.0;
    const uniforms = {
      uTime: { value: T0 },
      uRes: { value: new THREE.Vector2(1, 1) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    scene.add(quad);

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
      if (reduced) renderer.render(scene, camera); // keep the still frame crisp
    }
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let io = null;
    let onVisibility = null;

    if (reduced) {
      renderer.render(scene, camera); // one static sky, no motion
    } else {
      // The clock only advances while we are actually drawing, so pausing
      // and resuming never jumps the cloudscape forward by the gap.
      let clock = T0;
      let last = 0;

      const loop = (now) => {
        if (last) clock += (now - last) / 1000;
        last = now;
        uniforms.uTime.value = clock;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(loop);
      };

      const play = () => {
        if (raf) return;
        last = 0; // resume without swallowing the paused interval
        raf = requestAnimationFrame(loop);
      };
      const pause = () => {
        if (!raf) return;
        cancelAnimationFrame(raf);
        raf = 0;
      };

      // The hero is `overflow: hidden` and one viewport tall, so once you
      // scroll past it this canvas is entirely off-screen — and a ~200-octave
      // fragment shader has no business burning the GPU for nobody. Gate the
      // loop on the canvas being in view and the tab being frontmost.
      let onScreen = true;
      let tabVisible = !document.hidden;
      const sync = () => (onScreen && tabVisible ? play() : pause());

      io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      });
      io.observe(canvas);

      onVisibility = () => {
        tabVisible = !document.hidden;
        sync();
      };
      document.addEventListener('visibilitychange', onVisibility);

      play();
    }

    return () => {
      cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', resize);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="sky-canvas" aria-hidden="true" />;
}
