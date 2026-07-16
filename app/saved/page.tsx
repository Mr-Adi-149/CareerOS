'use client';

import Link from 'next/link';
import { JobCard } from '@/components/job-card';
import { useSaved } from '@/components/saved-provider';
import { useCareer } from '@/lib/state';
import { RoleGuard } from '@/components/role-guard';

function SavedContent() {
  const { saved } = useSaved();
  const { jobs, userRole, setUserRole, hydrated } = useCareer();
  const savedJobs = jobs.filter((job) => saved.includes(job.id));

  if (!hydrated) {
    return (
      <main className="shell py-12">
        <div className="h-96 animate-pulse rounded-2xl bg-stone-200" />
      </main>
    );
  }

  if (userRole !== 'candidate') {
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white/70 backdrop-blur-md p-8 text-center shadow-lg">
          <div className="h-16 w-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Access Denied</h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            The job shortlist is only accessible to candidates. If you are a candidate, please switch your role to continue.
          </p>
          <button
            onClick={() => setUserRole(null)}
            className="mt-6 w-full focus-ring rounded-xl bg-green-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Switch Role
          </button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <section className="border-b border-stone-200 bg-[#f1f5f0]">
        <div className="shell py-12 sm:py-16">
          <p className="eyebrow">Your private workspace</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] text-ink sm:text-5xl">Your shortlist</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-stone-600">Keep promising opportunities here while you compare, research, and decide where to apply.</p>
        </div>
      </section>
      <section className="shell py-10 sm:py-14">
        {savedJobs.length ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-stone-500">
                <strong className="font-semibold text-ink">{savedJobs.length}</strong> saved {savedJobs.length === 1 ? 'role' : 'roles'}
              </p>
              <Link href="/#jobs" className="focus-ring rounded text-sm font-semibold text-green-800 hover:underline">Explore more roles →</Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {savedJobs.map((job) => <JobCard job={job} key={job.id} />)}
            </div>
          </>
        ) : (
          <div className="surface mx-auto max-w-xl rounded-xl px-6 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-green-50 text-2xl text-green-800">☆</div>
            <h2 className="mt-5 text-xl font-semibold tracking-[-.03em] text-ink">Your shortlist is waiting</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">Save roles that catch your eye, then return when you&apos;re ready to make a thoughtful move.</p>
            <Link href="/#jobs" className="focus-ring mt-6 inline-flex rounded-lg bg-green-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900">Explore opportunities</Link>
          </div>
        )}
      </section>
    </main>
  );
}

export default function SavedPage() {
  return (
    <RoleGuard allowedRoles={['candidate']}>
      <SavedContent />
    </RoleGuard>
  );
}