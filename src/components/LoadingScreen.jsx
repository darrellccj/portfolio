'use client';

import { useEffect, useRef, useState } from 'react';

// Traced from src/assets/sig.svg (viewBox 0 0 3508 2480), in original stroke order.
const SIGNATURE_PATHS = [
  'M762.261 1054.18C787.912 1257.06 792.576 1558.98 792.576 1558.98',
  'M445.06 1269.13C445.06 1269.13 356.509 1165.01 468.872 1087.96C581.236 1010.92 656.393 985.616 656.393 985.616L748.929 956.21L853.29 931.222L931.683 918.483C931.683 918.483 1040.88 907.789 1085.83 907.704C1130.78 907.619 1397.35 936.833 1455.37 1088.42C1513.4 1240 1342.96 1339.85 1201.52 1437.76C1060.09 1535.68 364.933 1820.83 364.933 1820.83L994.627 1595.23L1163.14 1552.77L1281.16 1525.3L1510.25 1477.43L1665.76 1451.7L1857.94 1427.33L2069.35 1409.56L2239.97 1398.58L2397.13 1390.46L2548.38 1390.46L2669.53 1390.46L2743.85 1390.46L2868.25 1395.61',
  'M1631 1303.34C1631 1303.34 1652.01 1257.96 1649.13 1248.98C1646.24 1240 1650.77 1208.62 1605.47 1210.27C1560.17 1211.91 1518.16 1303.34 1518.16 1303.34C1518.16 1303.34 1502.92 1333.06 1518.16 1348.64C1533.4 1364.22 1565.52 1332.99 1565.52 1332.99L1636.89 1184.89C1636.89 1184.89 1649.67 1174.4 1649.4 1198.19C1649.13 1221.99 1643.54 1308.73 1643.54 1308.73C1643.54 1308.73 1645.33 1344.56 1677.31 1315.13C1709.3 1285.7 1770.71 1167.74 1770.71 1167.74C1770.71 1167.74 1793.74 1128.59 1798.86 1173.88C1803.98 1219.18 1797.32 1189.9 1804.74 1252.51C1812.16 1315.13 1866.18 1303.34 1866.18 1303.34C1866.18 1303.34 1906.21 1284.12 1910.08 1262.06C1913.95 1240 1944.62 1184.89 1944.62 1184.89C1944.62 1184.89 1968.95 1147.41 1969.73 1198.19C1970.5 1248.98 1969.73 1240 1969.73 1240C1969.73 1240 1961.41 1291.55 2012.85 1303.34C2064.3 1315.13 2137.84 1167.74 2137.84 1167.74C2137.84 1167.74 2162.07 1125.47 2175.8 1173.88C2189.54 1222.3 2163.09 1325.71 2234.33 1332.99C2305.56 1340.28 2372.04 1275.31 2372.04 1275.31C2372.04 1275.31 2421.34 1232.76 2443.45 1179.56C2465.56 1126.37 2448.09 1107.86 2448.09 1107.86C2448.09 1107.86 2416.42 1058.43 2372.04 1121.66C2327.65 1184.89 2333.31 1240 2333.31 1240C2333.31 1240 2328.79 1297.27 2391.72 1315.13C2454.64 1332.99 2566.76 1285.81 2570.97 1283.13C2575.17 1280.45 2649.9 1236.49 2696.51 1184.89C2743.13 1133.29 2806.03 1085.73 2861.2 985.476C2916.38 885.218 2890.52 848.563 2890.52 848.563C2890.52 848.563 2872.5 822.238 2829.55 837.874C2786.6 853.511 2730.98 1005.72 2730.98 1005.72C2730.98 1005.72 2700.6 1101.74 2705.89 1137.81C2711.18 1173.88 2706.04 1215.38 2738.25 1262.06C2770.46 1308.73 2851.48 1283.13 2851.48 1283.13C2851.48 1283.13 2936.03 1244.02 3002.15 1153.88C3068.27 1063.75 3106.24 1012.01 3106.24 1012.01C3106.24 1012.01 3159.71 933.205 3164.11 902.223C3168.51 871.241 3174.39 841.716 3128.01 868.089C3081.64 894.462 3031.64 970.954 3031.64 970.954C3031.64 970.954 2984.75 1063.76 2980.02 1121.66C2975.28 1179.56 2965.2 1217.62 2988.42 1283.13C3011.63 1348.64 3059.86 1348.64 3059.86 1348.64C3059.86 1348.64 3101.48 1357.36 3154.3 1353',
];

// Pen speed the draw-on animation is timed to, in viewBox units per second,
// so a signature swapped in later times itself instead of needing new numbers.
const SPEED = 1600;
const MIN_DURATION = 0.2;
const MAX_DURATION = 1.4;
// Each stroke starts a little before the previous one finishes, like a
// continuous hand rather than a strict relay.
const OVERLAP = 0.7;
const HOLD = 0.26;
// Kept in sync with the `.loading` transform transition in globals.css.
const EXIT_DURATION = 0.9;

export default function LoadingScreen() {
  const [phase, setPhase] = useState('measuring'); // measuring -> drawing -> exiting -> done
  const [timing, setTiming] = useState(null);
  const pathRefs = useRef([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Timers below drive the state machine directly rather than listening for
    // the CSS transition to end, so a dropped or restarted transition (e.g. a
    // stray re-render, a backgrounded tab) can never leave the overlay
    // stuck covering the site.
    const speedUp = reducedMotion ? 40 : 1;
    document.body.style.overflow = 'hidden';

    let delay = 0;
    const next = pathRefs.current.map((el) => {
      const length = el.getTotalLength();
      const duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, length / SPEED)) / speedUp;
      const item = { length, duration, delay };
      delay += duration * OVERLAP;
      return item;
    });
    setTiming(next);

    const last = next[next.length - 1];
    const drawMs = (last.delay + last.duration) * 1000;
    const holdMs = reducedMotion ? 0 : HOLD * 1000;
    const exitMs = (EXIT_DURATION / speedUp) * 1000;

    const timers = [];
    // Two rAFs so the browser paints the "undrawn" state before we flip to
    // "drawing" — otherwise the two style states can collapse into one
    // frame and the stroke transition never fires.
    const outer = requestAnimationFrame(() => {
      const inner = requestAnimationFrame(() => {
        setPhase('drawing');
        timers.push(
          window.setTimeout(() => {
            document.body.style.overflow = '';
            setPhase('exiting');
            timers.push(window.setTimeout(() => setPhase('done'), exitMs));
          }, drawMs + holdMs)
        );
      });
      timers.push(inner);
    });
    timers.push(outer);

    return () => {
      timers.forEach((id) => {
        cancelAnimationFrame(id);
        clearTimeout(id);
      });
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <>
      {/* Without JS the paths would stay stuck fully invisible — never let
          a broken script trap the whole site behind this overlay. */}
      <noscript>
        <style>{'.loading { display: none; }'}</style>
      </noscript>
      <div className={`loading loading--${phase}`} aria-hidden="true">
        <svg className="loading__sig" viewBox="0 0 3508 2480">
          {SIGNATURE_PATHS.map((d, i) => {
            const t = timing?.[i];
            return (
              <path
                key={i}
                ref={(el) => (pathRefs.current[i] = el)}
                d={d}
                style={
                  t && {
                    opacity: 1,
                    strokeDasharray: t.length,
                    strokeDashoffset: phase === 'measuring' ? t.length : 0,
                    transitionDuration: `${t.duration}s`,
                    transitionDelay: `${t.delay}s`,
                  }
                }
              />
            );
          })}
        </svg>
      </div>
    </>
  );
}
