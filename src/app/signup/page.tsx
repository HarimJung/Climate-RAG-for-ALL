'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Create user_profiles row
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({ id: data.user.id });

        if (profileError) {
          console.error('Failed to create profile:', profileError);
        }
      }

      router.push('/chat');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a2540] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Create your account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#adbdcc]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white transition-all duration-300 focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#adbdcc]">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white transition-all duration-300 focus:border-[#00d4ff] focus:outline-none focus:ring-1 focus:ring-[#00d4ff]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#7b61ff] px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-[#00d4ff]/20 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-[#adbdcc]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#00d4ff] transition-all duration-300 hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
