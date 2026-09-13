import type {Metadata} from 'next';
import Link from 'next/link';
import {Archivo, Source_Serif_4} from 'next/font/google';

import ContactForm from './ContactForm';
import styles from './page.module.css';

// Lab experiment 01 (Repeatability) — a landing page built from a one-shot creative brief,
// run twice to test how much the output varies.
// Deliberately isolated from the portfolio's own two-tone theme: this is a
// fictional client (Claire Teo, property advisor) so it needs its own
// palette and fonts, loaded and scoped here rather than in the root layout.

const display = Archivo({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-lab-display',
  display: 'swap',
});

const body = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-lab-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Claire Teo, Property Advisor — Lab 01',
  description:
    'Concept landing page for a Singapore property advisor — a Claude Code lab experiment.',
  robots: {index: false, follow: false},
};

function HdbIcon() {
  return (
    <svg className={styles.listingIcon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="6" y="8" width="36" height="34" stroke="currentColor" strokeWidth="1.6" />
      {[0, 1, 2].map((col) =>
        [0, 1, 2, 3].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={11 + col * 10}
            y={13 + row * 7}
            width="6"
            height="4.4"
            stroke="currentColor"
            strokeWidth="1"
          />
        )),
      )}
    </svg>
  );
}

function CondoIcon() {
  return (
    <svg className={styles.listingIcon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="12" y="5" width="24" height="38" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="15" x2="36" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="25" x2="36" y2="25" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="35" x2="36" y2="35" stroke="currentColor" strokeWidth="1" />
      <rect x="17" y="19" width="5" height="4" fill="currentColor" />
      <rect x="26" y="29" width="5" height="4" fill="currentColor" />
    </svg>
  );
}

function TerraceIcon() {
  return (
    <svg className={styles.listingIcon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 22 L24 9 L40 22" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="12" y="22" width="24" height="18" stroke="currentColor" strokeWidth="1.6" />
      <rect x="21" y="30" width="6" height="10" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const LISTINGS = [
  {
    icon: HdbIcon,
    address: '119 Commonwealth Drive',
    spec: '4-room resale flat, 969 sq ft, 11th floor',
    price: '$688,000',
  },
  {
    icon: CondoIcon,
    address: 'The Gardens at Bishan, #09-14',
    spec: '2-bedroom condo, 764 sq ft, renovated 2023',
    price: '$1,280,000',
  },
  {
    icon: TerraceIcon,
    address: '14 Jalan Riang, Serangoon Gardens',
    spec: 'Corner terrace, 2,150 sq ft, 4 bedrooms',
    price: '$3,600,000',
  },
  {
    icon: HdbIcon,
    address: 'Tampines Street 41',
    spec: '4-room resale flat, 926 sq ft, ground floor with patio',
    price: '$560,000',
  },
];

export default function Lab01Page() {
  return (
    <div className={`${styles.page} ${display.variable} ${body.variable}`}>
      <Link className={styles.back} href="/lab">
        ← Back to Lab
      </Link>

      <header className={styles.inner}>
        <nav className={styles.nav}>
          <div>
            <span className={styles.wordmark}>Claire Teo</span>
            <span className={styles.wordtag}>Property Advisor, Everton Grove Realty</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#about">About</a>
            <a href="#listings">Listings</a>
            <a className={styles.navCta} href="#contact">
              Book a call
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className={styles.inner}>
          <div className={styles.hero}>
            <div className={styles.heroText}>
              <h1 className={styles.heroHeadline}>
                Buying a home here is a paperwork problem before it&apos;s a taste problem.
              </h1>
              <p className={styles.heroSub}>
                I&apos;m Claire Teo, an independent property advisor. Nine years in, most of
                what I do is read contracts closely, check numbers twice, and tell clients
                when to walk away from a unit they&apos;ve already fallen for.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.btnPrimary} href="#listings">
                  See the current listings
                </a>
                <a className={styles.textLink} href="#contact">
                  Book a 15-minute call
                </a>
              </div>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNum}>9</span>
                  <span className={styles.statLabel}>years advising Singapore buyers</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>286</span>
                  <span className={styles.statLabel}>homes closed</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>31</span>
                  <span className={styles.statLabel}>
                    days, average from offer to key collection
                  </span>
                </div>
              </div>
            </div>

            <svg
              className={styles.heroPlan}
              viewBox="0 0 480 400"
              role="img"
              aria-label="Line drawing of a four-room flat floor plan"
            >
              <rect x="20" y="20" width="420" height="340" className={styles.planLine} />
              <line x1="280" y1="20" x2="280" y2="360" className={styles.planLine} />
              <line x1="280" y1="140" x2="440" y2="140" className={styles.planLine} />
              <line x1="280" y1="190" x2="440" y2="190" className={styles.planLine} />
              <line x1="360" y1="190" x2="360" y2="360" className={styles.planLine} />

              <path d="M20 340 L20 300" className={styles.planDoor} />
              <path d="M20 300 A40 40 0 0 1 60 340" className={styles.planDoor} />

              <path d="M280 100 L280 60" className={styles.planDoor} />
              <path d="M280 60 A40 40 0 0 1 320 100" className={styles.planDoor} />

              <path d="M280 290 L280 250" className={styles.planDoor} />
              <path d="M280 250 A40 40 0 0 1 320 290" className={styles.planDoor} />

              <text x="150" y="205" textAnchor="middle" className={styles.planLabel}>
                LIVING / DINING
              </text>
              <text x="360" y="84" textAnchor="middle" className={styles.planLabel}>
                KITCHEN
              </text>
              <text x="360" y="169" textAnchor="middle" className={styles.planLabel}>
                BATH
              </text>
              <text x="320" y="279" textAnchor="middle" className={styles.planLabel}>
                BEDROOM 2
              </text>
              <text x="400" y="279" textAnchor="middle" className={styles.planLabel}>
                MASTER
              </text>
            </svg>
          </div>
        </section>

        <section id="about" className={`${styles.section} ${styles.inner}`}>
          <div className={styles.about}>
            <div>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionHeading}>
                  The parts of the job that don&apos;t photograph well
                </h2>
              </div>
              <div className={styles.aboutBody}>
                <p>
                  I started after helping my own parents sell the flat they&apos;d raised us
                  in and buy something smaller. What struck me wasn&apos;t the viewing — it
                  was how much of the actual decision happened afterward, at a kitchen table,
                  working through a spreadsheet neither of us fully understood.
                </p>
                <p>
                  Now that&apos;s most of the work. Reading an Option to Purchase closely
                  enough to catch what&apos;s missing. Pulling a unit&apos;s actual
                  transaction history instead of trusting the asking price. Telling a client
                  the flat they&apos;ve fallen for is priced to move fast, and the one next
                  door isn&apos;t — before they sign anything.
                </p>
              </div>
              <div className={styles.quote}>
                <p>
                  &ldquo;She told us not to buy the first unit. Pointed out the stack was two
                  floors below what we could get for the same price, one block over. We
                  waited three weeks. Worth it.&rdquo;
                </p>
                <cite>Wei Jie and Huimin, bought a resale flat in Bishan</cite>
              </div>
            </div>

            <div className={styles.idCard}>
              <div className={styles.idMonogram}>CT</div>
              <p className={styles.idName}>Claire Teo</p>
              <p className={styles.idRole}>Property Advisor</p>
              <dl className={styles.idList}>
                <div className={styles.idRow}>
                  <dt>CEA Registration</dt>
                  <dd>R012345A</dd>
                </div>
                <div className={styles.idRow}>
                  <dt>Agency</dt>
                  <dd>Everton Grove Realty</dd>
                </div>
                <div className={styles.idRow}>
                  <dt>Licence</dt>
                  <dd>L3008022J</dd>
                </div>
                <div className={styles.idRow}>
                  <dt>Speaks</dt>
                  <dd>English, Mandarin, Malay</dd>
                </div>
              </dl>
              <div className={styles.idBarcode} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section id="listings" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.inner}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionHeading}>What&apos;s open for viewing this month</h2>
              <p className={styles.sectionSub}>
                New units get added as I confirm access with the seller — this list turns
                over most weeks.
              </p>
            </div>
          </div>
          <div className={styles.listings}>
            {LISTINGS.map((listing) => (
              <div className={styles.listing} key={listing.address}>
                <listing.icon />
                <p className={styles.listingAddr}>{listing.address}</p>
                <p className={styles.listingSpec}>{listing.spec}</p>
                <p className={styles.listingPrice}>{listing.price}</p>
                <a className={styles.listingLink} href="#contact">
                  Ask Claire about this one
                </a>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className={`${styles.section} ${styles.inner}`}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionHeading}>Tell me what you&apos;re trying to solve</h2>
            <p className={styles.sectionSub}>
              Not just what you want to buy — what&apos;s driving the move. Upgrading,
              downsizing, first flat, investment. It changes the advice.
            </p>
          </div>
          <div className={styles.contact}>
            <ContactForm />
            <div className={styles.signboard}>
              <h3>Prefer to talk first?</h3>
              <p>
                <a href="mailto:hello@example.com">hello@example.com</a>
              </p>
              <p>Replies Monday to Saturday, 9am to 8pm.</p>
              <p>Concept contact details — this page doesn&apos;t send real messages.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={`${styles.footer} ${styles.inner}`}>
        <div>
          <p>Claire Teo — Property Advisor</p>
          <p>Everton Grove Realty, Licence L3008022J</p>
        </div>
        <div>
          <p>
            Concept page for a <Link href="/lab">Claude Code lab experiment</Link>. Not a
            real listing service.
          </p>
        </div>
      </footer>
    </div>
  );
}
