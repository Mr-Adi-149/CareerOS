'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCareer } from '@/lib/state';
import { CandidateDashboard } from '@/components/candidate-dashboard';
import { JobExplorer } from '@/components/job-explorer';
import { jobs } from '@/lib/jobs';
import { RoleGuard } from '@/components/role-guard';

const stats = [
  {
    value: jobs.length,
    label: 'Open Roles',
    note: 'Premium career tracks across leading Indian startups & enterprises.',
    icon: '🚀'
  },
  {
    value: new Set(jobs.map((job) => job.company)).size,
    label: 'Verified Teams',
    note: 'Curated corporate and tech teams with proven transparency.',
    icon: '✨'
  },
  {
    value: new Set(jobs.map((job) => job.workMode)).size,
    label: 'Work Styles',
    note: 'In-office, hybrid, and fully remote opportunities.',
    icon: '🌐'
  },
];

function HomeContent() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-stone-200/50 bg-ivory-100 pb-8">
        {/* Subtle Tricolor Radial Background */}
        <div className="absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-saffron-100/40 page-orb" />
        <div className="absolute -bottom-44 left-[42%] h-80 w-80 rounded-full bg-navy-100/70 page-orb" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        
        <div className="shell relative grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="animate-fade-up">
            {/* Ambient indicator tag */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-saffron-200 bg-saffron-50/50 px-3.5 py-1 mb-6 shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-saffron-500"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-saffron-800">
                Premium Talent Network
              </span>
            </div>
            
            <h1 className="font-heading text-5xl font-black leading-[1.05] tracking-tight text-navy-950 sm:text-7xl">
              Work that moves <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-600 via-saffron-500 to-navy-900">your life forward.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-stone-600">
              A considered career workspace for ambitious people: verified teams, clearer decisions, and every next move in one calm place.
            </p>
            
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#dashboard" className="btn-primary">
                Enter your workspace
              </a>
              <a href="#jobs" className="btn-secondary group">
                Explore opportunities
                <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
            </div>
            
            {/* Visual Social Proof strip */}
            <div className="mt-12 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-stone-500">
              <div className="flex -space-x-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-8 w-8 rounded-full border-2 border-ivory-100 bg-stone-300 flex items-center justify-center text-[10px] text-white font-bold ${
                    i === 1 ? 'bg-saffron-500' : i === 2 ? 'bg-navy-900' : 'bg-indiaGreen-600'
                  }`}>
                    {i === 1 ? 'A' : i === 2 ? 'K' : 'S'}
                  </div>
                ))}
              </div>
              <p>Chosen by people who take their next move seriously</p>
            </div>
          </div>

          {/* Stat Panel right sidebar card */}
          <aside className="premium-glass animate-fade-in rounded-3xl p-6 sm:p-8 border border-stone-200" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-8 border-b border-stone-200/70 pb-5">
              <div>
                <p className="font-heading text-lg font-extrabold text-navy-950">Ecosystem Health</p>
                <p className="text-[11px] font-medium text-stone-500 mt-0.5">Real-time portal parameters</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-indiaGreen-200 bg-indiaGreen-50 px-2.5 py-1 text-[10px] font-bold text-indiaGreen-800 shadow-sm uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-indiaGreen-500 animate-pulse"></span>
                Active
              </span>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-stone-200 bg-white/70 p-4.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-hover hover:border-saffron-200"
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-2xl sm:text-3xl font-heading font-extrabold text-navy-900 group-hover:text-saffron-700 transition-colors">
                      {String(stat.value).padStart(2, '0')}
                    </p>
                    <span className="text-lg">{stat.icon}</span>
                  </div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-[10.5px] leading-relaxed text-stone-500 hidden xl:block lg:hidden sm:block">
                    {stat.note}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Dashboard Section */}
      <section id="dashboard" className="border-b border-stone-200 bg-stone-50 py-16">
        <div className="shell">
          <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-xl">
          <p className="eyebrow">Career command centre</p>
              <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
                A calmer way to manage momentum
              </h2>
            </div>
            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-stone-500">
              Keep applications, follow-ups, and decision signals close—without the usual job-search noise.
            </p>
          </div>
          <CandidateDashboard />
        </div>
      </section>

      {/* Discover Jobs Section */}
      <JobExplorer />

      <footer className="border-t border-stone-200 bg-ivory-100">
        <div className="shell flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
             <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-navy-950 text-white font-extrabold text-sm">
               C
               <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-saffron-500 via-white to-indiaGreen-500" />
             </div>
             <span className="font-heading font-extrabold text-navy-950 text-base">Niyukti</span>
          </div>
          <p className="text-xs text-stone-500 max-w-sm text-center sm:text-left leading-relaxed">
            Built for ambitious professionals. All application workflow tracking data remains safely stored inside your local browser storage.
          </p>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">© 2026 Niyukti</p>
        </div>
      </footer>
    </>
  );
}

export default function Home() {
  const { userRole } = useCareer();
  const router = useRouter();

  useEffect(() => {
    if (userRole === 'recruiter') {
      router.replace('/recruiter');
    }
  }, [userRole, router]);

  if (userRole === 'recruiter') {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="chakra-container"><div className="relative flex h-16 w-16 items-center justify-center"><div className="chakra-ring-outer animate-chakra-spin" /><div className="chakra-wheel" /></div></div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['candidate']} fallback={null}>
      <HomeContent />
    </RoleGuard>
  );
}
