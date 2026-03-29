// ── FOLDER SCROLL LOGIC ───────────────────────────────────────
const folderSection = document.getElementById('folderSection');
const folderImg     = document.getElementById('folder-img');
const cards = [0,1,2,3].map(i => document.getElementById('card-' + i));

const clamp   = (v,a,b) => Math.max(a,Math.min(b,v));
const lerp    = (a,b,t) => a+(b-a)*t;
const easeOut = t => 1-Math.pow(1-t,3);
const easeIO  = t => t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const mapR    = (v,i0,i1,o0,o1,e=x=>x) =>
  lerp(o0,o1,e(clamp((v-i0)/(i1-i0),0,1)));

function getFolderP() {
  const top = folderSection.offsetTop;
  const scrollable = folderSection.offsetHeight - window.innerHeight;
  return clamp((window.scrollY - top) / scrollable, 0, 1);
}

// ── SCROLL TIMELINE ──────────────────────────────────────────
// 0.00–0.08  Fly in from below → center (small)
// 0.08–0.12  Settle bounce at center
// 0.12–0.16  Scale up + slide down to bottom-half
// 0.16–0.76  Card phases (4 cards)
// 0.76–0.82  Shrink back + return to center
// 0.82–0.86  Settle at center
// 0.86–1.00  Fly out upward, fade out

const phases = [
  { s: 0.16, e: 0.31 },
  { s: 0.31, e: 0.46 },
  { s: 0.46, e: 0.61 },
  { s: 0.61, e: 0.76 },
];
const SLIDE_DUR = 0.04;

function updateFolder() {
  const p  = getFolderP();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const FW = folderImg.offsetWidth  || vw * 0.5;
  const FH = folderImg.offsetHeight || FW * 0.89;

  const FOLDER_CY_MID   = vh * 0.50;
  const FOLDER_CY_LARGE = vh + FH * 0.08;
  const CARD_START_CY    = FOLDER_CY_LARGE - FH * 0.32;
  const CARD_REST_CY     = vh * 0.38;

  let fScale, fCY, fOp;

  if (p < 0.08) {
    // Fly in from below → center (small)
    const t = easeOut(p / 0.08);
    fScale = lerp(0.10, 0.35, t);
    fCY    = lerp(vh * 1.3, FOLDER_CY_MID, t);
    fOp    = clamp(p / 0.02, 0, 1);
  } else if (p < 0.12) {
    // Settle: gentle bounce at center
    const t = (p - 0.08) / 0.04;
    fScale = 0.35;
    fCY    = FOLDER_CY_MID + Math.sin(t * Math.PI) * 12;
    fOp    = 1;
  } else if (p < 0.16) {
    // Scale up + slide down to bottom-half position
    const t = easeIO((p - 0.12) / 0.04);
    fScale = lerp(0.35, 1.0, t);
    fCY    = lerp(FOLDER_CY_MID, FOLDER_CY_LARGE, t);
    fOp    = 1;
  } else if (p < 0.76) {
    // Locked in large bottom position (cards phase)
    fScale = 1.0;
    fCY    = FOLDER_CY_LARGE;
    fOp    = 1;
  } else if (p < 0.82) {
    // Shrink back + return to center (reverse of enlarge)
    const t = easeIO((p - 0.76) / 0.06);
    fScale = lerp(1.0, 0.35, t);
    fCY    = lerp(FOLDER_CY_LARGE, FOLDER_CY_MID, t);
    fOp    = 1;
  } else if (p < 0.86) {
    // Settle at center
    const t = (p - 0.82) / 0.04;
    fScale = 0.35;
    fCY    = FOLDER_CY_MID + Math.sin(t * Math.PI) * -8;
    fOp    = 1;
  } else {
    // Fly out upward, shrink, fade out
    const t = easeIO((p - 0.86) / 0.14);
    fScale = lerp(0.35, 0.10, t);
    fCY    = lerp(FOLDER_CY_MID, vh * -0.3, t);
    fOp    = lerp(1, 0, t);
  }

  folderImg.style.transform = `translateX(-50%) translateY(${fCY - vh/2 - FH*fScale/2}px) scale(${fScale})`;
  folderImg.style.opacity   = fOp;
  folderImg.style.zIndex    = '2';

  phases.forEach(({ s, e }, i) => {
    const card = cards[i];
    let cCY, cOp, cZ;
    if (p < s || p > e) {
      cCY = CARD_START_CY; cOp = 0; cZ = '1';
    } else if (p <= s + SLIDE_DUR) {
      const t = easeOut((p - s) / SLIDE_DUR);
      cCY = lerp(CARD_START_CY, CARD_REST_CY, t);
      cOp = lerp(0, 1, t); cZ = '3';
    } else if (p <= e - SLIDE_DUR) {
      cCY = CARD_REST_CY; cOp = 1; cZ = '3';
    } else {
      const t = easeIO((p - (e - SLIDE_DUR)) / SLIDE_DUR);
      cCY = lerp(CARD_REST_CY, CARD_START_CY, t);
      cOp = lerp(1, 0, t); cZ = '1';
    }
    const ch = card.offsetHeight || 180;
    card.style.transform     = `translateX(-50%) translateY(${cCY - vh/2 - ch/2}px)`;
    card.style.opacity       = cOp;
    card.style.zIndex        = cZ;
    card.style.pointerEvents = cOp > 0.5 ? 'auto' : 'none';
  });
}

// ── SAFE / PASSCODE LOGIC ─────────────────────────────────────
const CORRECT_CODE = '1234'; // ← Change this to your code
let enteredCode = '';
let unlocked = false;

const cells   = [0,1,2,3].map(i => document.getElementById('dc' + i));
const hint    = document.getElementById('codeHint');
const safeDoor = document.getElementById('safeDoor');
const safeDial = document.getElementById('safeDial');
const bolts    = [0,1,2].map(i => document.getElementById('bolt' + i));
const kivReveal = document.getElementById('kivReveal');
const kivCards  = document.querySelectorAll('.kiv-card');
const passcodeWrap = document.getElementById('passcodeWrap');

function renderCells() {
  cells.forEach((c, i) => {
    c.classList.remove('active','error');
    if (i < enteredCode.length) {
      c.textContent = '•';
    } else if (i === enteredCode.length) {
      c.textContent = '—';
      c.classList.add('active');
    } else {
      c.textContent = '—';
    }
  });
}

function triggerError() {
  cells.forEach(c => c.classList.add('error'));
  safeDial.classList.add('error-spin');
  hint.textContent = 'Incorrect passcode';
  hint.classList.add('error-hint');
  setTimeout(() => {
    safeDial.classList.remove('error-spin');
    enteredCode = '';
    renderCells();
    hint.textContent = 'Enter passcode';
    hint.classList.remove('error-hint');
  }, 1000);
}

function triggerUnlock() {
  unlocked = true;
  hint.textContent = 'Access granted';
  hint.classList.add('success-hint');

  // Spin dial
  safeDial.style.transition = 'transform 0.8s ease';
  safeDial.style.transform = 'translate(-50%,-50%) rotate(720deg)';

  // Retract bolts one by one
  bolts.forEach((b, i) => {
    setTimeout(() => b.classList.add('retracted'), 300 + i * 180);
  });

  // Open door
  setTimeout(() => {
    safeDoor.classList.add('open');
  }, 900);

  // Fade in passcode wrap out + kiv reveal
  setTimeout(() => {
    passcodeWrap.style.transition = 'opacity 0.6s ease';
    passcodeWrap.style.opacity = '0';
    passcodeWrap.style.pointerEvents = 'none';
  }, 1000);

  setTimeout(() => {
    kivReveal.classList.add('visible');
    kivCards.forEach((card, i) => {
      setTimeout(() => card.classList.add('animate-in'), i * 90);
    });
  }, 1400);
}

function handleDigit(d) {
  if (unlocked) return;
  if (d === 'del') {
    enteredCode = enteredCode.slice(0, -1);
    renderCells();
    return;
  }
  if (enteredCode.length >= 4) return;
  enteredCode += d;
  renderCells();
  if (enteredCode.length === 4) {
    setTimeout(() => {
      if (enteredCode === CORRECT_CODE) {
        triggerUnlock();
      } else {
        triggerError();
      }
    }, 150);
  }
}

document.getElementById('numpad').addEventListener('click', e => {
  const btn = e.target.closest('.numpad-btn');
  if (btn) handleDigit(btn.dataset.d);
});

// Keyboard support
document.addEventListener('keydown', e => {
  if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
  if (e.key === 'Backspace') handleDigit('del');
});

renderCells();

// ── Lenis smooth scroll ──────────────────────────────────────
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: true,
});

lenis.on('scroll', updateFolder);

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

window.addEventListener('resize', updateFolder);
updateFolder();
