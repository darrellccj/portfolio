'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useReveal from '../hooks/useReveal.js';
import useDitherCanvas from '../hooks/useDitherCanvas.js';
import lastSupperSrc from '../assets/last-supper.jpg';
import { DEFAULT_PARAMS } from '../lib/dither';

// Cycles through a handful of techniques so the card reads as "a tool with
// several effects" at a glance, rather than a single static plate. The full
// set (plus every adjustable parameter) lives on the dedicated /dither page
// this card links to.
const PREVIEW_TECHNIQUES = [
  { algorithmId: 'bayer', matrixSize: 8 },
  { algorithmId: 'floyd-steinberg' },
  { algorithmId: 'atkinson' },
  { algorithmId: 'halftone', matrixSize: 6 },
];
const STEP_MS = 2200;

export default function DitherCard({ copy }) {
  const reveal = useReveal({ threshold: 0.1 });
  const stepRef = useRef(0);
  const paramsBase = useMemo(() => ({ ...DEFAULT_PARAMS, ...PREVIEW_TECHNIQUES[0] }), []);
  const [params, setParams] = useState(paramsBase);

  const { frameRef, canvasRef } = useDitherCanvas({
    src: copy?.imageUrl || lastSupperSrc.src,
    params,
  });

  useEffect(() => {
    const id = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % PREVIEW_TECHNIQUES.length;
      setParams({ ...DEFAULT_PARAMS, ...PREVIEW_TECHNIQUES[stepRef.current] });
    }, STEP_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="study" id="dither">
      <div className="reveal" ref={reveal}>
        <Link href="/dither" className="study-card">
          <div className="study-card__inner">
            <div className="study-card__frame" ref={frameRef}>
              <canvas ref={canvasRef} className="study-card__canvas" aria-hidden="true" />
            </div>
            <div className="study-card__body">
              <p className="study__label">04 / Study</p>
              <h2 className="study__title">A small dithering study</h2>
              <p className="study__sub">
                Ordered dither, error diffusion, halftone — toggle degrees and effects on your own
                photo.
              </p>
              <div className="study-card__cta">
                Open the study <span aria-hidden="true">&rarr;</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
