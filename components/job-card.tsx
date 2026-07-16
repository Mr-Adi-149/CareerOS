'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Job, Application } from '@/lib/types';
import { useSaved } from './saved-provider';
import { useCareer, calculateMatchScore } from '@/lib/state';
import { useAuth } from '@/lib/auth-context';

const isFollowupDue = (application: Application) => {
  if (!application.followupReminder) return false;
  if (application.followupReminder === 'custom') {
    if (!application.followupReminderDate) return false;
    return new Date() >= new Date(application.followupReminderDate);
  }
  const baseDateStr = application.lastFollowupAt || application.appliedAt;
  const baseDate = new Date(baseDateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  if (application.followupReminder === '3days' && diffDays >= 3) return true;
  if (application.followupReminder === '1week' && diffDays >= 7) return true;
  return false;
};

const statusStyle: Record<string, string> = {
  Applied: 'border-sky-200 bg-sky-50 text-sky-700',
  'Under Review': 'border-violet-200 bg-violet-50/70 text-violet-700',
  Interview: 'border-amber-200 bg-amber-50/70 text-amber-700',
  Offer: 'border-indiaGreen-200 bg-indiaGreen-50 text-indiaGreen-800',
  Rejected: 'border-stone-200 bg-stone-100/80 text-stone-500',
};

function relativeDate(date: string) {
  const days = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 86_400_000));
  return days === 1 ? 'Today' : `${days}d ago`;
}

export function JobCard({ job }: { job: Job }) {
  const { saved, toggle } = useSaved();
  const { profile, applications } = useCareer();
  const { user } = useAuth();
  const isSaved = saved.includes(job.id);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);

  const match = useMemo(() => calculateMatchScore(profile, job), [profile, job]);
  const showMatch = profile.fullName && profile.skills.length > 0;

  const appliedRecord = useMemo(() => {
    return user
      ? applications.find((app) => app.jobId === job.id && app.candidateEmail === user.email)
      : undefined;
  }, [applications, job.id, user]);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 sm:p-6 shadow-premium transition-all duration-300 hover:-translate-y-1 hover:border-saffron-200 hover:shadow-premium-hover">
      {/* Dynamic top gradient line that lights up on card hover */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-stone-100 to-transparent group-hover:via-gradient-to-r group-hover:from-saffron-500 group-hover:via-white group-hover:to-indiaGreen-500 transition-all duration-500" />

      {/* Match Score Badge */}
      {showMatch && (
        <div className="absolute right-4 top-4 z-10">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
              match.score >= 80
                ? 'bg-indiaGreen-50 text-indiaGreen-800 border border-indiaGreen-200/60 shadow-sm'
                : match.score >= 50
                  ? 'bg-saffron-50 text-saffron-800 border border-saffron-200/60 shadow-sm'
                  : 'bg-stone-50 text-stone-600 border border-stone-200'
            }`}
          >
            <span>{match.score >= 80 ? '✨' : '⚡'}</span>
            <span>{match.score}% Match</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4 sm:gap-5">
        {/* Company Initial Logo box */}
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white shadow-sm border border-black/5 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: job.accent }}
        >
          {job.initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Top Tags */}
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold text-stone-400 uppercase tracking-widest">{job.company}</span>
                {appliedRecord && (
                  <span className={`rounded-full border px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider ${statusStyle[appliedRecord.status]}`}>
                    {appliedRecord.status}
                  </span>
                )}
                {appliedRecord && isFollowupDue(appliedRecord) && (
                  <span className="rounded-full border border-saffron-200 bg-saffron-50 px-2 py-0.5 text-[8.5px] font-black text-saffron-800 animate-pulse flex items-center gap-1 uppercase tracking-wider">
                    <span>⏰</span> Due
                  </span>
                )}
              </div>
              
              {/* Job Title Link */}
              <Link
                href={`/jobs/${job.id}`}
                className="focus-ring block line-clamp-1 rounded font-heading text-lg font-bold tracking-tight text-navy-950 transition-colors group-hover:text-saffron-700"
              >
                {job.title}
              </Link>
            </div>
            
            {/* Shortlist Action Star Button */}
            <button
              onClick={() => toggle(job.id)}
              aria-label={isSaved ? `Remove ${job.title} from shortlist` : `Save ${job.title} to shortlist`}
              className={`focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-base transition-all duration-200 ${
                isSaved
                  ? 'border-saffron-200 bg-saffron-50 text-saffron-500 shadow-sm scale-105'
                  : 'border-stone-200 bg-white text-stone-300 hover:border-saffron-200 hover:bg-saffron-50/50 hover:text-saffron-400'
              }`}
            >
              {isSaved ? '★' : '☆'}
            </button>
          </div>
          
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-stone-500 pr-2">{job.summary}</p>
          
          {/* Metadata Badges */}
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            <span className="rounded-md border border-stone-200/60 bg-stone-50/80 px-2 py-0.5 text-[10px] font-bold text-navy-800">{job.location}</span>
            <span className="rounded-md border border-stone-200/60 bg-stone-50/80 px-2 py-0.5 text-[10px] font-bold text-navy-800">{job.workMode}</span>
            <span className="rounded-md border border-stone-200/60 bg-stone-50/80 px-2 py-0.5 text-[10px] font-bold text-navy-800">{job.experience}</span>
          </div>
          
          {/* Footer Details */}
          <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
            <span className="text-sm font-extrabold tracking-tight text-navy-950">{job.salary}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase">
                {mounted ? relativeDate(job.postedAt) : 'Recently posted'}
              </span>
              <Link
                href={`/jobs/${job.id}`}
                className="focus-ring rounded text-xs font-bold text-saffron-700 opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 flex items-center gap-0.5 hover:text-saffron-800 transition-opacity"
              >
                View Details <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
