'use client';

import { useEffect, useRef, useState } from 'react';
import useReveal from '../hooks/useReveal.js';
import lastSupperSrc from '../assets/last-supper.jpg';

// Blown up on export so the download matches the blocky look the CSS
// gives the on-screen canvas (`image-rendering: pixelated`) — the raw
// canvas is only a few hundred pixels wide at processing resolution.
const EXPORT_SCALE = 8;

// Ordered (Bayer) dither matrices, row-major.
const BAYER8 = [
   0, 32,  8, 40,  2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44,  4, 36, 14, 46,  6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
   3, 35, 11, 43,  1, 33,  9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47,  7, 39, 13, 45,  5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];
const BAYER4 = [
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5,
];
const BAYER2 = [0, 2, 3, 1];

// The site's two inks — deep navy dots on a paper-sky ground.
const BG = [13, 51, 114]; // --ink
const FG = [154, 231, 255]; // --paper
const CONTRAST = 1.55;
const BRIGHTNESS = 0.04;
const STEP_MS = 140;

function dotSizeFor(width) {
  if (width < 480) return 1.3;
  if (width < 900) return 1.6;
  return 1.8;
}

// Shared prep: perceptual luminance, stretched to the frame's own
// range, then pushed through the site's contrast curve. Every
// technique below thresholds this same buffer differently.
function preparedLuminance(imageData) {
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
    v = (v - 0.5) * CONTRAST + 0.5 + BRIGHTNESS;
    buf[p] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return buf;
}

function paint(data, pi, on) {
  const idx = pi * 4;
  const c = on ? FG : BG;
  data[idx] = c[0];
  data[idx + 1] = c[1];
  data[idx + 2] = c[2];
  data[idx + 3] = 255;
}

function orderedDither(imageData, matrix, size) {
  const { data, width, height } = imageData;
  const buf = preparedLuminance(imageData);
  const cells = size * size;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const matrixRow = (y % size) * size;
    for (let x = 0; x < width; x++) {
      const pi = rowOffset + x;
      const threshold = (matrix[matrixRow + (x % size)] + 0.5) / cells;
      paint(data, pi, buf[pi] > threshold);
    }
  }
}

function floydSteinbergDither(imageData) {
  const { data, width, height } = imageData;
  const buf = preparedLuminance(imageData);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const pi = rowOffset + x;
      const old = buf[pi];
      const on = old > 0.5;
      const err = old - (on ? 1 : 0);

      if (x + 1 < width) buf[pi + 1] += err * (7 / 16);
      if (y + 1 < height) {
        if (x > 0) buf[pi + width - 1] += err * (3 / 16);
        buf[pi + width] += err * (5 / 16);
        if (x + 1 < width) buf[pi + width + 1] += err * (1 / 16);
      }

      paint(data, pi, on);
    }
  }
}

function randomDither(imageData) {
  const { data, width, height } = imageData;
  const buf = preparedLuminance(imageData);
  const count = width * height;

  for (let p = 0; p < count; p++) {
    paint(data, p, buf[p] > Math.random());
  }
}

// Ordered → coarser ordered → diffusion → noise → back to the start.
const TECHNIQUES = [
  (d) => orderedDither(d, BAYER8, 8),
  (d) => orderedDither(d, BAYER4, 4),
  (d) => orderedDither(d, BAYER2, 2),
  floydSteinbergDither,
  randomDither,
];

export default function Dither({ copy }) {
  const ditherCopy = copy;
  const reveal = useReveal({ threshold: 0.1 });
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const objectUrlRef = useRef(null);
  const techniqueIndexRef = useRef(0);
  const renderRef = useRef(() => {});
  const timerRef = useRef(null);
  const animatingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [hasCustomImage, setHasCustomImage] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    imgRef.current = img;

    function render() {
      if (!img.complete || !img.naturalWidth) return;
      const rect = frame.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;
      if (!cssW || !cssH) return;

      const dot = dotSizeFor(cssW);
      const w = Math.max(1, Math.round(cssW / dot));
      const h = Math.max(1, Math.round(cssH / dot));

      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Cover-fit crop of the source image into the processing-resolution canvas.
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = w / h;
      let sx, sy, sw, sh;

      if (imgRatio > canvasRatio) {
        sh = img.naturalHeight;
        sw = sh * canvasRatio;
        sy = 0;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sw = img.naturalWidth;
        sh = sw / canvasRatio;
        sx = 0;
        sy = (img.naturalHeight - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      const frameData = ctx.getImageData(0, 0, w, h);
      TECHNIQUES[techniqueIndexRef.current](frameData);
      ctx.putImageData(frameData, 0, 0);
    }

    renderRef.current = render;

    img.onload = () => {
      setIsReady(true);
      render();
    };
    const remote = ditherCopy?.imageUrl;
    if (remote) img.crossOrigin = 'anonymous';
    img.src = remote || lastSupperSrc.src;

    const ro = new ResizeObserver(() => render());
    ro.observe(frame);

    return () => {
      ro.disconnect();
      clearTimeout(timerRef.current);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Swaps in a viewer-chosen photo, replacing whatever's currently loaded
  // (the default plate or a previous upload). Blob URLs are same-origin,
  // so no crossOrigin dance is needed the way the remote Sanity plate needs.
  function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const img = imgRef.current;
    if (!img) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    clearTimeout(timerRef.current);
    animatingRef.current = false;
    frameRef.current?.classList.remove('is-cycling');
    techniqueIndexRef.current = 0;
    setIsReady(false);
    setHasCustomImage(true);
    img.src = url;
  }

  // Back to the site's own plate.
  function handleReset() {
    const img = imgRef.current;
    if (!img) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    clearTimeout(timerRef.current);
    animatingRef.current = false;
    frameRef.current?.classList.remove('is-cycling');
    techniqueIndexRef.current = 0;
    setIsReady(false);
    setHasCustomImage(false);

    const remote = ditherCopy?.imageUrl;
    if (remote) img.crossOrigin = 'anonymous';
    img.src = remote || lastSupperSrc.src;
  }

  // Re-draws the current canvas into a larger one with smoothing off, so
  // the exported file keeps the same blocky dots the pixelated CSS shows
  // on screen instead of a few-hundred-pixel sliver.
  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;

    const out = document.createElement('canvas');
    out.width = canvas.width * EXPORT_SCALE;
    out.height = canvas.height * EXPORT_SCALE;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(canvas, 0, 0, out.width, out.height);

    out.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dither.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  // Plays through every technique, one per tick, for two full laps —
  // still lands back on the technique it started from either way,
  // since 2x the loop length is still a multiple of it.
  function playCycle() {
    if (animatingRef.current) return;
    animatingRef.current = true;
    frameRef.current?.classList.add('is-cycling');

    const laps = 2;
    const total = TECHNIQUES.length * laps;
    let step = 0;

    const advance = () => {
      step += 1;
      techniqueIndexRef.current = step % TECHNIQUES.length;
      renderRef.current();

      if (step < total) {
        timerRef.current = setTimeout(advance, STEP_MS);
      } else {
        animatingRef.current = false;
        frameRef.current?.classList.remove('is-cycling');
      }
    };

    timerRef.current = setTimeout(advance, STEP_MS);
  }

  const frameLabel = hasCustomImage
    ? 'Ordered-dither rendering of your uploaded image. Click to play through the dithering techniques.'
    : `Ordered-dither rendering of ${ditherCopy.work}, ${ditherCopy.credit}. Click to play through the dithering techniques.`;

  return (
    <section className="section dither" id="dither">
      <button
        type="button"
        className="reveal dither__frame"
        ref={(el) => {
          reveal.current = el;
          frameRef.current = el;
        }}
        onClick={playCycle}
        aria-label={frameLabel}
      >
        <canvas ref={canvasRef} className="dither__canvas" aria-hidden="true" />
      </button>

      <div className="dither__toolbar">
        <label className="dither__action dither__upload">
          Upload image
          <input
            type="file"
            accept="image/*"
            className="dither__file-input"
            onChange={handleUpload}
          />
        </label>
        <button
          type="button"
          className="dither__action"
          onClick={handleDownload}
          disabled={!isReady}
        >
          Download
        </button>
        {hasCustomImage && (
          <button type="button" className="dither__action" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>
    </section>
  );
}
