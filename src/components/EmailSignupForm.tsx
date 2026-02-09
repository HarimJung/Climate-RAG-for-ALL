'use client';

import { useState } from 'react';
import { subscribeEmail } from '@/app/actions';

export function EmailSignupForm() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        setStatus('loading');
        const result = await subscribeEmail(formData);

        if (result.success) {
            setStatus('success');
            setMessage('Thanks! You\'re on the list.');
        } else {
            setStatus('error');
            setMessage(result.error || 'Something went wrong');
        }
    }

    if (status === 'success') {
        return (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-900/50 p-4 text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>{message}</span>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={status === 'loading'}
            />
            <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
                {status === 'loading' ? 'Subscribing...' : 'Get Updates'}
            </button>
            {status === 'error' && (
                <p className="text-sm text-red-400">{message}</p>
            )}
        </form>
    );
}
