'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole, useAuth } from '@/lib/auth-context';

const inputClass = 'focus-ring mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-navy-900 outline-none transition placeholder:text-stone-400 focus:border-indiaGreen-500 focus:ring-2 focus:ring-indiaGreen-500/20';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { login, register, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  useEffect(() => {
    if (isAuthenticated) router.replace(user?.role === 'recruiter' ? '/recruiter' : '/');
  }, [isAuthenticated, router, user?.role]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (isSignup && username.trim().length < 2) return setError('Choose a username with at least 2 characters.');
    if (isSignup && role === 'recruiter' && !companyName.trim()) return setError('Enter your company name to create a recruiter account.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (password.length < 6) return setError('Use a password of at least 6 characters.');
    if (isSignup && password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true);
    window.setTimeout(() => {
      const result = isSignup ? register({ username, email, password, role, companyName }) : login(email, password);
      if (!result.success) { setError(result.error); setLoading(false); return; }
      const next = searchParams.get('next');
      router.replace(next || (isSignup && role === 'recruiter' ? '/recruiter' : '/'));
    }, 380);
  };

  return <main className="relative grid min-h-screen overflow-hidden bg-ivory-100 lg:grid-cols-[1.05fr_.95fr]">
    <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-saffron-100/60 page-orb" /><div className="absolute bottom-0 right-[32%] h-80 w-80 rounded-full bg-navy-100/60 page-orb" />
    <section className="relative hidden overflow-hidden bg-navy-950 p-12 lg:flex lg:flex-col lg:justify-between">
      <div className="relative z-10 flex items-center gap-3 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 font-heading text-lg font-black">C</span><span className="font-heading text-xl font-extrabold">CareerOS</span></div>
      <div className="relative z-10 max-w-md"><p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-saffron-300">A better next move</p><h1 className="mt-5 font-heading text-5xl font-extrabold leading-[1.04] tracking-tight text-white">Make ambition feel more certain.</h1><p className="mt-6 text-sm leading-relaxed text-navy-200">A private, composed workspace for purposeful careers and considered hiring decisions.</p></div>
      <div className="relative z-10 flex items-center gap-3 text-xs text-navy-200"><span className="h-2 w-2 rounded-full bg-indiaGreen-400" />Verified teams. Clearer decisions.</div><div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full border border-saffron-400/20" />
    </section>
    <section className="relative z-10 flex items-center justify-center px-5 py-10 sm:px-8">
      <div className="w-full max-w-md rounded-3xl border border-stone-200/60 bg-white/80 p-6 shadow-premium backdrop-blur-md sm:p-9">
        <Link href="/" className="focus-ring inline-flex items-center gap-2 rounded-lg text-xs font-bold text-navy-800 lg:hidden"><span className="grid h-7 w-7 place-items-center rounded-lg bg-navy-950 text-white">C</span> CareerOS</Link>
        <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[.18em] text-saffron-700">{isSignup ? 'Create your workspace' : 'Welcome back'}</p>
        <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-navy-950">{isSignup ? 'Set your direction.' : 'Good to see you.'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">{isSignup ? 'Start with a profile that reflects where you are going.' : 'Sign in to continue your career momentum.'}</p>
        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          {isSignup && <label className="block text-xs font-bold text-navy-800">Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="name" className={inputClass} placeholder="e.g. Ananya Iyer" /></label>}
          <label className="block text-xs font-bold text-navy-800">Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" /></label>
          <label className="block text-xs font-bold text-navy-800">Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} className={inputClass} placeholder="At least 6 characters" /></label>
          {isSignup && <label className="block text-xs font-bold text-navy-800">Confirm password<input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" className={`${inputClass} ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`} placeholder="Repeat your password" /></label>}
          {isSignup && <fieldset><legend className="text-xs font-bold text-navy-800">I&apos;m joining as</legend><div className="mt-2 grid grid-cols-2 gap-3">{(['candidate', 'recruiter'] as UserRole[]).map((item) => <button type="button" key={item} onClick={() => setRole(item)} className={`focus-ring rounded-2xl border p-3 text-left transition ${role === item ? 'border-saffron-400 bg-saffron-50 shadow-sm' : 'border-stone-200 bg-white hover:border-navy-200'}`}><span className="block text-xs font-extrabold capitalize text-navy-950">{item}</span><span className="mt-1 block text-[10px] leading-relaxed text-stone-500">{item === 'candidate' ? 'Find and track meaningful work.' : 'Build a considered hiring pipeline.'}</span></button>)}</div></fieldset>}
          {isSignup && role === 'recruiter' && <label className="block text-xs font-bold text-navy-800">Company Name<input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" className={inputClass} placeholder="e.g. Acme Inc." /></label>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700 animate-pulse">{error}</div>}
          <button disabled={loading} className="btn-primary mt-2 w-full disabled:cursor-wait">{loading ? 'Securing your workspace…' : isSignup ? 'Create account' : 'Sign in securely'}</button>
        </form>
        <p className="mt-6 text-center text-xs text-stone-500">{isSignup ? 'Already have an account?' : 'New to CareerOS?'} <Link className="font-bold text-saffron-700 hover:text-saffron-800" href={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create an account'}</Link></p>
      </div>
    </section>
  </main>;
}
