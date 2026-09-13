import type {Metadata} from 'next';
import Link from 'next/link';

import Nav from '@/components/Nav';
import {Block} from '@/components/detail/parts';

// Static shell — no Sanity. These are working notes on Claude's behavior,
// not portfolio content, so they're edited directly in code from whichever
// session is running the experiment rather than authored in the Studio.

type Experiment = {
  id: string;
  name: string;
  question: string;
  fields: {label: string; placeholder: string; value?: React.ReactNode}[];
};

const EXPERIMENTS: Experiment[] = [
  {
    id: '001',
    name: 'One-shot build',
    question:
      'Given a full creative brief in one go — audience, goals, style, required sections — does the output read as a real, trustworthy landing page or a generic template?',
    fields: [
      {
        label: 'Prompt 1',
        placeholder: 'Not yet run. (Model: —)',
        value: (
          <>
            Build a landing page for a Singapore property agent.
            <br />
            Audience: potential home buyers
            <br />
            Primary goal: establish trust in the agent
            <br />
            Secondary goal: encourage visitors to explore property listings
            <br />
            Style: modern and professional, but not corporate
            <br />
            Required sections: Hero, About, Featured Listings, Contact
            <br />
            Desktop and mobile responsive
            <br />
            (Model: Claude Sonnet 5)
          </>
        ),
      },
      {
        label: 'Output 1',
        placeholder: 'No output recorded yet.',
        value: <Link href="/lab/001">Claire Teo, Property Advisor — view the page</Link>,
      },
      {
        label: 'Prompt 2',
        placeholder: 'Not yet run. (Model: —)',
        value: (
          <>
            Build a landing page for a Singapore property agent.
            <br />
            Audience: potential home buyers
            <br />
            Primary goal: establish trust in the agent
            <br />
            Secondary goal: encourage visitors to explore property listings
            <br />
            Style: modern and professional, but not corporate
            <br />
            Required sections: Hero, About, Featured Listings, Contact
            <br />
            Desktop and mobile responsive
            <br />
            (Model: Claude Sonnet 5)
          </>
        ),
      },
      {
        label: 'Output 2',
        placeholder: 'No output recorded yet.',
        value: <Link href="/lab/001-2">Ivy Tan, Property Consultant — view the page</Link>,
      },
    ],
  },
  {
    id: '01',
    name: 'Repeatability',
    question: 'Same prompt, run multiple times — how much does the output actually vary?',
    fields: [
      {label: 'Prompt', placeholder: 'Not yet run. (Model: —)'},
      {label: 'Output', placeholder: 'No output recorded yet.'},
    ],
  },
  {
    id: '02',
    name: 'Vocabulary',
    question: 'Different words, same meaning — does rephrasing a prompt change the answer?',
    fields: [
      {label: 'Prompt', placeholder: 'Not yet run. (Model: —)'},
      {label: 'Output', placeholder: 'No output recorded yet.'},
    ],
  },
  {
    id: '03',
    name: 'Specificity',
    question: 'Different prompts, differing specificity — does more detail actually help?',
    fields: [
      {label: 'Prompt', placeholder: 'Not yet run. (Model: —)'},
      {label: 'Output', placeholder: 'No output recorded yet.'},
    ],
  },
];

export const metadata: Metadata = {
  title: 'Lab — Darrell',
  description: 'Experiments and hypothesis tests on Claude.',
};

export default function LabPage() {
  return (
    <>
      <Nav alwaysSolid />
      <main className="detail">
        <div className="detail__inner">
          <div className="detail__top">
            <Link className="detail__back" href="/">
              <span aria-hidden="true">←</span> Back to site
            </Link>
            <span className="detail__count">
              {String(EXPERIMENTS.length).padStart(3, '0')} experiments
            </span>
          </div>

          <header className="detail__head">
            <p className="detail__eyebrow">Lab</p>
            <h1 className="detail__title">Experiments on Claude.</h1>
            <p className="detail__lede">
              A running set of small hypothesis tests on how Claude behaves — prompted here,
              filled in as they're actually run.
            </p>
          </header>

          <div className="detail__body">
            {EXPERIMENTS.map((exp, i) => (
              <Block key={exp.id} label={`${exp.id} — ${exp.name}`} index={i}>
                <p className="prose__aside">{exp.question}</p>
                <dl className="lab__fields">
                  {exp.fields.map((field) => (
                    <div className="lab__field" key={field.label}>
                      <dt>{field.label}</dt>
                      <dd className={field.value ? 'lab__field-value--filled' : undefined}>
                        {field.value ?? field.placeholder}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Block>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
