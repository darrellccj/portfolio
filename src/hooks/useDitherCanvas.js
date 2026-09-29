'use client';

import { useEffect, useRef, useState } from 'react';
import { applyDither, dotSizeFor } from '../lib/dither';

/**
 * Drives a <canvas> that shows a dithered rendering of an <img>. Shared by
 * the homepage teaser and the full study page — both just supply different
 * `params` and read/write the exposed refs.
 *
 * `params` is read through a ref on every render, so passing a new object
 * each render (e.g. from useState) is fine and doesn't tear down the image.
 * Image loading only re-runs when `src` itself changes; swapping in a
 * viewer-uploaded photo is done by callers writing to `imgRef.current.src`
 * directly (see DitherStudio's upload handler), same as `render()` picks up
 * any other change to the underlying <img>.
 */
export default function useDitherCanvas({ src, params }) {
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const paramsRef = useRef(params);
  const renderRef = useRef(() => {});
  const [isReady, setIsReady] = useState(false);

  paramsRef.current = params;

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return undefined;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    imgRef.current = img;

    function render() {
      if (!img.complete || !img.naturalWidth) return;
      const rect = frame.getBoundingClientRect();
      const cssW = rect.width;
      const cssH = rect.height;
      if (!cssW || !cssH) return;

      const p = paramsRef.current;
      const dot = p.dotSize || dotSizeFor(cssW);
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
      applyDither(frameData, p);
      ctx.putImageData(frameData, 0, 0);
    }

    renderRef.current = render;

    img.onload = () => {
      setIsReady(true);
      render();
    };
    if (src) {
      if (/^https?:/.test(src)) img.crossOrigin = 'anonymous';
      img.src = src;
    }

    const ro = new ResizeObserver(() => render());
    ro.observe(frame);

    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Re-render whenever the caller's params change (algorithm, sliders, …).
  useEffect(() => {
    renderRef.current();
  }, [params]);

  return { frameRef, canvasRef, imgRef, isReady, setIsReady, render: () => renderRef.current() };
}
