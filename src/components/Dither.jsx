import { useEffect, useRef } from 'react';
import useReveal from '../hooks/useReveal.js';
import { dither as ditherCopy } from '../data/content.js';
import lastSupperSrc from '../assets/last-supper.jpg';

// Standard 8x8 ordered (Bayer) dither matrix, row-major, values 0-63.
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

// The site's two inks — deep navy dots on a paper-sky ground.
const BG = [13, 51, 114]; // --ink
const FG = [159, 212, 247]; // --paper
const CONTRAST = 1.55;
const BRIGHTNESS = 0.04;

function dotSizeFor(width) {
  if (width < 480) return 2.5;
  if (width < 900) return 3.5;
  return 4.5;
}

function ditherFrame(imageData) {
  const { data, width, height } = imageData;
  const count = width * height;
  const lum = new Float32Array(count);
  let min = 1;
  let max = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lum[p] = l;
    if (l < min) min = l;
    if (l > max) max = l;
  }

  const range = Math.max(max - min, 0.0001);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    const bayerRow = (y & 7) * 8;
    for (let x = 0; x < width; x++) {
      const pi = rowOffset + x;
      let v = (lum[pi] - min) / range;
      v = (v - 0.5) * CONTRAST + 0.5 + BRIGHTNESS;
      if (v < 0) v = 0;
      if (v > 1) v = 1;

      const threshold = (BAYER8[bayerRow + (x & 7)] + 0.5) / 64;
      const on = v > threshold;
      const idx = pi * 4;
      const c = on ? FG : BG;

      data[idx] = c[0];
      data[idx + 1] = c[1];
      data[idx + 2] = c[2];
      data[idx + 3] = 255;
    }
  }
}

export default function Dither() {
  const reveal = useReveal({ threshold: 0.1 });
  const frameRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    let ready = false;

    function render() {
      if (!ready) return;
      const rect = frame.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;
      if (!cssW || !cssH) return;

      const dot = dotSizeFor(cssW);
      const w = Math.max(1, Math.round(cssW / dot));
      const h = Math.max(1, Math.round(cssH / dot));

      canvas.width = w;
      canvas.height = h;

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
      ditherFrame(frameData);
      ctx.putImageData(frameData, 0, 0);
    }

    img.onload = () => {
      ready = true;
      render();
    };
    img.src = lastSupperSrc;

    const ro = new ResizeObserver(() => render());
    ro.observe(frame);

    return () => ro.disconnect();
  }, []);

  return (
    <section className="section dither" id="dither">
      <div className="reveal" ref={reveal}>
        <div className="section__head">
          <p className="section__label">{ditherCopy.label}</p>
          <h2 className="section__title">{ditherCopy.title}</h2>
          <p className="section__sub">{ditherCopy.sub}</p>
        </div>

        <div className="dither__frame" ref={frameRef}>
          <canvas
            ref={canvasRef}
            className="dither__canvas"
            role="img"
            aria-label={`Ordered-dither rendering of ${ditherCopy.work}, ${ditherCopy.credit}`}
          />
          <div className="dither__tag" aria-hidden="true">
            <span>{ditherCopy.figure}</span>
            <span className="dither__tag-right">
              {ditherCopy.method}
              <br />
              {ditherCopy.methodSub}
            </span>
          </div>
        </div>

        <div className="dither__caption">
          <span>
            <strong>{ditherCopy.work}</strong> — {ditherCopy.credit}
          </span>
          <span>{ditherCopy.note}</span>
        </div>
      </div>
    </section>
  );
}
