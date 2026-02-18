import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'The Complete Guide to Free Climate Data Sources (2026)',
    description: 'Comprehensive guide to accessing free climate data from World Bank, Climate Watch, NASA POWER, NOAA, and IMF APIs for sustainability professionals.',
    keywords: ['climate data', 'World Bank API', 'Climate Watch', 'NASA POWER', 'NOAA', 'climate APIs', 'sustainability data'],
};

export default function ClimateDataSourcesGuide() {
    return (
        <article className="bg-white px-4 py-12">
            <div className="mx-auto max-w-3xl">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm">
                    <Link href="/guides" className="text-[--text-muted] hover:text-[--accent-primary]">
                        Guides
                    </Link>
                    <span className="mx-2 text-[--text-muted]">/</span>
                    <span className="text-[--text-secondary]">Climate Data Sources</span>
                </nav>

                <header className="mb-12">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-[--accent-positive]">
                        Data
                    </span>
                    <h1 className="mt-4 text-3xl font-bold text-[--text-primary] sm:text-4xl">
                        The Complete Guide to Free Climate Data Sources (2026)
                    </h1>
                    <p className="mt-4 text-lg text-[--text-secondary]">
                        A comprehensive guide to accessing, understanding, and using free climate data from the world&apos;s leading institutions.
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-sm text-[--text-muted]">
                        <span>Updated: February 2026</span>
                        <span>•</span>
                        <span>12 min read</span>
                    </div>
                </header>

                <div className="prose prose-slate max-w-none">
                    <h2 className="text-2xl font-bold text-[--text-primary]">Introduction</h2>
                    <p className="text-[--text-secondary]">
                        Climate data is fundamental to sustainability reporting, ESG analysis, and environmental policy development. With increasing regulatory requirements like the ISSB S2 and EU CSRD, access to reliable, up-to-date climate data has never been more critical. This guide covers the most authoritative free data sources available to sustainability professionals in 2026.
                    </p>
                    <p className="text-[--text-secondary]">
                        Whether you&apos;re an ESG analyst building climate risk models, a consultant preparing disclosure reports, or a corporate sustainability team tracking your supply chain emissions, understanding these data sources will significantly enhance your work quality and efficiency.
                    </p>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">1. World Bank Climate Data</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Overview</h3>
                    <p className="text-[--text-secondary]">
                        The World Bank is one of the most comprehensive sources of country-level climate and development indicators. Their API provides access to over 1,600 indicators covering emissions, energy, land use, and economic data for virtually every country.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Key Indicators</h3>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>EN.ATM.CO2E.PC</strong> - CO2 emissions (metric tons per capita)</li>
                        <li><strong>EG.FEC.RNEW.ZS</strong> - Renewable energy consumption (% of total final energy)</li>
                        <li><strong>EN.CLC.MDAT.ZS</strong> - Population affected by droughts, floods, extreme temperatures (%)</li>
                        <li><strong>NY.GDP.MKTP.CD</strong> - GDP (current US$) for emissions intensity calculations</li>
                        <li><strong>AG.LND.FRST.ZS</strong> - Forest area (% of land area)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">API Access</h3>
                    <div className="rounded-lg bg-gray-900 p-4">
                        <code className="text-green-400 text-sm break-all">
                            https://api.worldbank.org/v2/country/all/indicator/EN.ATM.CO2E.PC?format=json&per_page=1000&date=2000:2023
                        </code>
                    </div>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Pros</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✓ No authentication required</li>
                        <li>✓ Consistent methodology across countries</li>
                        <li>✓ Historical data back to 1960 for many indicators</li>
                        <li>✓ JSON, XML, and CSV formats supported</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Cons</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✗ Data typically lags 2-3 years behind current date</li>
                        <li>✗ Some indicators have significant gaps for smaller countries</li>
                        <li>✗ Rate limiting on large datasets</li>
                    </ul>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">2. Climate Watch</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Overview</h3>
                    <p className="text-[--text-secondary]">
                        Climate Watch, managed by the World Resources Institute, is the go-to source for greenhouse gas emissions data and country climate policies. It aggregates data from UNFCCC, CAIT, and other authoritative sources.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Key Data Types</h3>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>Historical Emissions</strong> - GHG emissions by country, sector, and gas type (1990-2022)</li>
                        <li><strong>NDC Content</strong> - Parsed Nationally Determined Contributions for all Paris Agreement signatories</li>
                        <li><strong>Climate Indicators</strong> - Vulnerability, readiness, and adaptation indices</li>
                        <li><strong>Pathways</strong> - IPCC scenario data and national projections</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">API Access</h3>
                    <div className="rounded-lg bg-gray-900 p-4">
                        <code className="text-green-400 text-sm break-all">
                            https://www.climatewatchdata.org/api/v1/data/historical_emissions?gas=All%20GHG&source=Climate%20Watch
                        </code>
                    </div>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Pros</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✓ Most comprehensive GHG emissions database</li>
                        <li>✓ Sectoral breakdown (energy, IPPU, agriculture, LUCF, waste)</li>
                        <li>✓ NDC tracker with structured data</li>
                        <li>✓ Free API with no authentication</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Cons</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✗ API documentation could be more comprehensive</li>
                        <li>✗ Large responses can be slow</li>
                    </ul>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">3. NASA POWER</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Overview</h3>
                    <p className="text-[--text-secondary]">
                        NASA&apos;s Prediction of Worldwide Energy Resources (POWER) provides global solar and meteorological data at high spatial resolution. It&apos;s invaluable for renewable energy assessments and climate risk analysis.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Key Parameters</h3>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>ALLSKY_SFC_SW_DWN</strong> - Solar irradiance (kWh/m²/day)</li>
                        <li><strong>T2M</strong> - Temperature at 2 meters (°C)</li>
                        <li><strong>PRECTOTCORR</strong> - Precipitation (mm/day)</li>
                        <li><strong>WS10M</strong> - Wind speed at 10 meters (m/s)</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">API Access</h3>
                    <div className="rounded-lg bg-gray-900 p-4">
                        <code className="text-green-400 text-sm break-all">
                            https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN,T2M&community=RE&longitude=0&latitude=0&format=JSON&start=20200101&end=20231231
                        </code>
                    </div>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Pros</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✓ Global coverage at 0.5° x 0.5° resolution</li>
                        <li>✓ Daily, monthly, and annual data available</li>
                        <li>✓ Essential for renewable energy site assessments</li>
                        <li>✓ Free with no authentication</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Cons</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✗ Modeled data, not direct measurements</li>
                        <li>✗ Rate limits on API calls</li>
                    </ul>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">4. NOAA Climate Data</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Overview</h3>
                    <p className="text-[--text-secondary]">
                        The National Oceanic and Atmospheric Administration provides extensive climate and weather data through multiple portals. Key resources include the Global Historical Climatology Network (GHCN) and Climate Data Online.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Key Datasets</h3>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>GHCN-Daily</strong> - Global station weather data (temperature, precipitation, snow)</li>
                        <li><strong>Global Summary of the Day</strong> - Aggregated daily summaries</li>
                        <li><strong>Climate Normals</strong> - 30-year average baseline data</li>
                        <li><strong>Storm Events</strong> - Severe weather event records</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">API Access</h3>
                    <div className="rounded-lg bg-gray-900 p-4">
                        <code className="text-green-400 text-sm break-all">
                            https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&locationid=FIPS:US&startdate=2023-01-01&enddate=2023-12-31
                        </code>
                    </div>
                    <p className="text-sm text-[--text-muted] mt-2">Note: Requires free API token from NOAA</p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Pros</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✓ Actual measurement data from global weather stations</li>
                        <li>✓ Extensive historical records (some stations back to 1763)</li>
                        <li>✓ High-quality data with QA/QC</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Cons</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✗ Requires free registration for API token</li>
                        <li>✗ Station coverage varies by region</li>
                        <li>✗ Complex data formats</li>
                    </ul>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">5. IMF Climate Data</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Overview</h3>
                    <p className="text-[--text-secondary]">
                        The International Monetary Fund&apos;s Climate Change Indicators Dashboard provides macroeconomic and climate data integration, particularly useful for understanding climate-economy linkages.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Key Indicators</h3>
                    <ul className="space-y-2 text-[--text-secondary]">
                        <li><strong>Carbon Pricing</strong> - Carbon tax and ETS coverage and prices by country</li>
                        <li><strong>Climate Finance</strong> - Green bond issuance and climate adaptation spending</li>
                        <li><strong>Energy Subsidies</strong> - Fossil fuel subsidy data</li>
                        <li><strong>Climate Physical Risk</strong> - ND-GAIN and other vulnerability indices</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">API Access</h3>
                    <p className="text-[--text-secondary]">
                        IMF provides data through their Data REST API and bulk downloads. The Climate Change Indicators Dashboard is accessible at:
                    </p>
                    <div className="rounded-lg bg-gray-900 p-4">
                        <code className="text-green-400 text-sm">
                            https://climatedata.imf.org/
                        </code>
                    </div>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Pros</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✓ Unique climate-economy integration</li>
                        <li>✓ Carbon pricing and policy data</li>
                        <li>✓ Authoritative source for climate finance</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">Cons</h3>
                    <ul className="space-y-1 text-[--text-secondary]">
                        <li>✗ Less comprehensive API compared to others</li>
                        <li>✗ Focus on economic impacts rather than physical data</li>
                    </ul>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">Best Practices for Using Climate Data</h2>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">1. Validate Data Sources</h3>
                    <p className="text-[--text-secondary]">
                        Always verify the methodology and vintage of data. Climate data from different sources may use different base years, emission factors, or calculation methods. Document your data sources for transparency in reporting.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">2. Handle Data Gaps</h3>
                    <p className="text-[--text-secondary]">
                        Many countries have incomplete time series. Use appropriate interpolation methods or proxy data from similar countries when necessary, and document these assumptions.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">3. Understand Update Frequencies</h3>
                    <p className="text-[--text-secondary]">
                        Climate data typically lags 1-3 years. Build processes to incorporate updates as they become available, and communicate data vintage clearly to stakeholders.
                    </p>

                    <h3 className="text-xl font-semibold text-[--accent-positive]">4. Cross-Reference Sources</h3>
                    <p className="text-[--text-secondary]">
                        Where possible, validate critical data points across multiple sources. Discrepancies may indicate methodology differences or data quality issues.
                    </p>

                    <hr className="my-8 border-[--border-card]" />

                    <h2 className="text-2xl font-bold text-[--text-primary]">Conclusion</h2>
                    <p className="text-[--text-secondary]">
                        Access to reliable climate data has never been more important or more accessible. The sources covered in this guide provide a solid foundation for sustainability reporting, ESG analysis, and climate risk assessment. By understanding the strengths and limitations of each source, you can build robust, defensible analyses that meet stakeholder expectations and regulatory requirements.
                    </p>
                    <p className="text-[--text-secondary]">
                        As climate data continues to improve in quality and coverage, staying informed about updates and new data products will help you maintain a competitive edge in sustainability analysis.
                    </p>
                </div>

                {/* CTA */}
                <div className="mt-12 rounded-xl border border-[--accent-positive] bg-emerald-50 p-8 text-center">
                    <h3 className="text-xl font-semibold text-[--text-primary]">
                        Explore All Sources in One Dashboard
                    </h3>
                    <p className="mt-2 text-[--text-secondary]">
                        VisualClimate aggregates data from all these sources into one searchable platform.
                    </p>
                    <Link
                        href="/dashboard"
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[--accent-positive] px-6 py-3 font-medium text-white hover:opacity-90"
                    >
                        Try VisualClimate Free
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </article>
    );
}
