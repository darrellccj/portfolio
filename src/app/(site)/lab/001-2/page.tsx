import type {Metadata} from 'next';
import Link from 'next/link';
import {Manrope} from 'next/font/google';

import ContactForm from './ContactForm';
import styles from './page.module.css';

// Lab experiment 001, run 2 — same brief as /lab/001, built independently
// (fresh persona, palette, type system and layout decisions) to see how
// much a one-shot output actually varies between attempts. See LAB.md.

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-lab2',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Ivy Tan, Property Consultant — Lab 001 (Run 2)',
  description:
    'Concept landing page for a Singapore property consultant — a Claude Code lab experiment, second run.',
  robots: {index: false, follow: false},
};

function SkylineArt() {
  return (
    <svg
      className={styles.skyline}
      viewBox="0 0 640 320"
      role="img"
      aria-label="Simplified line drawing of the Singapore skyline"
      fill="none"
    >
      <line x1="0" y1="260" x2="640" y2="260" className={styles.skyLine} />
      <rect x="40" y="150" width="34" height="110" className={styles.skyLine} />
      <rect x="86" y="180" width="26" height="80" className={styles.skyLine} />
      <g className={styles.skyLine}>
        <rect x="140" y="120" width="22" height="140" />
        <rect x="168" y="95" width="22" height="165" />
        <rect x="196" y="120" width="22" height="140" />
        <path d="M140 120 L154 100 L168 120" />
        <path d="M196 120 L210 100 L218 120" />
      </g>
      <rect x="250" y="200" width="30" height="60" className={styles.skyLine} />
      <g className={styles.skyAccent}>
        <path d="M300 260 C300 170 340 160 340 100" />
        <circle cx="340" cy="90" r="9" />
        <path d="M370 260 C370 190 400 180 400 130" />
        <circle cx="400" cy="120" r="7" />
        <path d="M430 260 C430 160 380 150 380 90" />
        <circle cx="380" cy="80" r="10" />
      </g>
      <rect x="470" y="140" width="46" height="120" className={styles.skyLine} />
      <rect x="524" y="170" width="24" height="90" className={styles.skyLine} />
      <path
        d="M560 200 C560 200 560 150 585 150 C610 150 610 200 610 200"
        className={styles.skyLine}
      />
      <line x1="560" y1="200" x2="610" y2="200" className={styles.skyLine} />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className={styles.cardIcon} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="9" y="6" width="22" height="30" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      {[0, 1, 2].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={13 + col * 9}
            y={11 + row * 7.5}
            width="5.5"
            height="4.5"
            fill="currentColor"
            opacity="0.85"
          />
        )),
      )}
      <rect x="16" y="31" width="8" height="5" fill="currentColor" />
    </svg>
  );
}

const LISTINGS = [
  {
    type: 'HDB · 4-room resale',
    address: 'Toa Payoh Lorong 1',
    spec: '958 sq ft · 9th floor · MRT 6 min walk',
    price: '$632,000',
  },
  {
    type: 'Condo · 3-bedroom',
    address: 'Queens Peak, Queenstown',
    spec: '1,076 sq ft · high floor · TOP 2020',
    price: '$1,850,000',
  },
  {
    type: 'Executive condo',
    address: 'Piermont Grand, Punggol',
    spec: '1,001 sq ft · 5th floor · full facilities',
    price: '$1,180,000',
  },
  {
    type: 'Landed · Semi-detached',
    address: 'Jalan Mutiara, Sembawang',
    spec: '2,400 sq ft land · 4+1 bedrooms',
    price: '$2,950,000',
  },
];

export default function Lab001Run2Page() {
  return (
    <div className={`${styles.page} ${manrope.variable}`}>
      <Link className={styles.back} href="/lab">
        ← Back to Lab
      </Link>

      <header className={styles.navWrap}>
        <nav className={styles.nav}>
          <span className={styles.wordmark}>
            Ivy Tan <span className={styles.wordmarkDot}>·</span> Northshore Realty
          </span>
          <div className={styles.navLinks}>
            <a href="#about">About</a>
            <a href="#listings">Listings</a>
            <a href="#contact">Contact</a>
            <a className={styles.navCta} href="#contact">
              Talk to Ivy
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <SkylineArt />
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Independent property consultant, Singapore</p>
            <h1 className={styles.heroHeadline}>
              Finding the right home shouldn&apos;t feel like guesswork.
            </h1>
            <p className={styles.heroSub}>
              I&apos;m Ivy Tan. I help buyers in Singapore make property decisions with actual
              numbers behind them — not just a viewing and a gut feeling. Seven years in, most
              of my clients come from a referral, not an ad.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.btnPrimary} href="#listings">
                Browse current listings
              </a>
              <a className={styles.btnGhost} href="#contact">
                Book a free consult
              </a>
            </div>
          </div>
          <div className={styles.statBar}>
            <div className={styles.stat}>
              <span className={styles.statNum}>7</span>
              <span className={styles.statLabel}>years in the Singapore market</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>214</span>
              <span className={styles.statLabel}>transactions closed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>96%</span>
              <span className={styles.statLabel}>of clients refer a friend or family member</span>
            </div>
          </div>
        </section>

        <section id="about" className={styles.section}>
          <div className={styles.about}>
            <div className={styles.aboutText}>
              <p className={styles.kicker}>About Ivy</p>
              <h2 className={styles.sectionHeading}>Ten years in banking, before this</h2>
              <p>
                I spent a decade in credit risk before moving into property — which mostly
                means I&apos;m the agent who actually reads the loan eligibility numbers before
                you fall for a unit you can&apos;t finance comfortably.
              </p>
              <p>
                My job isn&apos;t to get you into a home fast. It&apos;s to make sure the home
                you land on still makes sense in five years — resale value, loan tenure,
                renovation cost, the lot. If a unit doesn&apos;t hold up under that, I&apos;ll
                tell you before you view it a second time.
              </p>
              <blockquote className={styles.quote}>
                <p>
                  &ldquo;Ivy talked us out of a unit we liked and into one we&apos;d walked past.
                  Better stack, same price. We wouldn&apos;t have caught that ourselves.&rdquo;
                </p>
                <cite>Farah &amp; Joel, bought a resale condo in Queenstown</cite>
              </blockquote>
            </div>
            <aside className={styles.credentials}>
              <div className={styles.avatarMark} aria-hidden="true">
                IT
              </div>
              <dl className={styles.credList}>
                <div className={styles.credRow}>
                  <dt>CEA Registration</dt>
                  <dd>R029981F</dd>
                </div>
                <div className={styles.credRow}>
                  <dt>Agency</dt>
                  <dd>Northshore Realty Pte Ltd</dd>
                </div>
                <div className={styles.credRow}>
                  <dt>Licence</dt>
                  <dd>L3021044K</dd>
                </div>
                <div className={styles.credRow}>
                  <dt>Focus areas</dt>
                  <dd>Resale HDB, condo, EC</dd>
                </div>
                <div className={styles.credRow}>
                  <dt>Languages</dt>
                  <dd>English, Mandarin</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section id="listings" className={styles.sectionAlt}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Featured listings</p>
            <h2 className={styles.sectionHeading}>Open for viewing this month</h2>
            <p className={styles.sectionSub}>
              A working list, not a catalogue — units come off this page once they&apos;re under
              offer.
            </p>
          </div>
          <div className={styles.listingGrid}>
            {LISTINGS.map((listing) => (
              <article className={styles.card} key={listing.address}>
                <div className={styles.cardArt}>
                  <BuildingIcon />
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardType}>{listing.type}</p>
                  <h3 className={styles.cardAddr}>{listing.address}</h3>
                  <p className={styles.cardSpec}>{listing.spec}</p>
                  <div className={styles.cardFoot}>
                    <span className={styles.cardPrice}>{listing.price}</span>
                    <a className={styles.cardLink} href="#contact">
                      Ask about this →
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className={styles.section}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Get in touch</p>
            <h2 className={styles.sectionHeading}>Tell Ivy what you&apos;re trying to do</h2>
            <p className={styles.sectionSub}>
              First flat, upgrading, or just checking what your budget gets you — she&apos;ll
              tell you honestly if now&apos;s the time.
            </p>
          </div>
          <div className={styles.contactGrid}>
            <div className={styles.formCard}>
              <ContactForm />
            </div>
            <div className={styles.contactCard}>
              <h3>Reach her directly</h3>
              <p>
                <a href="mailto:hello@example.com">hello@example.com</a>
              </p>
              <p>
                <a href="tel:+6591234567">+65 9123 4567</a> (WhatsApp preferred)
              </p>
              <p className={styles.contactHours}>Weekdays 10am–7pm, viewings by appointment.</p>
              <p className={styles.contactDisclaimer}>
                Concept contact details — this page doesn&apos;t send real messages.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <p className={styles.footerName}>Ivy Tan — Property Consultant</p>
          <p>Northshore Realty Pte Ltd, Licence L3021044K</p>
        </div>
        <p>
          Concept page, run 2 of a <Link href="/lab">Claude Code lab experiment</Link>. Not a
          real listing service.
        </p>
      </footer>
    </div>
  );
}
