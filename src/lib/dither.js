// Dithering engine — pure canvas-pixel functions, no React. Used by the
// control panel on /dither (DitherStudio); kept separate from the component
// so what an algorithm or parameter does is readable on its own.

export const MATRIX_SIZES = [2, 4, 8, 16];

export const COLOR_PRESETS = {
  site: { label: 'Site ink', ink: [13, 51, 114], paper: [154, 231, 255] },
  classic: { label: 'Classic', ink: [0, 0, 0], paper: [255, 255, 255] },
};

export const DEFAULT_PARAMS = {
  algorithmId: 'bayer',
  matrixSize: 8,
  contrast: 1.55,
  brightness: 0.04,
  dotSize: null, // null → responsive default, see dotSizeFor()
  ink: COLOR_PRESETS.site.ink,
  paper: COLOR_PRESETS.site.paper,
};

export const ALGORITHMS = [
  { id: 'bayer', label: 'Ordered (Bayer)', kind: 'ordered' },
  { id: 'halftone', label: 'Halftone', kind: 'halftone' },
  { id: 'floyd-steinberg', label: 'Floyd–Steinberg', kind: 'diffusion' },
  { id: 'atkinson', label: 'Atkinson', kind: 'diffusion' },
  { id: 'sierra', label: 'Sierra', kind: 'diffusion' },
  { id: 'sierra-lite', label: 'Sierra Lite', kind: 'diffusion' },
  { id: 'random', label: 'Random / noise', kind: 'noise' },
];

export function algorithmKind(id) {
  return ALGORITHMS.find((a) => a.id === id)?.kind ?? 'diffusion';
}

export function dotSizeFor(width) {
  if (width < 480) return 1.3;
  if (width < 900) return 1.6;
  return 1.8;
}

// Recursive Bayer construction (Wikipedia "ordered dithering"):
// M(2n) is four copies of M(n), each scaled by 4 and offset by its
// quadrant's constant. Values run 0..size²-1, row-major.
const bayerCache = new Map();
export function bayerMatrix(size) {
  if (bayerCache.has(size)) return bayerCache.get(size);

  function build(n) {
    if (n === 1) return [0];
    const half = build(n / 2);
    const halfSize = n / 2;
    const out = new Array(n * n);
    for (let y = 0; y < n; y++) {
      const top = y < halfSize;
      for (let x = 0; x < n; x++) {
        const left = x < halfSize;
        const hv = half[(y % halfSize) * halfSize + (x % halfSize)];
        const add = top && left ? 0 : top && !left ? 2 : !top && left ? 3 : 1;
        out[y * n + x] = 4 * hv + add;
      }
    }
    return out;
  }

  const matrix = build(size);
  bayerCache.set(size, matrix);
  return matrix;
}

// Shared prep: perceptual luminance, stretched to the frame's own range,
// then pushed through a contrast/brightness curve. Every technique below
// thresholds this same buffer differently.
function preparedLuminance(imageData, contrast, brightness) {
  const { data, width, height } = imageData;
  const count = width * height;
  const buf = new Float32Array(count);
  let min = 1;
  let max = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    buf[p] = l;
    if (l < min) min = l;
    if (l > max) max = l;
  }

  const range = Math.max(max - min, 0.0001);
  for (let p = 0; p < count; p++) {
    let v = (buf[p] - min) / range;
    v = (v - 0.5) * contrast + 0.5 + brightness;
    buf[p] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return buf;
}

function paint(data, pi, on, ink, paper) {
  const idx = pi * 4;
  const c = on ? paper : ink;
  data[idx] = c[0];
  data[idx + 1] = c[1];
  data[idx + 2] = c[2];
  data[idx + 3] = 255;
}

function orderedDither(imageData, buf, matrix, size, ink, paper) {
  const { data, width, height } = imageData;
  const cells = size * size;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const matrixRow = (y % size) * size;
    for (let x = 0; x < width; x++) {
      const pi = rowOffset + x;
      const threshold = (matrix[matrixRow + (x % size)] + 0.5) / cells;
      paint(data, pi, buf[pi] > threshold, ink, paper);
    }
  }
}

// Error-diffusion runner. `kernel` is [dx, dy, weight] triples; weights are
// divided by `divisor` rather than normalized to sum to 1, so kernels like
// Atkinson's (which deliberately discards 2/8 of the error) keep their own
// character instead of being forced to conserve total error.
function diffuseDither(imageData, buf, kernel, divisor, ink, paper) {
  const { data, width, height } = imageData;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const pi = rowOffset + x;
      const old = buf[pi];
      const on = old > 0.5;
      const err = (old - (on ? 1 : 0)) / divisor;

      for (const [dx, dy, w] of kernel) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny >= height) continue;
        buf[ny * width + nx] += err * w;
      }

      paint(data, pi, on, ink, paper);
    }
  }
}

function randomDither(imageData, buf, ink, paper) {
  const { data, width, height } = imageData;
  const count = width * height;
  for (let p = 0; p < count; p++) {
    paint(data, p, buf[p] > Math.random(), ink, paper);
  }
}

// Clustered-dot halftone: average luminance over each `cell`×`cell` block,
// then paint every pixel in that block on or off by its distance from the
// cell's centre — brighter cells grow a bigger circle, same "on above
// threshold" convention as every other technique here.
function halftoneDither(imageData, buf, cell, ink, paper) {
  const { data, width, height } = imageData;
  const maxRadius = (cell / 2) * Math.SQRT2;

  for (let cy = 0; cy < height; cy += cell) {
    const yEnd = Math.min(cy + cell, height);
    for (let cx = 0; cx < width; cx += cell) {
      const xEnd = Math.min(cx + cell, width);

      let sum = 0;
      let count = 0;
      for (let y = cy; y < yEnd; y++) {
        const rowOffset = y * width;
        for (let x = cx; x < xEnd; x++) {
          sum += buf[rowOffset + x];
          count++;
        }
      }
      const radius = (sum / count) * maxRadius;
      const centerX = cx + (xEnd - cx) / 2 - 0.5;
      const centerY = cy + (yEnd - cy) / 2 - 0.5;

      for (let y = cy; y < yEnd; y++) {
        const rowOffset = y * width;
        const dy = y - centerY;
        for (let x = cx; x < xEnd; x++) {
          const dx = x - centerX;
          const on = Math.sqrt(dx * dx + dy * dy) < radius;
          paint(data, rowOffset + x, on, ink, paper);
        }
      }
    }
  }
}

const FLOYD_STEINBERG_KERNEL = [
  [1, 0, 7],
  [-1, 1, 3],
  [0, 1, 5],
  [1, 1, 1],
];
const FLOYD_STEINBERG_DIVISOR = 16;

// Classic Atkinson: only 6/8 of the error is carried forward, which is what
// gives it a lighter, punchier look than Floyd–Steinberg instead of a
// mathematically "correct" full-error diffusion.
const ATKINSON_KERNEL = [
  [1, 0, 1],
  [2, 0, 1],
  [-1, 1, 1],
  [0, 1, 1],
  [1, 1, 1],
  [0, 2, 1],
];
const ATKINSON_DIVISOR = 8;

const SIERRA_KERNEL = [
  [1, 0, 5],
  [2, 0, 3],
  [-2, 1, 2],
  [-1, 1, 4],
  [0, 1, 5],
  [1, 1, 4],
  [2, 1, 2],
  [-1, 2, 2],
  [0, 2, 3],
  [1, 2, 2],
];
const SIERRA_DIVISOR = 32;

const SIERRA_LITE_KERNEL = [
  [1, 0, 2],
  [-1, 1, 1],
  [0, 1, 1],
];
const SIERRA_LITE_DIVISOR = 4;

/**
 * Runs the given technique over `imageData` in place. `params` follows
 * DEFAULT_PARAMS' shape; any field left out falls back to its default.
 */
export function applyDither(imageData, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const buf = preparedLuminance(imageData, p.contrast, p.brightness);

  switch (p.algorithmId) {
    case 'bayer':
      return orderedDither(imageData, buf, bayerMatrix(p.matrixSize), p.matrixSize, p.ink, p.paper);
    case 'halftone':
      return halftoneDither(imageData, buf, p.matrixSize, p.ink, p.paper);
    case 'atkinson':
      return diffuseDither(imageData, buf, ATKINSON_KERNEL, ATKINSON_DIVISOR, p.ink, p.paper);
    case 'sierra':
      return diffuseDither(imageData, buf, SIERRA_KERNEL, SIERRA_DIVISOR, p.ink, p.paper);
    case 'sierra-lite':
      return diffuseDither(imageData, buf, SIERRA_LITE_KERNEL, SIERRA_LITE_DIVISOR, p.ink, p.paper);
    case 'random':
      return randomDither(imageData, buf, p.ink, p.paper);
    case 'floyd-steinberg':
    default:
      return diffuseDither(imageData, buf, FLOYD_STEINBERG_KERNEL, FLOYD_STEINBERG_DIVISOR, p.ink, p.paper);
  }
}
