'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/compare', label: 'Compare' },
    { href: '/library', label: 'Library' },
    { href: '/guides', label: 'Guides' },
    { href: '/pricing', label: 'Pricing' },
];

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white">
                        Visual<span className="text-emerald-500">Climate</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/login"
                        className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        {mobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        )}
                    </svg>
                </button>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="border-t border-slate-800 md:hidden">
                    <div className="space-y-1 px-4 py-3">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/login"
                            className="mt-2 block rounded-lg bg-emerald-600 px-3 py-2 text-center text-base font-medium text-white hover:bg-emerald-500"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
