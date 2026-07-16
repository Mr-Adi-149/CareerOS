'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { ApplyModal } from '@/components/apply-modal';
import { JobCard } from '@/components/job-card';
import { useCareer, calculateMatchScore } from '@/lib/state';
import { useAuth } from '@/lib/auth-context';
import { useMemo, useState, useEffect } from 'react';
import { EmailComposer } from '@/components/email-composer';
import { Application } from '@/lib/types';

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

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));

export default function JobPage() {
  const params = useParams();
  const id = params?.id as string;
  const { jobs, profile, userRole, applications, setFollowupReminder, logFollowupSent } = useCareer();
  const { user } = useAuth();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateVal, setCustomDateVal] = useState('');
  const [visualMsg, setVisualMsg] = useState('');
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const job = useMemo(() => jobs.find((item) => item.id === id), [jobs, id]);

  const resolvedApplication = useMemo(() => {
    return user
      ? applications.find((app) => app.jobId === id && app.candidateEmail === user.email)
      : undefined;
  }, [applications, id, user]);

  const similar = useMemo(() => {
    if (!job) return [];
    return jobs
      .filter(
        (item) =>
          item.id !== job.id &&
          (item.workMode === job.workMode || item.skills.some((skill) => job.skills.includes(skill)))
      )
      .slice(0, 2);
  }, [jobs, job]);

  const match = useMemo(() => {
    if (!job) return { score: 0, reasons: [] };
    return calculateMatchScore(profile, job);
  }, [profile, job]);

  useEffect(() => {
    if (resolvedApplication?.followupReminder === 'custom' && resolvedApplication.followupReminderDate) {
      setCustomDateVal(resolvedApplication.followupReminderDate.split('T')[0]);
    }
  }, [resolvedApplication]);

  if (!job) notFound();

  const handleCopyEmail = () => {
    if (job.hrEmail) {
      navigator.clipboard.writeText(job.hrEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const hrName = job.hrName || 'Hiring Manager';
  const hrEmail = job.hrEmail || '';
  const hrDesignation = job.hrDesignation || 'Talent Acquisition';

  const defaultSubject = `Follow-up regarding my application for ${job.title}`;
  const defaultBody = `Hi ${hrName},\n\nI hope you're having a great week!\n\nI'm writing to follow up on my application for the ${job.title} role at ${job.company}. I am very excited about this opportunity and would love to hear if there are any updates regarding the next steps in the hiring process.\n\nThank you for your time,\n${profile.fullName || 'Candidate'}`;

  const mailtoUrl = `mailto:${hrEmail}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;

  return (
    <main className="animate-fade-up">
      <section className="relative overflow-hidden border-b border-stone-200/50 bg-ivory-100">
        {/* Tricolor radial mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indiaGreen-100/30 via-ivory-100 to-saffron-50/20" />
        
        <div className="shell relative py-10 sm:py-14">
          <Link href="/#jobs" className="focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-indiaGreen-700 hover:text-indiaGreen-900 transition-colors">
            <span>←</span> Browse Job Discover Catalog
          </Link>
          
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4 sm:gap-6 items-start">
              <div
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-heading font-black text-white shadow-premium border border-black/5"
                style={{ backgroundColor: job.accent }}
              >
                {job.initials}
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{job.company}</p>
                <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
                  {job.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg shadow-xs border border-stone-200 text-xs font-bold text-navy-800">{job.location}</span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg shadow-xs border border-stone-200 text-xs font-bold text-navy-800">{job.workMode}</span>
                  <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg shadow-xs border border-stone-200 text-xs font-bold text-navy-800">{job.jobType}</span>
                </div>
              </div>
            </div>
            <div className="rounded-full border border-indiaGreen-200/80 bg-indiaGreen-50 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-indiaGreen-800 shadow-xs flex items-center gap-1.5 self-start">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indiaGreen-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indiaGreen-500"></span>
              </span>
              Recently posted
            </div>
          </div>
        </div>
      </section>

      <div className="shell grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="max-w-2xl space-y-12">
          {/* Key Job parameters */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Salary Pack', value: job.salary, border: 'border-l-4 border-l-indiaGreen-600' },
              { label: 'Experience', value: job.experience, border: 'border-l-4 border-l-navy-950' },
              { label: 'Work Mode', value: job.workMode, border: 'border-l-4 border-l-saffron-500' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md ${item.border}`}>
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">{item.label}</p>
                <p className="mt-2.5 font-heading text-[15px] font-bold text-navy-950">{item.value}</p>
              </div>
            ))}
          </div>

          <section>
            <p className="eyebrow !text-saffron-600">The Opportunity</p>
            <h2 className="mt-2 font-heading text-xl font-extrabold text-navy-950">About this role</h2>
            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-stone-500">{job.description}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-navy-950">What you&apos;ll do</h2>
            <ul className="mt-5 space-y-3.5">
              {job.responsibilities.map((item) => (
                <li className="flex gap-3 text-xs sm:text-sm leading-relaxed text-stone-500" key={item}>
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-lg bg-indiaGreen-50 text-[10px] font-extrabold text-indiaGreen-800 shadow-xs border border-indiaGreen-100/50">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-extrabold text-navy-950">What you&apos;ll bring</h2>
            <ul className="mt-5 space-y-3.5">
              {job.requirements.map((item) => (
                <li className="flex gap-3.5 text-xs sm:text-sm leading-relaxed text-stone-500" key={item}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500 shadow-xs" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="lg:sticky lg:top-28 lg:self-start space-y-6">
          <div className="premium-glass rounded-3xl p-6 border-t-4 border-t-indiaGreen-500">
            {userRole === 'recruiter' ? (
              <div className="rounded-2xl border border-stone-200 bg-white/50 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👔</span>
                  <p className="text-xs font-bold uppercase tracking-[.14em] text-navy-900">Recruiter Mode</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-500">
                  You are viewing how this job post appears live to candidates. Applying is disabled.
                </p>
                <Link
                  href="/recruiter"
                  className="mt-5 btn-primary w-full justify-center"
                >
                  Return to Pipeline
                </Link>
              </div>
            ) : resolvedApplication ? (
              <div className="rounded-2xl border border-indiaGreen-200 bg-white p-5 shadow-sm space-y-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[.14em] text-indiaGreen-800">
                    Application Tracker
                  </span>
                  <div className="mt-2 flex items-center justify-between bg-indiaGreen-50 p-2.5 rounded-xl border border-indiaGreen-100">
                    <span className="inline-flex items-center gap-1.5 font-bold text-indiaGreen-800">
                      ✓ {resolvedApplication.status}
                    </span>
                    <span className="text-xs font-semibold text-indiaGreen-600">
                      {formatDate(resolvedApplication.appliedAt)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-5 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-[.14em] text-stone-500">
                    Follow-up Reminders
                  </span>
                  
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: null, label: 'Off' },
                      { value: '3days', label: '3d' },
                      { value: '1week', label: '1w' },
                      { value: 'custom', label: 'Custom' },
                    ].map((opt) => (
                      <button
                         key={opt.label}
                         type="button"
                         onClick={() => {
                           if (opt.value === 'custom') {
                             setShowDatePicker(true);
                           } else {
                             setFollowupReminder(resolvedApplication.id, opt.value as '3days' | '1week' | 'custom' | null);
                             setShowDatePicker(false);
                             setVisualMsg('Reminder updated!');
                             setTimeout(() => setVisualMsg(''), 1500);
                           }
                         }}
                         className={`rounded-lg border py-2 text-center text-xs font-bold transition-all duration-200 ${
                           resolvedApplication.followupReminder === opt.value
                             ? 'bg-indiaGreen-700 text-white border-indiaGreen-700 shadow-md transform scale-[1.02]'
                             : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:border-stone-300'
                         }`}
                       >
                         {opt.label}
                       </button>
                    ))}
                  </div>

                  {showDatePicker && (
                    <div className="space-y-2 animate-fade-in pt-2">
                      <span className="text-xs font-semibold text-stone-500">Select Date:</span>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={customDateVal}
                        onChange={(e) => {
                          setCustomDateVal(e.target.value);
                          if (e.target.value) {
                            setFollowupReminder(resolvedApplication.id, 'custom', e.target.value);
                            setVisualMsg('Custom reminder set!');
                            setTimeout(() => setVisualMsg(''), 1500);
                          }
                        }}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium outline-none focus:border-indiaGreen-500 focus:ring-2 focus:ring-indiaGreen-100 transition-all"
                      />
                    </div>
                  )}

                  {visualMsg && (
                    <p className="text-[11px] font-bold text-indiaGreen-700 text-center animate-fade-in bg-indiaGreen-50 py-1.5 rounded-lg">
                      ✓ {visualMsg}
                    </p>
                  )}

                  {isFollowupDue(resolvedApplication) && (
                    <div className="rounded-xl border border-saffron-200 bg-saffron-50 p-4 flex flex-col gap-3 animate-pulse mt-3 shadow-sm">
                      <div className="flex gap-2 items-center">
                        <span className="text-sm">⏰</span>
                        <p className="text-xs font-bold uppercase tracking-wide text-saffron-800">Follow-up overdue!</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => logFollowupSent(resolvedApplication.id)}
                        className="w-full rounded-lg bg-saffron-500 hover:bg-saffron-600 text-white font-bold text-xs py-2 shadow-sm transition-colors"
                      >
                        Mark Follow-up Sent
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-heading text-xl font-bold text-navy-950">Interested in this role?</p>
                <p className="text-sm leading-relaxed text-stone-500">
                  A quick application takes less than two minutes. Your profile data will be attached automatically.
                </p>
                <div className="pt-2">
                  <ApplyModal title={job.title} company={job.company} jobId={job.id} />
                </div>
              </div>
            )}
          </div>

          {profile.fullName && userRole === 'candidate' && (
            <div className="premium-glass rounded-3xl p-6">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500">
                ✨ AI Match Insights
              </p>
              <div className="mt-4 rounded-2xl border border-white/50 bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-heading text-4xl font-bold ${match.score >= 80
                      ? 'text-indiaGreen-700'
                      : match.score >= 50
                        ? 'text-saffron-600'
                        : 'text-stone-700'
                      }`}
                  >
                    {match.score}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-1 rounded-md">Live Score</span>
                </div>

                <div className="mt-4 h-2 w-full rounded-full bg-stone-100 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${match.score >= 80
                      ? 'bg-gradient-to-r from-indiaGreen-500 to-indiaGreen-400'
                      : match.score >= 50
                        ? 'bg-gradient-to-r from-saffron-500 to-saffron-400'
                        : 'bg-stone-400'
                      }`}
                    style={{ width: `${match.score}%` }}
                  />
                </div>

                <ul className="mt-5 space-y-3 text-xs font-medium text-stone-600">
                  {match.reasons.map((r, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="text-indiaGreen-500 text-lg leading-none mt-[-2px]">▸</span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {(job.hrName || job.hrEmail) && (
            <div className="premium-glass rounded-3xl p-6">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 mb-4">👔 Hiring Manager</p>
              <div className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-sm space-y-4">
                <div>
                  <p className="font-heading text-lg font-bold text-navy-950">{hrName}</p>
                  {job.hrDesignation && (
                    <p className="text-xs font-medium text-stone-500 mt-1">{hrDesignation}</p>
                  )}
                  {hrEmail && (
                    <p className="text-sm font-semibold text-indiaGreen-700 truncate mt-2 bg-indiaGreen-50/50 inline-block px-2 py-1 rounded-md">{hrEmail}</p>
                  )}
                </div>
                
                {hrEmail && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="rounded-lg bg-white border border-stone-200 hover:border-indiaGreen-300 hover:bg-indiaGreen-50 hover:text-indiaGreen-800 text-stone-700 text-[11px] font-bold px-3 py-1.5 shadow-sm transition-all"
                    >
                      {copied ? '✓ Copied' : '📋 Copy Email'}
                    </button>
                    <a
                      href={mailtoUrl}
                      className="rounded-lg bg-white border border-stone-200 hover:border-indiaGreen-300 hover:bg-indiaGreen-50 hover:text-indiaGreen-800 text-stone-700 text-[11px] font-bold px-3 py-1.5 shadow-sm transition-all flex items-center gap-1.5"
                    >
                      ✉ Mail App
                    </a>
                    {resolvedApplication && (
                      <button
                        type="button"
                        onClick={() => setIsEmailComposerOpen(true)}
                        className="rounded-lg bg-indiaGreen-700 hover:bg-indiaGreen-800 text-white text-[11px] font-bold px-3 py-1.5 shadow-sm transition-all"
                      >
                        ✉ Send Message
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="premium-glass rounded-3xl p-6">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 mb-4">Key skills</p>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-800 shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-indiaGreen-50 border border-indiaGreen-100 p-4 text-xs leading-relaxed text-indiaGreen-900 shadow-sm">
            <strong className="font-bold text-indiaGreen-800 block mb-1">Thoughtful applications matter.</strong> 
            A short note about why this team excites you goes a long way.
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-stone-200 bg-white py-16 sm:py-24">
          <div className="shell">
            <p className="eyebrow !text-saffron-500">Keep Exploring</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-navy-950">
              Similar opportunities
            </h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {similar.map((item) => (
                <JobCard key={item.id} job={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {isEmailComposerOpen && resolvedApplication && (
        <EmailComposer
          applicationId={resolvedApplication.id}
          recipientName={hrName}
          recipientEmail={hrEmail}
          recipientRole="hr"
          defaultSubject={defaultSubject}
          defaultBody={defaultBody}
          isOpen={isEmailComposerOpen}
          onClose={() => setIsEmailComposerOpen(false)}
        />
      )}
    </main>
  );
}
