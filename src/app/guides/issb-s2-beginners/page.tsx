import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'ISSB S2 Climate Disclosure: A Practical Guide for Beginners',
    description: 'Understand IFRS S2 requirements, physical vs transition risks, and how to prepare your first climate disclosure.',
    keywords: ['ISSB S2', 'IFRS S2', 'climate disclosure', 'TCFD', 'sustainability reporting', 'ESG'],
};

export default function IssbS2BeginnersGuide() {
    return (
        <article className="bg-white px-4 py-12">
            <div className="mx-auto max-w-3xl">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm">
                    <Link href="/guides" className="text-[--text-muted] hover:text-[--accent-primary]">
                        Guides
                    </Link>
                    <span className="mx-2 text-[--border-card]">/</span>
                    <span className="text-[--text-secondary]">ISSB S2 Beginners</span>
                </nav>

                <header className="mb-12">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[--accent-primary]">
                        Reporting
                    </span>
                    <h1 className="mt-4 text-3xl font-bold text-[--text-primary] sm:text-4xl">
                        ISSB S2 Climate Disclosure: A Practical Guide for Beginners
                    </h1>
                    <p className="mt-4 text-lg text-[--text-secondary]">
                        Understand IFRS S2 requirements, physical vs transition risks, and how to prepare your first climate disclosure.
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-sm text-[--text-muted]">
                        <span>Updated: February 2026</span>
                        <span>•</span>
                        <span>15 min read</span>
                    </div>
                </header>

                <div className="prose prose-emerald max-w-none">
                    <h2 className="text-2xl font-bold text-[--text-primary]">What is IFRS S2?</h2>
                    <p className="text-[--text-secondary]">
                        IFRS S2 (Climate-related Disclosures) is a global sustainability reporting standard issued by the International Sustainability Standards Board (ISSB). It requires companies to disclose climate-related risks and opportunities that could reasonably affect their financial position, performance, and cash flows.
                    </p>
                    <p className="text-[--text-secondary]">
                        Building on the TCFD framework, IFRS S2 is structured around four pillars: Governance, Strategy, Risk Management, and Metrics & Targets. Since January 2024, it has become the baseline for climate disclosure globally, with jurisdictions adopting or aligning their standards with ISSB requirements.
                    </p>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">The Four Pillars of IFRS S2</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">1. Governance</h3>
                    <p className="text-[--text-secondary]">
                        Disclose how the board and management oversee climate-related risks and opportunities. This includes describing the governance body responsible, how climate is integrated into strategy discussions, and how performance is monitored.
                    </p>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li>Board oversight of climate risks and opportunities</li>
                        <li>Management&apos;s role in assessing and managing climate risks</li>
                        <li>How climate considerations are integrated into remuneration policies</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">2. Strategy</h3>
                    <p className="text-[--text-secondary]">
                        Describe climate-related risks and opportunities that could affect your business model and value chain. This is where you explain the actual and potential impacts on your financial position.
                    </p>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>Physical risks</strong> - Acute (extreme weather events) and chronic (long-term shifts in climate patterns)</li>
                        <li><strong>Transition risks</strong> - Policy/legal, technology, market, and reputation risks from moving to a lower-carbon economy</li>
                        <li><strong>Climate-related opportunities</strong> - Resource efficiency, energy sources, products/services, markets, and resilience</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">3. Risk Management</h3>
                    <p className="text-[--text-secondary]">
                        Describe the processes used to identify, assess, prioritize, and monitor climate-related risks. Explain how these processes are integrated into your overall enterprise risk management.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">4. Metrics and Targets</h3>
                    <p className="text-[--text-secondary]">
                        Disclose the metrics and targets used to measure, monitor, and manage climate-related risks and opportunities. Key requirements include:
                    </p>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>Scope 1 emissions</strong> - Direct GHG emissions from owned/controlled sources</li>
                        <li><strong>Scope 2 emissions</strong> - Indirect emissions from purchased energy</li>
                        <li><strong>Scope 3 emissions</strong> - All other indirect emissions in the value chain</li>
                        <li>Industry-based metrics as defined by SASB standards</li>
                        <li>Internal carbon prices if used</li>
                        <li>Climate-related targets and progress</li>
                    </ul>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">Physical vs Transition Risks</h2>

                    <div className="my-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h4 className="font-semibold text-orange-600">Physical Risks</h4>
                            <p className="mt-2 text-sm text-[--text-secondary]">
                                Direct impacts of climate change on operations, assets, and supply chains.
                            </p>
                            <ul className="mt-3 space-y-1 text-sm text-[--text-muted]">
                                <li>Acute: Floods, hurricanes, wildfires</li>
                                <li>Chronic: Sea-level rise, water stress, heat waves</li>
                            </ul>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <h4 className="font-semibold text-[--accent-primary]">Transition Risks</h4>
                            <p className="mt-2 text-sm text-[--text-secondary]">
                                Risks from the shift to a lower-carbon economy.
                            </p>
                            <ul className="mt-3 space-y-1 text-sm text-[--text-muted]">
                                <li>Policy: Carbon taxes, emission regulations</li>
                                <li>Technology: Shift to renewables</li>
                                <li>Market: Changing consumer preferences</li>
                            </ul>
                        </div>
                    </div>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">Scenario Analysis</h2>
                    <p className="text-[--text-secondary]">
                        IFRS S2 requires companies to use climate-related scenario analysis to assess resilience. At minimum, you should consider:
                    </p>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>1.5°C scenario</strong> - Aligned with the Paris Agreement, aggressive transition, rapid decarbonization</li>
                        <li><strong>2-3°C scenario</strong> - Moderate transition with higher physical risks</li>
                        <li><strong>4°C+ scenario</strong> - Business-as-usual with severe physical impacts</li>
                    </ul>
                    <p className="text-[--text-secondary]">
                        Use publicly available scenarios from the IEA (Net Zero by 2050), NGFS, or IPCC pathways as starting points.
                    </p>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">Getting Started: A 5-Step Approach</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Step 1: Assess Materiality</h3>
                    <p className="text-[--text-secondary]">
                        Identify which climate risks and opportunities are material to your business. Consider your industry, geography, and value chain exposure.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Step 2: Calculate Your Carbon Footprint</h3>
                    <p className="text-[--text-secondary]">
                        Start with Scope 1 and 2 emissions using the GHG Protocol methodology. Then assess Scope 3 categories relevant to your industry.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Step 3: Map Your Governance</h3>
                    <p className="text-[--text-secondary]">
                        Document how climate oversight is structured in your organization. Identify gaps and assign clear responsibilities.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Step 4: Conduct Scenario Analysis</h3>
                    <p className="text-[--text-secondary]">
                        Even a qualitative analysis is a good starting point. Assess how different climate scenarios could affect your strategy and financial performance.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Step 5: Set Targets and Disclose</h3>
                    <p className="text-[--text-secondary]">
                        Set measurable climate targets aligned with science-based methodologies. Prepare your first disclosure following the ISSB structure.
                    </p>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">Conclusion</h2>
                    <p className="text-[--text-secondary]">
                        IFRS S2 compliance may seem daunting, but starting early gives you a significant advantage. Begin with what you know, build your data infrastructure gradually, and iterate on your disclosures. The key is to start the process and improve over time.
                    </p>
                </div>

                {/* CTA */}
                <div className="mt-12 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                    <h3 className="text-xl font-semibold text-[--text-primary]">
                        Need Climate Data for Your Disclosure?
                    </h3>
                    <p className="mt-2 text-[--text-secondary]">
                        VisualClimate provides country-level climate data and AI-powered analysis for ISSB S2 reporting.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-[--text-primary] hover:bg-emerald-500"
                    >
                        Explore Dashboard
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </article>
    );
}
