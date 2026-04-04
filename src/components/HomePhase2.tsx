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
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-[1000px]">
        <ScrollFadeIn>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Who it&apos;s for</p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-[-0.02em] text-[--text-primary] sm:text-3xl">
            Built for people who need the numbers
          </h2>
        </ScrollFadeIn>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PERSONAS.map((persona, i) => (
            <ScrollFadeIn key={persona.role} delay={i * 0.06}>
              <div className="rounded-xl border-l-2 border-l-[--accent-primary] border border-[--border-card] bg-white px-5 py-5">
                <p className="text-[13px] font-semibold text-[--text-primary]">{persona.role}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[--text-secondary]">{persona.action}</p>
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
  { stat: '5', label: 'Independent sources', detail: 'World Bank, Ember, ND-GAIN, OWID, Climate TRACE' },
  { stat: '67', label: 'Indicators per country', detail: 'Emissions, energy, economy, resilience, responsibility' },
  { stat: '0', label: 'Subjective inputs', detail: 'No expert panels, no opinion weights, no pay-to-rank' },
];

export function WhyTrustThis() {
  return (
    <section className="border-y border-[--border-card] bg-[--bg-section] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-[900px]">
        <ScrollFadeIn>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Trust</p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-[-0.02em] text-[--text-primary] sm:text-3xl">
            No opinions. Just data.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-[14px] text-[--text-secondary]">
            Every grade is computed from public datasets with an open methodology.
          </p>
        </ScrollFadeIn>

        <div className="mx-auto mt-12 grid max-w-2xl gap-10 sm:grid-cols-3">
          {TRUST_STATS.map((item, i) => (
            <ScrollFadeIn key={item.label} delay={i * 0.08}>
              <div className="text-center">
                <p className="font-mono text-[2.5rem] font-bold tracking-[-0.04em] text-[--text-primary]">{item.stat}</p>
                <p className="mt-1 text-[13px] font-semibold text-[--text-primary]">{item.label}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[--text-muted]">{item.detail}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        <ScrollFadeIn delay={0.25}>
          <div className="mt-10 text-center">
            <Link href="/methodology" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[--accent-primary] transition-colors hover:text-[#0052CC]">
              Read the full methodology
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
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
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-[900px]">
        <ScrollFadeIn>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[--text-muted]">Process</p>
          <h2 className="mt-3 text-center text-2xl font-bold tracking-[-0.02em] text-[--text-primary] sm:text-3xl">
            From raw data to a letter grade
          </h2>
        </ScrollFadeIn>

        <div className="mx-auto mt-12 grid max-w-2xl gap-0 sm:grid-cols-3">
          {STEPS.map((item, i) => (
            <ScrollFadeIn key={item.step} delay={i * 0.08}>
              <div className="relative px-6 py-6 text-center sm:py-0">
                {i > 0 && <div className="absolute left-0 top-0 hidden h-full w-px bg-[--border-card] sm:block" />}
                {i > 0 && <div className="mx-auto mb-4 h-px w-10 bg-[--border-card] sm:hidden" />}
                <p className="font-mono text-[11px] font-bold tracking-[0.1em] text-[--accent-primary]">{item.step}</p>
                <p className="mt-2 text-base font-bold text-[--text-primary]">{item.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[--text-secondary]">{item.desc}</p>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
