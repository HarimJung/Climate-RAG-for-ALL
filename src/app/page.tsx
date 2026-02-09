import Link from 'next/link';
import { PLANS } from '@/lib/constants';
import { EmailSignupForm } from '@/components/EmailSignupForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Climate Intelligence for Sustainability Professionals',
  description: 'AI-powered climate data platform. 200 countries. Real-time data. One search. Trusted by ESG analysts, consultants, and sustainability managers worldwide.',
};

const VALUE_CARDS = [
  {
    emoji: '🌍',
    title: '200 Country Profiles',
    description: 'Comprehensive climate indicators, emissions data, and policy analysis for every nation.',
  },
  {
    emoji: '📄',
    title: 'Report Library + AI',
    description: 'Search IPCC, UNEP, and WMO reports with AI. Get instant answers from 1000+ pages.',
  },
  {
    emoji: '📊',
    title: 'Live Dashboard',
    description: 'Interactive visualizations of CO2 emissions, renewable energy, and climate risks.',
  },
];

const PERSONAS = [
  {
    role: 'ESG Analysts',
    description: 'Track climate metrics across your portfolio companies. Compare country-level risks for investment decisions.',
    icon: '📈',
  },
  {
    role: 'Sustainability Consultants',
    description: 'Access reliable data sources for client reports. ISSB S2 compliance made easier.',
    icon: '🎯',
  },
  {
    role: 'Corporate Sustainability Teams',
    description: 'Monitor climate risks in your supply chain. Generate data-backed sustainability reports.',
    icon: '🏢',
  },
];

export default function HomePage() {
  const plansArray = Object.values(PLANS).slice(0, 3);

  return (
    <div className="bg-slate-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Climate Intelligence for{' '}
            <span className="text-emerald-500">Sustainability Professionals</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
            AI-powered climate data platform. 200 countries. Real-time data. One search.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Explore Free Dashboard
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-8 py-4 text-lg font-semibold text-white transition-colors hover:border-slate-600 hover:bg-slate-800"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Value Cards */}
      <section className="border-t border-slate-800 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 transition-all hover:border-emerald-500/50 hover:bg-slate-900"
              >
                <div className="text-4xl">{card.emoji}</div>
                <h3 className="mt-4 text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-slate-400">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for? */}
      <section className="border-t border-slate-800 bg-slate-900/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Who is this for?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {PERSONAS.map((persona) => (
              <div
                key={persona.role}
                className="rounded-xl border border-slate-800 bg-slate-950 p-8"
              >
                <div className="text-4xl">{persona.icon}</div>
                <h3 className="mt-4 text-xl font-semibold text-emerald-400">{persona.role}</h3>
                <p className="mt-2 text-slate-400">{persona.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="border-t border-slate-800 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Start free. Upgrade when you need more.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {plansArray.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${plan.name === 'Climate Pro'
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-slate-800 bg-slate-900/50'
                  }`}
              >
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === 0 ? '/dashboard' : '/pricing'}
                  className={`mt-8 block rounded-lg py-3 text-center font-medium transition-colors ${plan.name === 'Climate Pro'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'border border-slate-700 text-white hover:bg-slate-800'
                    }`}
                >
                  {plan.price === 0 ? 'Get Started Free' : 'View Details'}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link href="/pricing" className="text-emerald-400 hover:text-emerald-300">
              See all plans and features →
            </Link>
          </p>
        </div>
      </section>

      {/* Email Signup */}
      <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Stay Updated on Climate Data
          </h2>
          <p className="mt-4 text-slate-400">
            Get weekly insights on climate policy, data updates, and sustainability trends.
          </p>
          <div className="mt-8">
            <EmailSignupForm />
          </div>
        </div>
      </section>
    </div>
  );
}
