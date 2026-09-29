'use client';

import { useRef, useState } from 'react';
import useDitherCanvas from '../hooks/useDitherCanvas';
import lastSupperSrc from '../assets/last-supper.jpg';
import { ALGORITHMS, COLOR_PRESETS, DEFAULT_PARAMS, MATRIX_SIZES, algorithmKind } from '../lib/dither';

// Blown up on export so the download matches the blocky look the CSS gives
// the on-screen canvas (`image-rendering: pixelated`) — the raw canvas is
// only a few hundred pixels wide at processing resolution.
const EXPORT_SCALE = 8;

const rgbToHex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export default function DitherStudio({ copy }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const objectUrlRef = useRef(null);

  const defaultSrc = copy?.imageUrl || lastSupperSrc.src;
  const { frameRef, canvasRef, imgRef, isReady } = useDitherCanvas({ src: defaultSrc, params });

  const kind = algorithmKind(params.algorithmId);
  const showMatrixSize = kind === 'ordered' || kind === 'halftone';
  const activeAlgorithm = ALGORITHMS.find((a) => a.id === params.algorithmId);

  function update(patch) {
    setParams((p) => ({ ...p, ...patch }));
  }

  // Swaps in a viewer-chosen photo, replacing whatever's currently loaded
  // (the default plate or a previous upload). Blob URLs are same-origin, so
  // no crossOrigin dance is needed the way the remote Sanity plate needs.
  function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const img = imgRef.current;
    if (!img) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setHasCustomImage(true);
    img.removeAttribute('crossorigin');
    img.src = url;
  }

  // Back to the site's own plate.
  function handleResetImage() {
    const img = imgRef.current;
    if (!img) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setHasCustomImage(false);
    if (/^https?:/.test(defaultSrc)) img.crossOrigin = 'anonymous';
    img.src = defaultSrc;
  }

  function handleResetSettings() {
    setParams(DEFAULT_PARAMS);
  }

  // Re-draws the current canvas into a larger one with smoothing off, so the
  // exported file keeps the same blocky dots the pixelated CSS shows on
  // screen instead of a few-hundred-pixel sliver.
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

  const frameLabel = hasCustomImage
    ? `${activeAlgorithm?.label} rendering of your uploaded image.`
    : `${activeAlgorithm?.label} rendering of ${copy?.work}, ${copy?.credit}.`;

  return (
    <section className="dither-page">
      <div className="dither-page__layout">
        {/* Sticky so the result stays in view while you scroll through the
            controls instead of hopping back and forth to check a change. */}
        <div className="dither-page__preview">
          <div className="dither-page__frame-wrap">
            <div className="dither__frame" ref={frameRef} role="img" aria-label={frameLabel}>
              <canvas ref={canvasRef} className="dither__canvas" aria-hidden="true" />
            </div>
          </div>
          {!hasCustomImage && (copy?.work || copy?.credit) ? (
            <p className="study__caption">
              {copy.work}
              {copy.work && copy.credit ? ' — ' : ''}
              {copy.credit}
            </p>
          ) : null}
        </div>

        <div className="dither-page__panel">
          <div className="dither-controls">
            <div className="dither-controls__group">
              <p className="dither-controls__label">Effect</p>
              <div className="dither-controls__pills">
                {ALGORITHMS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`dither-pill ${params.algorithmId === a.id ? 'is-active' : ''}`}
                    onClick={() => update({ algorithmId: a.id })}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {showMatrixSize ? (
              <div className="dither-controls__group">
                <p className="dither-controls__label">
                  {kind === 'halftone' ? 'Dot cell' : 'Matrix size'}
                </p>
                <div className="dither-controls__pills">
                  {MATRIX_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`dither-pill ${params.matrixSize === size ? 'is-active' : ''}`}
                      onClick={() => update({ matrixSize: size })}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="dither-controls__group dither-controls__group--sliders">
              <label className="dither-slider">
                <span>Contrast</span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={params.contrast}
                  onChange={(e) => update({ contrast: Number(e.target.value) })}
                />
              </label>
              <label className="dither-slider">
                <span>Brightness</span>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step="0.01"
                  value={params.brightness}
                  onChange={(e) => update({ brightness: Number(e.target.value) })}
                />
              </label>
              <label className="dither-slider">
                <span>Dot size</span>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.1"
                  value={params.dotSize || 1.8}
                  onChange={(e) => update({ dotSize: Number(e.target.value) })}
                />
              </label>
            </div>

            <div className="dither-controls__group">
              <p className="dither-controls__label">Colors</p>
              <div className="dither-controls__pills">
                {Object.values(COLOR_PRESETS).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="dither-pill"
                    onClick={() => update({ ink: preset.ink, paper: preset.paper })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="dither-controls__swatches">
                <label className="dither-swatch">
                  Ink
                  <input
                    type="color"
                    value={rgbToHex(params.ink)}
                    onChange={(e) => update({ ink: hexToRgb(e.target.value) })}
                  />
                </label>
                <label className="dither-swatch">
                  Paper
                  <input
                    type="color"
                    value={rgbToHex(params.paper)}
                    onChange={(e) => update({ paper: hexToRgb(e.target.value) })}
                  />
                </label>
              </div>
            </div>
          </div>

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
            <button type="button" className="dither__action" onClick={handleDownload} disabled={!isReady}>
              Download
            </button>
            {hasCustomImage ? (
              <button type="button" className="dither__action" onClick={handleResetImage}>
                Reset image
              </button>
            ) : null}
            <button type="button" className="dither__action" onClick={handleResetSettings}>
              Reset settings
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
