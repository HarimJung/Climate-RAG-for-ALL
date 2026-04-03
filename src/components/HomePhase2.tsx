import Link from 'next/link';
import { ScrollFadeIn } from '@/components/climate/scroll-fade-in';

// ── Who It's For ────────────────────────────────────────────────────────────

const PERSONAS = [
  { role: 'Sustainability teams', action: 'Benchmark against peers and report to stakeholders with exportable charts.' },
  { role: 'Journalists', action: 'Verify claims with real data. Download publication-ready visuals in one click.' },
  { role: 'Educators', action: 'Teach climate accountability with 250 country profiles and transparent methodology.' },
  { role: 'Policy analysts', action: 'Track NDC progress, compare regions, and decompose emission drivers.' },
];

export function WhoItsFor() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <ScrollFadeIn>
          <h2 className="text-center text-3xl font-bold text-[--text-primary] sm:text-4xl">
            Built for people who need the numbers.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[--text-secondary]">
            Whether you&apos;re writing policy, teaching a class, or filing a disclosure.
          </p>
        </ScrollFadeIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((persona, i) => (
            <ScrollFadeIn key={persona.role} delay={i * 0.08}>
              <div className="rounded-2xl border border-[--border-card] bg-white p-6">
                <p className="text-sm font-bold text-[--accent-primary]">{persona.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-secondary]">{persona.action}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why Trust This ──────────────────────────────────────────────────────────

const TRUST_STATS = [
  { stat: '5', label: 'Independent data sources', detail: 'World Bank, Ember, ND-GAIN, OWID, Climate TRACE' },
  { stat: '67', label: 'Indicators per country', detail: 'Emissions, energy, economy, resilience, responsibility' },
  { stat: '0', label: 'Subjective inputs', detail: 'No expert panels, no opinion weights, no pay-to-rank' },
];

export function WhyTrustThis() {
  return (
    <section className="border-y border-[--border-card] bg-[--bg-section] px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <ScrollFadeIn>
          <h2 className="text-center text-3xl font-bold text-[--text-primary] sm:text-4xl">
            No opinions. Just data.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[--text-secondary]">
            Every grade is computed from public datasets with an open methodology.
          </p>
        </ScrollFadeIn>

        <div className="mx-auto mt-14 grid max-w-3xl gap-8 sm:grid-cols-3">
          {TRUST_STATS.map((item, i) => (
            <ScrollFadeIn key={item.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="font-mono text-4xl font-bold text-[--text-primary]">{item.stat}</p>
                <p className="mt-2 text-sm font-semibold text-[--text-primary]">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[--text-muted]">{item.detail}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay={0.3}>
          <div className="mt-10 text-center">
            <Link href="/methodology" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[--accent-primary] transition-colors hover:text-[#0052CC]">
              Read the full methodology
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </ScrollFadeIn>
      </div>
    </section>
  );
}

// ── How It Works ────────────────────────────────────────────────────────────

const STEPS = [
  { step: '01', title: 'Collect', desc: '67 indicators from 5 public sources, updated annually. Cross-verified for consistency.' },
  { step: '02', title: 'Score', desc: '5 weighted domains — Emissions (30%), Energy (25%), Economy, Responsibility, Resilience (15% each).' },
  { step: '03', title: 'Grade', desc: 'A+ to F scale with Changer / Starter / Talker classification based on real trends.' },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <ScrollFadeIn>
          <h2 className="text-center text-3xl font-bold text-[--text-primary] sm:text-4xl">
            From raw data to a letter grade.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-lg text-[--text-secondary]">
            Three steps, fully transparent. No black boxes.
          </p>
        </ScrollFadeIn>

        <div className="mx-auto mt-14 grid max-w-3xl gap-0 sm:grid-cols-3">
          {STEPS.map((item, i) => (
            <ScrollFadeIn key={item.step} delay={i * 0.1}>
              <div className="relative px-6 py-8 text-center sm:py-0">
                {i > 0 && <div className="absolute left-0 top-0 hidden h-full w-px bg-[--border-card] sm:block" />}
                {i > 0 && <div className="mx-auto mb-6 h-px w-12 bg-[--border-card] sm:hidden" />}
                <p className="font-mono text-xs font-bold tracking-widest text-[--accent-primary]">{item.step}</p>
                <p className="mt-2 text-lg font-bold text-[--text-primary]">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[--text-secondary]">{item.desc}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
