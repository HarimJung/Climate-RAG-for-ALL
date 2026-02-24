'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
    { href: '/report',  label: 'Report Card' },
    { href: '/explore', label: 'Explore' },
    { href: '/posters', label: 'Posters' },
    { href: '/learn',   label: 'Learn' },
    { href: '/about',   label: 'About' },
];

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[--border-card] bg-white/80 backdrop-blur-xl">
            <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                {/* Logo with 3-circle SVG */}
                <Link href="/" className="flex items-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="16" r="6" fill="#0066FF" opacity="0.8" />
                        <circle cx="16" cy="10" r="6" fill="#00A67E" opacity="0.8" />
                        <circle cx="22" cy="16" r="6" fill="#0066FF" opacity="0.6" />
                    </svg>
                    <span className="text-xl font-bold text-[--text-primary]">
                        Visual<span className="text-[--accent-primary]">Climate</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex md:items-center md:gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-[--text-secondary] transition-colors hover:text-[--accent-primary]"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link
                        href="/report"
                        className="rounded-lg bg-[--accent-primary] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0052cc] hover:shadow-md"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md p-2 text-[--text-secondary] hover:bg-gray-100 hover:text-[--text-primary] md:hidden"
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
                <div className="border-t border-[--border-card] bg-white/95 backdrop-blur-xl md:hidden">
                    <div className="space-y-1 px-4 py-3">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block rounded-lg px-3 py-2 text-base font-medium text-[--text-secondary] hover:bg-gray-50 hover:text-[--accent-primary]"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            href="/report"
                            className="mt-2 block rounded-lg bg-[--accent-primary] px-3 py-2 text-center text-base font-semibold text-white"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
