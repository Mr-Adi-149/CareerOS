'use client';

import { useMemo, useState } from 'react';
import { useCareer, calculateMatchScore } from '@/lib/state';
import { JobCard } from './job-card';

const unique = <T,>(values: T[]) => [...new Set(values)];

const selectClass =
  'focus-ring h-12 w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 text-[11px] sm:text-xs font-semibold text-navy-800 outline-none transition-all duration-200 hover:border-saffron-300 focus:border-saffron-600 shadow-sm cursor-pointer truncate';

export function JobExplorer() {
  const { jobs, profile } = useCareer();

  const filterGroups = useMemo(() => ({
    location: ['All locations', ...unique(jobs.map((job) => job.location))],
    type: ['All job types', ...unique(jobs.map((job) => job.jobType))],
    experience: ['All experience', ...unique(jobs.map((job) => job.experience))],
    mode: ['All work modes', ...unique(jobs.map((job) => job.workMode))],
  }), [jobs]);

  const fields = useMemo(() => [
    { key: 'location', label: 'Location', options: filterGroups.location },
    { key: 'type', label: 'Type', options: filterGroups.type },
    { key: 'experience', label: 'Experience', options: filterGroups.experience },
    { key: 'mode', label: 'Work mode', options: filterGroups.mode },
  ] as const, [filterGroups]);

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(filterGroups.location[0]);
  const [type, setType] = useState(filterGroups.type[0]);
  const [experience, setExperience] = useState(filterGroups.experience[0]);
  const [mode, setMode] = useState(filterGroups.mode[0]);
  const [sort, setSort] = useState('newest');
  const [visible, setVisible] = useState(4);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [aiOnly, setAiOnly] = useState(false);

  const filtered = useMemo(
    () => {
      const result = jobs.filter((job) => {
        const searchable = [job.title, job.company, job.skills.join(' '), job.summary]
          .join(' ')
          .toLowerCase();

        const matchesQuery = !query || searchable.includes(query.toLowerCase());
        const matchesLoc = location === filterGroups.location[0] || job.location === location;
        const matchesType = type === filterGroups.type[0] || job.jobType === type;
        const matchesExp = experience === filterGroups.experience[0] || job.experience === experience;
        const matchesMode = mode === filterGroups.mode[0] || job.workMode === mode;

        if (!matchesQuery || !matchesLoc || !matchesType || !matchesExp || !matchesMode) {
          return false;
        }

        if (aiOnly) {
          const { score } = calculateMatchScore(profile, job);
          return score >= 60;
        }

        return true;
      });

      if (aiOnly) {
        return result.sort((a, b) => {
          const scoreA = calculateMatchScore(profile, a).score;
          const scoreB = calculateMatchScore(profile, b).score;
          return scoreB - scoreA;
        });
      }

      return result.sort((a, b) =>
        sort === 'company'
          ? a.company.localeCompare(b.company)
          : sort === 'relevance'
            ? Number(Boolean(b.featured)) - Number(Boolean(a.featured))
            : new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
    },
    [experience, location, mode, query, sort, type, filterGroups, jobs, aiOnly, profile],
  );

  const clear = () => {
    setQuery('');
    setLocation(filterGroups.location[0]);
    setType(filterGroups.type[0]);
    setExperience(filterGroups.experience[0]);
    setMode(filterGroups.mode[0]);
    setSort('newest');
    setAiOnly(false);
    setVisible(4);
  };

  const activeFilters = [
    location !== filterGroups.location[0],
    type !== filterGroups.type[0],
    experience !== filterGroups.experience[0],
    mode !== filterGroups.mode[0],
  ].filter(Boolean).length;

  return (
    <section id="jobs" className="scroll-mt-20 border-t border-stone-200/50 bg-ivory-100 py-16 sm:py-24 relative">
      {/* Tricolor radial overlay */}
      <div className="absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-saffron-100/30 page-orb" />

      <div className="shell relative z-10 animate-fade-up">
        {/* Section Header - Updated alignment */}
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="eyebrow">The opportunity edit</p>
            <h2 className="mt-2 font-heading text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
              Find a role with signal.
            </h2>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-500">
              Browse considered openings with the details that matter before you invest your time.
            </p>
          </div>
          <div className="premium-glass rounded-2xl px-5 py-4 border-l-4 border-l-saffron-500 shadow-sm self-start">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">
              Search Parameters
            </p>
            <p className="mt-1.5 text-xs font-bold text-navy-900 uppercase">
              <span className="text-saffron-700 text-lg font-black mr-1">{filtered.length}</span> roles in view
            </p>
          </div>
        </div>

        {/* Filter Panel - Updated with better layout */}
        <div className="rounded-3xl border border-stone-200/80 bg-white/70 p-4 sm:p-5 shadow-premium backdrop-blur-md">
          <div className="flex flex-col gap-4">

            {/* Row 1: Search + Actions - Desktop and Mobile */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input - Takes remaining space */}
              <div className="flex-1 min-w-0">
                <label className="focus-within:border-saffron-500 focus-within:ring-4 focus-within:ring-saffron-100/50 flex h-13 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 transition-all duration-300 w-full">
                  <span className="text-xl text-stone-400 flex-shrink-0">⌕</span>
                  <input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setVisible(4);
                    }}
                    placeholder="Search job title, company name, skill tags, or location"
                    className="w-full bg-transparent text-sm font-medium text-navy-900 outline-none placeholder:text-stone-400 min-w-0"
                  />
                </label>
              </div>

              {/* AI Match Button */}
              {profile.fullName && (
                <button
                  type="button"
                  onClick={() => {
                    setAiOnly(!aiOnly);
                    setVisible(4);
                  }}
                  className={`focus-ring inline-flex h-13 items-center justify-center gap-2 rounded-xl border px-6 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm flex-shrink-0 ${aiOnly
                    ? 'border-saffron-500 bg-saffron-600 text-white shadow-glow-saffron hover:bg-saffron-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-saffron-300 hover:bg-saffron-50/50 hover:text-saffron-800'
                    }`}
                >
                  <span>✨ AI Match</span>
                </button>
              )}

              {/* Mobile Filter Toggles */}
              <div className="flex items-center gap-3 xl:hidden flex-shrink-0">
                <button
                  onClick={() => setFiltersOpen((value) => !value)}
                  className="focus-ring inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-navy-800 shadow-sm transition hover:border-indiaGreen-300 hover:bg-indiaGreen-50"
                >
                  Filters
                  {activeFilters > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-indiaGreen-700 px-1 text-[10px] font-black text-white">
                      {activeFilters}
                    </span>
                  )}
                </button>
                <label className="focus-ring inline-flex h-13 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-bold uppercase tracking-wider text-stone-500 shadow-sm">
                  Sort
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="bg-transparent text-xs font-bold text-navy-900 outline-none cursor-pointer"
                    aria-label="Sort jobs"
                  >
                    <option value="newest">Newest</option>
                    <option value="relevance">Relevance</option>
                    <option value="company">A-Z</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Row 2: Desktop Filters */}
            <div className="hidden xl:flex items-center gap-2.5">
              <div className="grid w-full grid-cols-5 gap-2.5">
                <label className="col-span-1 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-2 text-[10px] font-bold uppercase tracking-wide text-stone-400 shadow-sm">
                  Sort
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-[11px] sm:text-xs font-semibold text-navy-900 outline-none cursor-pointer truncate"
                    aria-label="Sort jobs"
                  >
                    <option value="newest">Newest</option>
                    <option value="relevance">Relevance</option>
                    <option value="company">A-Z</option>
                  </select>
                </label>
                {fields.map((field) => (
                  <select
                    key={field.key}
                    value={
                      field.key === 'location'
                        ? location
                        : field.key === 'type'
                          ? type
                          : field.key === 'experience'
                            ? experience
                            : mode
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      if (field.key === 'location') setLocation(value);
                      if (field.key === 'type') setType(value);
                      if (field.key === 'experience') setExperience(value);
                      if (field.key === 'mode') setMode(value);
                      setVisible(4);
                    }}
                    aria-label={`Filter by ${field.label.toLowerCase()}`}
                    className={selectClass}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            {/* Mobile Filters Body */}
            <div className={`xl:hidden ${filtersOpen ? 'block animate-fade-in' : 'hidden'}`}>
              <div className="mt-2 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields.map((field) => (
                    <select
                      key={field.key}
                      value={
                        field.key === 'location'
                          ? location
                          : field.key === 'type'
                            ? type
                            : field.key === 'experience'
                              ? experience
                              : mode
                      }
                      onChange={(event) => {
                        const value = event.target.value;
                        if (field.key === 'location') setLocation(value);
                        if (field.key === 'type') setType(value);
                        if (field.key === 'experience') setExperience(value);
                        if (field.key === 'mode') setMode(value);
                        setVisible(4);
                      }}
                      aria-label={`Filter by ${field.label.toLowerCase()}`}
                      className={selectClass}
                    >
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400 mr-2">
                  Active
                </span>
                {location !== filterGroups.location[0] && (
                  <button
                    onClick={() => setLocation(filterGroups.location[0])}
                    className="rounded-full border border-indiaGreen-200/50 bg-indiaGreen-50 px-3 py-1 text-xs font-bold text-indiaGreen-800 transition hover:bg-indiaGreen-100/70"
                  >
                    {location} ×
                  </button>
                )}
                {type !== filterGroups.type[0] && (
                  <button
                    onClick={() => setType(filterGroups.type[0])}
                    className="rounded-full border border-indiaGreen-200/50 bg-indiaGreen-50 px-3 py-1 text-xs font-bold text-indiaGreen-800 transition hover:bg-indiaGreen-100/70"
                  >
                    {type} ×
                  </button>
                )}
                {experience !== filterGroups.experience[0] && (
                  <button
                    onClick={() => setExperience(filterGroups.experience[0])}
                    className="rounded-full border border-indiaGreen-200/50 bg-indiaGreen-50 px-3 py-1 text-xs font-bold text-indiaGreen-800 transition hover:bg-indiaGreen-100/70"
                  >
                    {experience} ×
                  </button>
                )}
                {mode !== filterGroups.mode[0] && (
                  <button
                    onClick={() => setMode(filterGroups.mode[0])}
                    className="rounded-full border border-indiaGreen-200/50 bg-indiaGreen-50 px-3 py-1 text-xs font-bold text-indiaGreen-800 transition hover:bg-indiaGreen-100/70"
                  >
                    {mode} ×
                  </button>
                )}
                <button onClick={clear} className="ml-2 text-xs font-bold text-stone-400 hover:text-navy-950 transition-colors">
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Listings Result */}
        {filtered.length ? (
          <>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {filtered.slice(0, visible).map((job) => (
                <JobCard job={job} key={job.id} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisible((count) => count + 4)}
                  className="btn-secondary"
                >
                  Load More Opportunities
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-stone-200 bg-white/40 px-6 py-20 text-center shadow-sm backdrop-blur-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-saffron-50 text-2xl text-saffron-600 border border-saffron-100 shadow-sm">
              ⌕
            </div>
            <h3 className="mt-5 font-heading text-lg font-bold text-navy-950">No opportunities match</h3>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-stone-500">
              Adjust search strings or reset filter categories to reveal additional roles.
            </p>
            <button onClick={clear} className="mt-6 btn-secondary bg-white">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}