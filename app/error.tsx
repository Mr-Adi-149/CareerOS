'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="shell grid min-h-[65vh] place-items-center py-16 text-center"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-green-800">Something went wrong</p><h1 className="mt-2 text-3xl font-semibold text-ink">We couldn’t load this page.</h1><p className="mt-3 text-stone-600">Please try again. Your saved roles are still safe in this browser.</p><button onClick={reset} className="mt-6 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white">Try again</button></div></main>;
}
