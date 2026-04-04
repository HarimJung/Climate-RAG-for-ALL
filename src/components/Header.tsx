'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
    { href: '/explore', label: 'Explore' },
    { href: '/posters', label: 'Posters' },
];

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[--border-card] bg-white/80 backdrop-blur-xl">
            <nav className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="16" r="6" fill="#0066FF" opacity="0.85" />
                        <circle cx="16" cy="10" r="6" fill="#00A67E" opacity="0.85" />
                        <circle cx="22" cy="16" r="6" fill="#0066FF" opacity="0.65" />
                    </svg>
                    <span className="text-[15px] font-semibold tracking-[-0.01em] text-[--text-primary]">
                        Visual<span className="font-bold text-[--accent-primary]">Climate</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => {
                        const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                                    isActive
                                        ? 'bg-[--bg-section] text-[--accent-primary]'
                                        : 'text-[--text-secondary] hover:bg-[--bg-section] hover:text-[--text-primary]'
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-[--text-secondary] transition-colors hover:bg-[--bg-section] hover:text-[--text-primary] md:hidden"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
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
                    <div className="space-y-0.5 px-4 py-2">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
                                        isActive
                                            ? 'bg-[--bg-section] text-[--accent-primary]'
                                            : 'text-[--text-secondary] hover:bg-[--bg-section] hover:text-[--text-primary]'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
}
