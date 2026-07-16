'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Application, ApplicationStatus } from '@/lib/types';
import { useCareer } from '@/lib/state';
import { useAuth } from '@/lib/auth-context';
import { EmailComposer } from './email-composer';

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

const statuses: ApplicationStatus[] = ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];

const statusStyle: Record<ApplicationStatus, string> = {
  Applied: 'border-sky-200 bg-sky-50 text-sky-700',
  'Under Review': 'border-violet-200 bg-violet-50/70 text-violet-700',
  Interview: 'border-saffron-200 bg-saffron-50 text-saffron-800',
  Offer: 'border-indiaGreen-200 bg-indiaGreen-50 text-indiaGreen-800',
  Rejected: 'border-stone-200 bg-stone-100/70 text-stone-500',
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));

function ProfileCard() {
  const { profile, completeness, applications } = useCareer();
  const { user } = useAuth();
  const userApplications = user ? applications.filter((app) => app.candidateEmail === user.email) : [];
  const name = profile.fullName || 'Your Profile';
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="premium-glass overflow-hidden rounded-3xl p-6 relative border border-stone-200">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indiaGreen-400 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-900 to-navy-950 font-heading text-lg font-black text-white shadow-premium">
          {initials || 'Y'}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate font-heading text-base font-extrabold tracking-tight text-navy-950">{name}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold text-stone-400 uppercase tracking-wider">{profile.email || 'Candidate Profile'}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-stone-200/60 bg-white/90 p-5 shadow-sm relative z-10 backdrop-blur-xs">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
              Profile strength
            </p>
            <p className="mt-0.5 font-heading text-3xl font-black text-navy-950">{completeness}%</p>
          </div>
          <Link href="/profile" className="focus-ring rounded-lg text-[10px] font-black uppercase tracking-wider text-indiaGreen-800 hover:text-white hover:bg-indiaGreen-700 transition-colors bg-indiaGreen-50 px-3 py-1.5 border border-indiaGreen-100">
            Edit Profile
          </Link>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indiaGreen-700 to-indiaGreen-500 transition-all duration-1000 ease-out"
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 relative z-10">
        <div className="rounded-xl border border-stone-200/60 bg-white/70 p-3 text-center shadow-xs">
          <p className="font-heading text-xl font-bold text-navy-950">{profile.skills.length}</p>
          <p className="mt-0.5 text-[8.5px] font-black uppercase tracking-wider text-stone-400">Skills</p>
        </div>
        <div className="rounded-xl border border-stone-200/60 bg-white/70 p-3 text-center shadow-xs">
          <p className="font-heading text-xl font-bold text-navy-950">{profile.projects.length}</p>
          <p className="mt-0.5 text-[8.5px] font-black uppercase tracking-wider text-stone-400">Projects</p>
        </div>
        <div className="rounded-xl border border-stone-200/60 bg-white/70 p-3 text-center shadow-xs">
          <p className="font-heading text-xl font-bold text-navy-950">{profile.certifications.length}</p>
          <p className="mt-0.5 text-[8.5px] font-black uppercase tracking-wider text-stone-400">Certs</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-indiaGreen-100 bg-indiaGreen-50/40 p-4 relative z-10">
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-indiaGreen-800">Active Pipeline</p>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-indiaGreen-900">
          <strong className="text-sm font-black mr-1">{userApplications.length}</strong> roles tracked
        </p>
      </div>
    </aside>
  );
}

function ApplicationDrawer({ application, close }: { application: Application; close: () => void }) {
  const { updateApplication, withdrawApplication, jobs, setFollowupReminder, logFollowupSent, profile } = useCareer();
  const job = jobs.find((item) => item.id === application.jobId);
  
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateVal, setCustomDateVal] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [close]);

  useEffect(() => {
    if (application.followupReminder === 'custom' && application.followupReminderDate) {
      setCustomDateVal(application.followupReminderDate.split('T')[0]);
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
    }
  }, [application]);

  if (!job) return null;

  const due = isFollowupDue(application);

  const handleCopyEmail = () => {
    if (job.hrEmail) {
      navigator.clipboard.writeText(job.hrEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const hrName = job.hrName || 'Hiring Manager';
  const hrEmail = job.hrEmail || '';
  const hrDesignation = job.hrDesignation || 'Hiring Team';

  const defaultSubject = `Follow-up regarding my application for ${job.title}`;
  const defaultBody = `Hi ${hrName},\n\nI hope you're having a great week!\n\nI'm writing to follow up on my application for the ${job.title} role. I am very excited about this opportunity and would love to hear if there are any updates regarding the next steps.\n\nThank you,\n${profile.fullName || 'Candidate'}`;

  const mailtoUrl = `mailto:${hrEmail}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-navy-950/30 p-3 sm:p-6 backdrop-blur-xs animate-fade-in flex justify-end"
      onMouseDown={close}
      role="presentation"
    >
      <section
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Application details"
        className="h-full w-full max-w-md flex flex-col overflow-hidden rounded-3xl border border-stone-200/60 bg-ivory-100 shadow-2xl animate-fade-in"
      >
        <div className="border-b border-stone-200/50 bg-white px-6 py-5 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indiaGreen-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <p className="eyebrow !text-saffron-500">Pipeline Details</p>
              <h2 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-navy-950">{job.title}</h2>
              <p className="mt-0.5 text-xs font-bold text-stone-400 uppercase tracking-widest">{job.company}</p>
            </div>
            <button
              onClick={close}
              aria-label="Close details"
              className="focus-ring grid h-8 w-8 place-items-center rounded-lg border border-stone-200 bg-stone-50 text-base text-stone-500 transition hover:bg-stone-100 hover:text-navy-900"
            >
              ×
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-1.5 relative z-10">
            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusStyle[application.status]}`}>
              {application.status}
            </span>
            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-stone-400">
              Applied {formatDate(application.appliedAt)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
              Current stage
            </label>
            <select
              value={application.status}
              onChange={(event) => updateApplication(application.id, event.target.value as ApplicationStatus)}
              className="focus-ring mt-2 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-bold text-navy-800 outline-none cursor-pointer"
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* HR Contact Section */}
          {(job.hrName || job.hrEmail) && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-4 space-y-3">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
                Hiring manager contact
              </label>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-navy-950">{hrName}</p>
                {job.hrDesignation && (
                  <p className="text-[10px] font-bold text-stone-400 uppercase mt-0.5">{hrDesignation}</p>
                )}
                {hrEmail && <p className="text-xs text-stone-500 truncate mt-1">{hrEmail}</p>}
              </div>
              {hrEmail && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-[10px] font-bold px-3 py-1.5 shadow-xs transition"
                  >
                    {copied ? '✓ Copied' : '📋 Copy Email'}
                  </button>
                  <a
                    href={mailtoUrl}
                    className="rounded-lg bg-white border border-stone-200 hover:border-indiaGreen-300 hover:bg-indiaGreen-50/30 text-stone-700 text-[10px] font-bold px-3 py-1.5 shadow-xs transition"
                  >
                    ✉ Open Mail App
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsEmailOpen(true)}
                    className="rounded-lg bg-navy-950 text-white text-[10px] font-bold px-3 py-1.5 shadow-sm hover:bg-navy-900 transition ml-auto"
                  >
                    💻 Write Mock Email
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Reminders section */}
          <section className="rounded-2xl border border-stone-200/80 bg-white p-4">
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">
              Follow-up reminder
            </label>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[
                { value: null, label: 'Off' },
                { value: '3days', label: '3 Days' },
                { value: '1week', label: '1 Week' },
                { value: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => {
                    if (option.value === 'custom') {
                      setShowDatePicker(true);
                    } else {
                      setFollowupReminder(application.id, option.value as '3days' | '1week' | 'custom' | null);
                      setShowDatePicker(false);
                      setSuccessMsg('Reminder configuration saved!');
                      setTimeout(() => setSuccessMsg(''), 2000);
                    }
                  }}
                  className={`flex-1 rounded-lg border py-1.5 text-[10px] font-bold uppercase transition min-w-[70px] ${
                    (option.value === 'custom' && application.followupReminder === 'custom') ||
                    (option.value !== 'custom' && (application.followupReminder ?? null) === option.value)
                      ? 'bg-indiaGreen-700 text-white border-indiaGreen-700 shadow-sm'
                      : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {showDatePicker && (
              <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Choose Custom Date</span>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={customDateVal}
                  onChange={(e) => {
                    setCustomDateVal(e.target.value);
                    if (e.target.value) {
                      setFollowupReminder(application.id, 'custom', e.target.value);
                      setSuccessMsg('Custom date set!');
                      setTimeout(() => setSuccessMsg(''), 2000);
                    }
                  }}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-indiaGreen-500 focus:ring-2 focus:ring-indiaGreen-100 transition-all cursor-pointer"
                />
              </div>
            )}

            {successMsg && (
              <div className="mt-3 rounded-lg bg-indiaGreen-50 border border-indiaGreen-100 p-2 text-center text-[10px] font-bold text-indiaGreen-800 shadow-xs">
                ✓ {successMsg}
              </div>
            )}

            {due && (
              <div className="mt-4 rounded-xl border border-saffron-200 bg-saffron-50 p-3 flex items-center justify-between gap-3 animate-pulse shadow-xs">
                <div className="flex gap-2.5 items-center min-w-0">
                  <span className="text-lg">⏰</span>
                  <p className="text-[10px] font-black text-saffron-800 uppercase tracking-wider">Overdue reminder</p>
                </div>
                <button
                  onClick={() => {
                    logFollowupSent(application.id);
                    setSuccessMsg('Reminder timeline reset!');
                    setTimeout(() => setSuccessMsg(''), 2000);
                  }}
                  className="rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-[9px] px-3 py-1.5 shadow-sm uppercase tracking-wider transition-colors"
                >
                  Mark Sent
                </button>
              </div>
            )}
          </section>

          {/* Timeline Section */}
          <section className="rounded-2xl border border-stone-200/80 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">Activity logs</p>
              <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/30">{application.events.length} events</span>
            </div>
            <ol className="space-y-4 border-l-2 border-stone-100 pl-4 ml-1">
              {[...application.events].reverse().map((event, index) => (
                <li key={event.id} className="relative">
                  <span className={`absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white shadow-xs ${index === 0 ? 'bg-indiaGreen-500 animate-pulse' : 'bg-stone-300'}`} />
                  <p className={`text-xs font-bold ${index === 0 ? 'text-navy-950' : 'text-stone-500'}`}>{event.label}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-stone-400">{formatDate(event.date)}</p>
                </li>
              ))}
            </ol>
          </section>

          {application.note && (
            <section className="rounded-2xl border border-stone-200/80 bg-white p-4">
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400 mb-2">Private note</p>
              <p className="rounded-xl bg-ivory-100 p-3 text-xs leading-relaxed text-stone-600 font-medium italic border border-stone-100">
                &ldquo;{application.note}&rdquo;
              </p>
            </section>
          )}

          {/* Withdrawal block */}
          <section className="rounded-2xl border border-red-100 bg-red-50/20 p-4">
            <p className="text-xs font-bold text-navy-950">Withdraw application</p>
            <p className="mt-1 text-[10px] leading-relaxed text-stone-400 font-medium">
              Log this application track as withdrawn. This update is permanent.
            </p>
            <button
              onClick={() => {
                withdrawApplication(application.id);
                close();
              }}
              className="focus-ring mt-3.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors shadow-xs w-full"
            >
              Withdraw Application
            </button>
          </section>
        </div>

        {isEmailOpen && job.hrEmail && (
          <EmailComposer
            applicationId={application.id}
            recipientName={hrName}
            recipientEmail={hrEmail}
            recipientRole="hr"
            defaultSubject={defaultSubject}
            defaultBody={defaultBody}
            isOpen={isEmailOpen}
            onClose={() => setIsEmailOpen(false)}
          />
        )}
      </section>
    </div>
  );
}

export function CandidateDashboard() {
  const { applications, hydrated, jobs } = useCareer();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Application | null>(null);

  const userApplications = useMemo(
    () => (user ? applications.filter((app) => app.candidateEmail === user.email) : []),
    [applications, user],
  );

  const byStatus = useMemo(
    () => {
      return statuses.map((status) => ({
        status,
        applications: userApplications.filter((application) => application.status === status),
      }));
    },
    [userApplications],
  );

  const currentSelectedApp = useMemo(() => {
    if (!selected) return null;
    return userApplications.find((a) => a.id === selected.id) || null;
  }, [userApplications, selected]);

  if (!hydrated) {
    return (
      <section className="shell py-12">
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-[400px] animate-pulse rounded-3xl bg-stone-200/50" />
          <div className="h-[600px] animate-pulse rounded-3xl bg-stone-200/50" />
        </div>
      </section>
    );
  }

  const totals = byStatus.map((column) => ({
    status: column.status,
    count: column.applications.length,
  }));

  return (
    <section className="py-2">
      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <ProfileCard />

        <section className="premium-glass min-w-0 rounded-3xl p-5 sm:p-7 border border-stone-200">
          {/* Header */}
          <div className="flex flex-col gap-5 border-b border-stone-200/60 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-heading text-xl font-extrabold tracking-tight text-navy-950">Application Pipeline</p>
              <p className="mt-1.5 max-w-xl text-xs sm:text-sm font-medium text-stone-500">
                Update status columns, inspect details, and configure alerts.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {totals.map((item) => (
                <span
                  key={item.status}
                  className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-xs ${statusStyle[item.status]}`}
                >
                  {item.status}: {item.count}
                </span>
              ))}
            </div>
          </div>

          {/* Kanban columns */}
          {userApplications.length ? (
            <div className="mt-6 overflow-x-auto pb-4 custom-scrollbar">
              <div className="grid min-w-[1000px] grid-cols-5 gap-3.5">
                {byStatus.map((column) => (
                  <div key={column.status} className="rounded-2xl border border-stone-200/60 bg-stone-50/50 p-3.5">
                    <div className="flex items-center justify-between px-1.5 mb-3.5">
                      <span className={`rounded-full border px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider shadow-xs ${statusStyle[column.status]}`}>
                        {column.status}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-150 shadow-xs">{column.applications.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {column.applications.map((application) => {
                        const job = jobs.find((item) => item.id === application.jobId);
                        if (!job) return null;

                        const due = isFollowupDue(application);

                        return (
                          <button
                            key={application.id}
                            onClick={() => setSelected(application)}
                            className={`focus-ring group w-full rounded-xl border bg-white p-3.5 text-left shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${
                              due
                                ? 'border-saffron-300 hover:border-saffron-400 bg-gradient-to-br from-white to-saffron-50/20'
                                : 'border-stone-200 hover:border-indiaGreen-300/60'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-heading font-extrabold text-white shadow-xs"
                                style={{ backgroundColor: job.accent }}
                              >
                                {job.initials}
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex items-start justify-between gap-1.5">
                                  <p className="line-clamp-1 text-xs font-bold tracking-tight text-navy-950 group-hover:text-indiaGreen-700 transition-colors">
                                    {job.title}
                                  </p>
                                  {due && (
                                    <span className="shrink-0 rounded-full border border-saffron-200 bg-saffron-50 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-saffron-800 animate-pulse flex items-center gap-0.5">
                                      ⏰ Due
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[10px] font-semibold text-stone-400">{job.company}</p>
                                <p className="mt-3 inline-block rounded bg-stone-50 border border-stone-100 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-stone-400">
                                  {formatDate(application.appliedAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {!column.applications.length && (
                        <div className="rounded-xl border border-dashed border-stone-200 bg-white/30 px-3 py-8 text-center">
                          <p className="text-[9px] font-extrabold uppercase tracking-widest text-stone-400">Empty Stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-8 grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-stone-250 bg-white/40 p-8 text-center animate-fade-in shadow-xs backdrop-blur-xs">
              <div className="max-w-md">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-indiaGreen-50 text-xl text-indiaGreen-600 shadow-xs border border-indiaGreen-100">
                  ↗
                </div>
                <p className="mt-5 font-heading text-lg font-bold text-navy-950">No applications found. Start applying!</p>
                <p className="mt-2 text-xs leading-relaxed text-stone-500 font-medium">
                  Select and apply to position roles from the job discover catalog to automatically populate tracking boards.
                </p>
                <Link href="/#jobs" className="mt-6 btn-primary inline-flex">
                  Explore Roles
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {currentSelectedApp && (
        <ApplicationDrawer
          application={currentSelectedApp}
          close={() => setSelected(null)}
        />
      )}
    </section>
  );
}
