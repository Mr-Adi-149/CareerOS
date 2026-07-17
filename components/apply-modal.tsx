'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCareer } from '@/lib/state';
import { useAuth } from '@/lib/auth-context';
import { EmailComposer } from './email-composer';

export function ApplyModal({ jobId, title, company }: { jobId?: string; title: string; company: string }) {
  const { applications, applyToJob, profile, jobs } = useCareer();
  const { user } = useAuth();
  const resolvedJobId = jobId ?? jobs.find((job) => job.title === title && job.company === company)?.id ?? title;
  const job = jobs.find((j) => j.id === resolvedJobId);

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'email'>('quick');
  const [sent, setSent] = useState(false);
  const [note, setNote] = useState('');
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailApplicationMethod, setEmailApplicationMethod] = useState<'quick' | 'direct'>('quick');

  const dialogRef = useRef<HTMLDivElement>(null);
  const applied = user
    ? applications.some((application) => application.jobId === resolvedJobId && application.candidateEmail === user.email)
    : false;

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const submitQuickApply = (event: FormEvent) => {
    event.preventDefault();
    applyToJob(resolvedJobId, note);
    setEmailApplicationMethod('quick');
    setSent(true);
  };

  const handleMarkAsEmailed = () => {
    // Registers application in the candidate's tracking dashboard
    applyToJob(resolvedJobId, 'Applied directly via email to Hiring Manager.');
    setEmailApplicationMethod('direct');
    setSent(true);
  };

  const handleCopyEmail = () => {
    if (job?.hrEmail) {
      navigator.clipboard.writeText(job.hrEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const candidateName = profile.fullName || 'Candidate';
  const candidateEmail = profile.email || 'your-email@example.com';
  const hrName = job?.hrName || 'Hiring Manager';
  const hrEmail = job?.hrEmail || '';
  const hrDesignation = job?.hrDesignation || 'Recruiting Team';

  const defaultSubject = `Application for ${title} - ${candidateName}`;
  const defaultBody = `Hi ${hrName},\n\nI hope you're having a great week!\n\nI am writing to express my strong interest in the ${title} position at ${company}. I believe my skills and background align well with your requirements.\n\nHere are my quick details:\n- Name: ${candidateName}\n- Contact: ${candidateEmail}\n\nI look forward to discussing how I can add value to your team.\n\nBest regards,\n${candidateName}`;

  const mailtoUrl = `mailto:${hrEmail}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;

  return (
    <>
      <button
        disabled={applied}
        onClick={() => {
          setSent(false);
          setOpen(true);
          setActiveTab('quick');
        }}
        className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
      >
        {applied ? 'Application Sent ✓' : 'Apply for this role'}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-title"
            className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/60 bg-ivory-100 p-8 shadow-2xl animate-fade-in translate-y-0"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indiaGreen-500 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>

            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="min-w-0">
                <p className="eyebrow !text-saffron-500">{company}</p>
                <h2 id="application-title" className="mt-2 font-heading text-2xl font-bold tracking-tight text-navy-950">
                  {sent ? 'You’re in the pipeline!' : `Apply to ${title}`}
                </h2>
              </div>
              <button
                aria-label="Close application"
                onClick={() => setOpen(false)}
                className="shrink-0 focus-ring grid h-10 w-10 place-items-center rounded-xl border border-stone-200 bg-white text-xl text-stone-500 transition hover:bg-stone-50 hover:text-navy-900"
              >
                ×
              </button>
            </div>

            {sent ? (
              <div className="py-10 text-center relative z-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indiaGreen-50 text-3xl text-indiaGreen-600 shadow-sm border border-indiaGreen-100">
                  ✓
                </div>
                <p className="mt-6 text-base font-semibold leading-relaxed text-stone-600">
                  Your application for <strong className="text-navy-950">{title}</strong> has been logged.
                </p>
                <p className="mt-3 text-xs font-medium text-stone-500 bg-stone-50 border border-stone-100 py-2 px-4 rounded-xl inline-block">
                  {emailApplicationMethod === 'direct'
                    ? 'Registered as: Applied directly via Email.'
                    : 'Registered as: Applied via Niyukti Quick Apply.'}
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="btn-primary mt-8 w-full justify-center"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-6 relative z-10">
                {/* Tabs */}
                {hrEmail && (
                  <div className="flex border-b border-stone-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab('quick')}
                      className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'quick'
                          ? 'border-indiaGreen-700 text-indiaGreen-800'
                          : 'border-transparent text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      🚀 Quick Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('email')}
                      className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                        activeTab === 'email'
                          ? 'border-indiaGreen-700 text-indiaGreen-800'
                          : 'border-transparent text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      ✉ Apply via Email
                    </button>
                  </div>
                )}

                {/* Tab content 1: Quick Apply */}
                {activeTab === 'quick' && (
                  <form onSubmit={submitQuickApply} className="space-y-5 pt-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">
                      Full name
                      <input
                        required
                        defaultValue={profile.fullName}
                        className="focus-ring mt-2 w-full rounded-xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-navy-900 outline-none focus:border-indiaGreen-500 focus:bg-white transition-all cursor-not-allowed opacity-70"
                        placeholder="Your name"
                        disabled
                      />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">
                      Email
                      <input
                        type="email"
                        required
                        defaultValue={profile.email}
                        className="focus-ring mt-2 w-full rounded-xl border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-navy-900 outline-none focus:border-indiaGreen-500 focus:bg-white transition-all cursor-not-allowed opacity-70"
                        placeholder="you@example.com"
                        disabled
                      />
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500">
                      Why are you a fit? <span className="font-semibold lowercase text-stone-400 tracking-normal">(Optional)</span>
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="focus-ring mt-2 min-h-[120px] w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-navy-900 outline-none focus:border-indiaGreen-500 focus:ring-4 focus:ring-indiaGreen-500/10 transition-all custom-scrollbar"
                        placeholder="A short note for the hiring team..."
                      />
                    </label>
                    <button className="btn-primary w-full justify-center text-base py-3">
                      Send Application
                    </button>
                    <p className="text-center text-[11px] font-medium text-stone-400">
                      Saved privately in your Niyukti workspace.
                    </p>
                  </form>
                )}

                {/* Tab content 2: Apply via Email */}
                {activeTab === 'email' && job && (
                  <div className="space-y-6 pt-2">
                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[.14em] text-stone-500">
                        Recruiter / Hiring Contact
                      </p>
                      <p className="mt-2 text-base font-bold text-navy-950">{hrName}</p>
                      <p className="text-xs font-medium text-stone-500 mt-0.5">{hrDesignation}</p>
                      <p className="text-sm text-indiaGreen-700 font-semibold truncate mt-2 bg-indiaGreen-50 inline-block px-3 py-1 rounded-lg">{hrEmail}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="rounded-xl bg-white border border-stone-200 hover:border-indiaGreen-300 hover:bg-indiaGreen-50 hover:text-indiaGreen-800 text-stone-700 text-xs font-bold px-4 py-2 shadow-sm transition-all"
                        >
                          {copied ? '✓ Copied' : '📋 Copy Email'}
                        </button>
                        <a
                          href={mailtoUrl}
                          className="rounded-xl bg-white border border-stone-200 hover:border-indiaGreen-300 hover:bg-indiaGreen-50 hover:text-indiaGreen-800 text-stone-700 text-xs font-bold px-4 py-2 shadow-sm transition-all flex items-center gap-1.5"
                        >
                          ✉ Open Mail App
                        </a>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-indiaGreen-200 bg-indiaGreen-50/50 p-5 text-center">
                      <p className="text-sm font-bold text-navy-950">Prefer using our built-in simulator?</p>
                      <p className="mt-2 text-xs font-medium text-stone-600 leading-relaxed">
                        Draft a mock message right here inside Niyukti to test the tracking flow.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEmailComposerOpen(true)}
                        className="mt-4 rounded-xl bg-indiaGreen-700 hover:bg-indiaGreen-800 text-white text-xs font-bold px-5 py-2.5 shadow-sm transition-all"
                      >
                        ✍ Open Mock Email Composer
                      </button>
                    </div>

                    <div className="pt-2 border-t border-stone-200">
                      <button
                        onClick={handleMarkAsEmailed}
                        className="w-full rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white text-sm font-bold px-5 py-3.5 shadow-md transition-all"
                      >
                        ✔ Mark as Emailed & Applied
                      </button>
                      <p className="text-center text-[11px] font-medium text-stone-400 mt-3">
                        This adds this job to your Applied column in the tracking pipeline.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {isEmailComposerOpen && job && (
        <EmailComposer
          applicationId={resolvedJobId} // resolves temporary link
          recipientName={hrName}
          recipientEmail={hrEmail}
          recipientRole="hr"
          defaultSubject={defaultSubject}
          defaultBody={defaultBody}
          isOpen={isEmailComposerOpen}
          onClose={() => {
            setIsEmailComposerOpen(false);
            // Marks applied automatically since mock email composer was successfully submitted
            applyToJob(resolvedJobId, 'Applied by sending simulated email to Hiring Manager.');
            setEmailApplicationMethod('direct');
            setSent(true);
          }}
        />
      )}
    </>
  );
}
