import { Metadata } from 'next';
import Link from 'next/link';
import { PLANS } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Simple, transparent pricing for VisualClimate. Start free, upgrade as your needs grow.',
};

const faqs = [
    {
        q: 'Can I try before I subscribe?',
        a: 'Yes! The Free plan gives you full access to the dashboard with 5 climate indicators and 3 AI questions per day.',
    },
    {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards via Stripe. Enterprise plans can use invoicing.',
    },
    {
        q: 'Can I cancel anytime?',
        a: 'Yes. All plans are month-to-month. Cancel anytime from your account settings.',
    },
    {
        q: 'What data sources do you use?',
        a: 'We aggregate data from the World Bank, Climate Watch, IPCC, UNEP, and WMO reports.',
    },
];

export default function PricingPage() {
    const plansArray = Object.values(PLANS);

    return (
        <div className="bg-slate-950 px-4 py-20">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
                        Start free, upgrade as your needs grow. All plans include access to our
                        comprehensive climate data platform.
                    </p>
                </div>

                {/* Plans Grid */}
                <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {plansArray.map((plan) => {
                        const isPopular = plan.name === 'Climate Pro';

                        return (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-xl border p-8 ${isPopular
                                        ? 'border-emerald-500 bg-emerald-950/30'
                                        : 'border-slate-800 bg-slate-900/50'
                                    }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-white">
                                            ${plan.price}
                                        </span>
                                        <span className="text-slate-400">/month</span>
                                    </div>
                                </div>

                                <ul className="flex-1 space-y-3">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-2 text-sm text-slate-300"
                                        >
                                            <svg
                                                className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4.5 12.75l6 6 9-13.5"
                                                />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={plan.price === 0 ? '/dashboard' : '/signup'}
                                    className={`mt-8 block rounded-lg py-3 text-center text-sm font-semibold transition-colors ${isPopular
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                            : 'border border-slate-700 text-white hover:bg-slate-800'
                                        }`}
                                >
                                    {plan.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-20">
                    <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <div className="mx-auto mt-12 max-w-3xl space-y-6">
                        {faqs.map((faq) => (
                            <div
                                key={faq.q}
                                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
                            >
                                <h3 className="font-semibold text-white">{faq.q}</h3>
                                <p className="mt-2 text-slate-400">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-16 text-center">
                    <p className="text-lg text-slate-400">
                        Need a custom plan?{' '}
                        <Link href="/chat" className="text-emerald-400 hover:text-emerald-300">
                            Contact us →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
