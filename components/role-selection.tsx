'use client';

import { useCareer } from '@/lib/state';

export function RoleSelection() {
  const { setUserRole } = useCareer();

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-100 p-4 relative overflow-hidden">
      {/* Background soft blurs representing saffron / green fields */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-saffron-100/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indiaGreen-100/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 text-center animate-fade-up">
        {/* Brand Logo */}
        <div className="flex justify-center items-center gap-3 mb-10">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 text-white shadow-premium">
            <span className="font-heading text-lg font-extrabold">C</span>
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-saffron-500 via-white to-indiaGreen-500" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-navy-950 font-heading">
            CareerOS
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-navy-950 font-heading leading-[1.05] max-w-3xl mx-auto">
          Shape your future. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-900 via-saffron-600 to-indiaGreen-700">
            Build India&apos;s leading teams.
          </span>
        </h1>
        <p className="mt-5 text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
          Select your portal to configure your professional CareerOS workspace.
        </p>

        {/* Roles Layout */}
        <div className="mt-14 grid gap-8 sm:grid-cols-2 text-left max-w-3xl mx-auto">
          {/* Candidate Card */}
          <button
            onClick={() => setUserRole('candidate')}
            className="group focus-ring p-8 rounded-3xl border border-stone-200/80 bg-white/80 backdrop-blur-md shadow-premium transition-all duration-300 hover:shadow-glow-green hover:scale-[1.01] hover:border-indiaGreen-400/60 flex flex-col justify-between min-h-[260px] relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indiaGreen-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-indiaGreen-50 text-indiaGreen-700 border border-indiaGreen-100 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-105 group-hover:bg-indiaGreen-100">
                🇮🇳
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-950 font-heading group-hover:text-indiaGreen-800 transition-colors">
                  I am a Candidate
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">
                  Search premium positions, track active applications in your pipeline, and access custom follow-up alerts.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indiaGreen-800 tracking-wider uppercase">
              Enter Candidate Portal <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>
          </button>

          {/* Recruiter Card */}
          <button
            onClick={() => setUserRole('recruiter')}
            className="group focus-ring p-8 rounded-3xl border border-stone-200/80 bg-white/80 backdrop-blur-md shadow-premium transition-all duration-300 hover:shadow-glow-saffron hover:scale-[1.01] hover:border-saffron-400/60 flex flex-col justify-between min-h-[260px] relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-saffron-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-saffron-50 text-saffron-700 border border-saffron-100 flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-105 group-hover:bg-saffron-100">
                👔
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-950 font-heading group-hover:text-saffron-800 transition-colors">
                  I am a Recruiter
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">
                  Publish career opportunities, coordinate applicant tracks, log custom review actions, and manage hiring managers.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-saffron-800 tracking-wider uppercase">
              Enter Recruiter Portal <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
