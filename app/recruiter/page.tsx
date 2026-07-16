'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useCareer } from '@/lib/state';
import { Job, ApplicationStatus, WorkMode, JobType, Experience, Application } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { EmailComposer } from '@/components/email-composer';
import { RoleGuard } from '@/components/role-guard';
import { BrandLoader } from '@/components/brand-loader';

const statuses: ApplicationStatus[] = ['Applied', 'Under Review', 'Interview', 'Offer', 'Rejected'];

const statusStyle: Record<ApplicationStatus, string> = {
  Applied: 'border-sky-200 bg-sky-50 text-sky-800',
  'Under Review': 'border-violet-200 bg-violet-50 text-violet-800',
  Interview: 'border-amber-200 bg-amber-50 text-amber-800',
  Offer: 'border-indiaGreen-200 bg-indiaGreen-50 text-indiaGreen-800',
  Rejected: 'border-stone-200 bg-stone-100 text-stone-600',
};

const statusIcons: Record<ApplicationStatus, string> = {
  Applied: '📋',
  'Under Review': '🔍',
  Interview: '💬',
  Offer: '🎉',
  Rejected: '❌',
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const openBase64Pdf = (dataUrl: string) => {
  try {
    const base64Parts = dataUrl.split(';base64,');
    const base64String = base64Parts.length > 1 ? base64Parts[1] : base64Parts[0];
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to open PDF:', error);
    alert('Failed to open resume PDF.');
  }
};

function RecruiterContent() {
  const { jobs, applications, postJob, updateApplication, addRecruiterNote, hydrated, userRole, setUserRole } = useCareer();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'jobs'>('pipeline');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('Remote');
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [experience, setExperience] = useState<Experience>('Mid level');
  const [salary, setSalary] = useState('');
  const [skills, setSkills] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  
  // HR Contact & Emailing Candidate states
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrDesignation, setHrDesignation] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedAppForEmail, setSelectedAppForEmail] = useState<Application | null>(null);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);

  const recruiterJobs = useMemo(
    () => jobs.filter((job) => job.recruiterId === user?.id),
    [jobs, user?.id]
  );

  const recruiterApplications = useMemo(() => {
    const ownedJobIds = new Set(recruiterJobs.map((job) => job.id));
    return applications.filter((application) => ownedJobIds.has(application.jobId));
  }, [applications, recruiterJobs]);

  useEffect(() => {
    if (!recruiterJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(recruiterJobs[0]?.id ?? '');
    }
  }, [recruiterJobs, selectedJobId]);

  const handleOpenEmailComposer = (app: Application) => {
    setSelectedAppForEmail(app);
    setIsEmailComposerOpen(true);
  };

  const applicantsForJob = useMemo(
    () => recruiterApplications.filter(app => app.jobId === selectedJobId),
    [recruiterApplications, selectedJobId]
  );

  const filteredApplicants = useMemo(() => {
    if (!searchTerm.trim()) return applicantsForJob;
    const term = searchTerm.toLowerCase().trim();
    return applicantsForJob.filter(
      app =>
        app.candidateName?.toLowerCase().includes(term) ||
        app.candidateEmail?.toLowerCase().includes(term) ||
        app.candidateSkills?.some(s => s.toLowerCase().includes(term))
    );
  }, [applicantsForJob, searchTerm]);

  const stats = useMemo(() => {
    const activeApps = recruiterApplications.filter(app => !app.isMock);
    const allApps = recruiterApplications;
    return {
      totalPostings: recruiterJobs.length,
      totalApplicants: allApps.length,
      activeInterviews: allApps.filter(app => app.status === 'Interview').length,
      offersExtended: allApps.filter(app => app.status === 'Offer').length,
      realApplicants: activeApps.length,
    };
  }, [recruiterJobs, recruiterApplications]);

  const groupedByStatus = useMemo(() => {
    const groups: Record<ApplicationStatus, Application[]> = {
      Applied: [],
      'Under Review': [],
      Interview: [],
      Offer: [],
      Rejected: [],
    };
    filteredApplicants.forEach(app => {
      if (groups[app.status]) {
        groups[app.status].push(app);
      }
    });
    return groups;
  }, [filteredApplicants]);

  const handlePostJob = (e: FormEvent) => {
    e.preventDefault();

    // Validate HR email if provided
    if (hrEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(hrEmail.trim())) {
        setEmailError('Please enter a valid email address (e.g. name@company.com).');
        return;
      }
    }
    setEmailError('');

    const newJob: Omit<Job, 'company' | 'recruiterId'> = {
      id: title.toLowerCase().replace(/\s+/g, '-') + '-' + crypto.randomUUID().slice(0, 4),
      title,
      initials: (user?.companyName || '').substring(0, 2).toUpperCase(),
      accent: '#2F4F4F',
      location,
      workMode,
      jobType,
      experience,
      salary,
      postedAt: new Date().toISOString(),
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      summary,
      description,
      responsibilities: responsibilities.split('\n').filter(Boolean),
      requirements: requirements.split('\n').filter(Boolean),
      hrName: hrName.trim() || undefined,
      hrEmail: hrEmail.trim() || undefined,
      hrDesignation: hrDesignation.trim() || undefined,
    };
    postJob(newJob);
    setIsPosting(false);
    setActiveTab('jobs');
    // Reset form
    setTitle('');
    setLocation('');
    setSalary('');
    setSkills('');
    setSummary('');
    setDescription('');
    setResponsibilities('');
    setRequirements('');
    setHrName('');
    setHrEmail('');
    setHrDesignation('');
  };

  if (!hydrated)
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center">
        <BrandLoader label="Opening recruiter workspace" />
      </div>
    );

  if (userRole !== 'recruiter') {
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white/70 backdrop-blur-md p-8 text-center shadow-lg">
          <div className="h-16 w-16 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Access Denied</h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            This recruiter dashboard is only accessible to employers. If you are a candidate, please switch your role to continue.
          </p>
          <button
            onClick={() => setUserRole(null)}
            className="mt-6 w-full btn-primary"
          >
            Switch Role
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-ivory-100 via-white to-navy-50">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-b border-stone-200/60 py-10">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-saffron-100/60 page-orb" />
        <div className="shell relative">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">👔</span>
                <p className="text-sm font-semibold uppercase tracking-[.15em] text-saffron-700">Recruiter Portal</p>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] text-ink sm:text-4xl">
                Candidate Management
              </h1>
              <p className="mt-1.5 text-sm text-stone-500">
                A focused hiring workspace for credible signals, faster decisions, and considerate candidate communication.
              </p>
            </div>
            <button
              onClick={() => setIsPosting(true)}
              className="hidden sm:inline-flex btn-primary items-center gap-2"
            >
              <span>+</span> Post a Job
            </button>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Open Positions', value: stats.totalPostings, icon: '📌', color: 'emerald' },
              { label: 'Total Applicants', value: stats.totalApplicants, icon: '👥', color: 'blue' },
              { label: 'Active Interviews', value: stats.activeInterviews, icon: '💬', color: 'amber' },
              { label: 'Offers Extended', value: stats.offersExtended, icon: '🎯', color: 'rose' },
            ].map((stat, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-premium-hover hover:border-saffron-200 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="text-3xl font-semibold text-navy-950">{stat.value}</p>
                  <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
                    {stat.icon}
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-[.1em] text-stone-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="shell py-8">
        {/* Tabs */}
        <div className="flex space-x-1 border-b border-stone-200/60 mb-6 bg-white/40 backdrop-blur-sm rounded-t-xl p-1">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all rounded-lg ${activeTab === 'pipeline'
              ? 'bg-navy-950 text-white shadow-md'
              : 'text-stone-500 hover:text-ink hover:bg-stone-100/50'
              }`}
          >
            🧭 Applicant Pipeline
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-all rounded-lg ${activeTab === 'jobs'
              ? 'bg-navy-950 text-white shadow-md'
              : 'text-stone-500 hover:text-ink hover:bg-stone-100/50'
              }`}
          >
            📋 Job Postings
          </button>
        </div>

        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-stone-200/60 flex-wrap">
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 min-w-0">
                <label className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 md:max-w-xs min-w-0">
                  <span className="text-sm font-semibold text-stone-700 whitespace-nowrap">Job:</span>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="flex-1 min-w-0 focus-ring h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none transition-all focus:border-indiaGreen-500"
                  >
                    {recruiterJobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title} - {job.company}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-auto sm:flex-1 h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none transition-all focus:border-indiaGreen-500 placeholder:text-stone-400 min-w-0"
                />
              </div>
              <div className="text-sm text-stone-500 whitespace-nowrap">
                <span className="font-semibold text-navy-950">{filteredApplicants.length}</span> candidates
              </div>
            </div>

            {/* Pipeline Board */}
            {filteredApplicants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 backdrop-blur-sm p-12 text-center">
                <p className="text-lg font-semibold text-stone-500">
                  {applicantsForJob.length === 0
                    ? 'No applicants for this role yet.'
                    : 'No candidates match your search.'}
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  {applicantsForJob.length === 0
                    ? 'Share the job posting to start receiving applications.'
                    : 'Try adjusting your search terms.'}
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
                {statuses.map(status => {
                  const apps = groupedByStatus[status] || [];
                  return (
                    <div key={status} className="flex flex-col w-72 sm:w-80 shrink-0 snap-start">
                      <div className="flex items-center justify-between mb-3 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-stone-200/60 sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{statusIcons[status]}</span>
                          <h3 className="text-sm font-bold uppercase tracking-[.08em] text-stone-700">
                            {status}
                          </h3>
                        </div>
                        <span className="text-xs font-bold text-navy-950 bg-stone-200/60 px-2.5 py-1 rounded-full">
                          {apps.length}
                        </span>
                      </div>
                      <div className="flex-1 space-y-3 min-h-[200px]">
                        {apps.map(app => (
                          <div
                            key={app.id}
                            className="group rounded-xl border border-stone-200/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] hover:border-indiaGreen-300 flex flex-col gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-ink truncate">
                                  {app.candidateName || 'Unknown'}
                                </h4>
                                <p className="text-xs text-stone-500 truncate">
                                  {app.candidateEmail || 'No email'}
                                </p>
                                {app.candidateEmail && (
                                  <button
                                    onClick={() => handleOpenEmailComposer(app)}
                                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950 transition-colors"
                                  >
                                    ✉ Contact Candidate
                                  </button>
                                )}
                              </div>
                              {app.candidateCompleteness !== undefined && (
                                <div className="flex items-center gap-1.5">
                                  <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      {app.candidateCompleteness}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {app.candidateSkills && app.candidateSkills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {app.candidateSkills.slice(0, 3).map(skill => (
                                  <span
                                    key={skill}
                                    className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[9px] font-medium text-stone-600"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {app.candidateSkills.length > 3 && (
                                  <span className="text-[9px] text-stone-400">
                                    +{app.candidateSkills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {app.candidateResume && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (app.candidateResume?.dataUrl) {
                                      openBase64Pdf(app.candidateResume.dataUrl);
                                    } else {
                                      alert("This is a demo resume file. Real downloads are disabled in this mockup.");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 hover:underline"
                                >
                                  📄 {app.candidateResume.name}
                                  <span className="text-stone-400">
                                    ({formatFileSize(app.candidateResume.size)})
                                  </span>
                                </button>
                              </div>
                            )}

                            <div className="mt-3">
                              <select
                                value={app.status}
                                onChange={(e) =>
                                  updateApplication(app.id, e.target.value as ApplicationStatus)
                                }
                                className={`w-full rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition-all focus:ring-2 focus:ring-emerald-500/20 ${statusStyle[app.status]}`}
                              >
                                {statuses.map(s => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="mt-2">
                              <textarea
                                placeholder="Add private note..."
                                value={app.recruiterNote || ''}
                                onChange={(e) => addRecruiterNote(app.id, e.target.value)}
                                className="w-full resize-none rounded-lg border border-stone-200 bg-stone-50/50 p-1.5 text-xs text-stone-700 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-stone-300"
                                rows={2}
                              />
                            </div>

                            <div className="mt-2 text-[10px] text-stone-400">
                              Applied {formatDate(app.appliedAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-navy-950">Your Job Postings</h2>
                <p className="text-sm text-stone-500">
                  {recruiterJobs.length} active {recruiterJobs.length === 1 ? 'position' : 'positions'}
                </p>
              </div>
              <button
                onClick={() => setIsPosting(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <span>+</span> Post a Job
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recruiterJobs.map(job => (
                <div
                  key={job.id}
                  className="group rounded-2xl border border-stone-200/80 bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-indiaGreen-300 flex flex-col justify-between"
                >
                  <div className="flex gap-4 mb-4 items-start">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105"
                      style={{ backgroundColor: job.accent }}
                    >
                      {job.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-navy-950 line-clamp-1">{job.title}</h3>
                      <p className="text-xs text-stone-500 line-clamp-1">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold text-stone-600 mb-5">
                    <span className="rounded-lg border border-stone-200/60 bg-stone-50/80 px-2 py-1">{job.location}</span>
                    <span className="rounded-lg border border-stone-200/60 bg-stone-50/80 px-2 py-1">{job.workMode}</span>
                    <span className="rounded-lg border border-stone-200/60 bg-stone-50/80 px-2 py-1">{job.jobType}</span>
                    <span className="rounded-lg border border-stone-200/60 bg-stone-50/80 px-2 py-1">{job.experience}</span>
                  </div>
                  <div className="border-t border-stone-200/60 pt-3 text-xs text-stone-500 flex justify-between items-center">
                    <span>
                      {recruiterApplications.filter(a => a.jobId === job.id).length} Applicants
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="font-semibold text-emerald-700 hover:underline transition-colors"
                    >
                      View Live ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {recruiterJobs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/50 backdrop-blur-sm p-12 text-center">
                <p className="text-lg font-semibold text-stone-500">No job postings yet</p>
                <p className="mt-1 text-sm text-stone-400">
                  Click the &quot;Post a Job&quot; button to create your first job listing.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Post Job Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/50 backdrop-blur-sm p-4 sm:p-6 flex justify-center items-start">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden mt-10 mb-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center border-b border-stone-200/60 px-6 py-4 bg-gradient-to-r from-emerald-50/50 to-white">
              <div>
                <h2 className="text-xl font-semibold text-ink">Post a New Job</h2>
                <p className="text-sm text-stone-500">Fill in the details to create a new job listing.</p>
              </div>
              <button
                onClick={() => setIsPosting(false)}
                className="text-stone-400 hover:text-stone-600 text-2xl font-light transition-colors hover:rotate-90 duration-200"
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePostJob} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Job Title *</span>
                  <input
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Senior Product Designer"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Company *</span>
                  <input
                    required
                    value={user?.companyName || ''}
                    readOnly
                    aria-label="Company tied to your recruiter account"
                    className="mt-1 block w-full rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Location *</span>
                  <input
                    required
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. San Francisco, CA"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Salary Range *</span>
                  <input
                    required
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    placeholder="e.g. $120k - $150k"
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Work Mode</span>
                  <select
                    value={workMode}
                    onChange={e => setWorkMode(e.target.value as WorkMode)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>On-site</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Job Type</span>
                  <select
                    value={jobType}
                    onChange={e => setJobType(e.target.value as JobType)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-stone-700">Experience Level</span>
                  <select
                    value={experience}
                    onChange={e => setExperience(e.target.value as Experience)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option>Entry level</option>
                    <option>Mid level</option>
                    <option>Senior level</option>
                    <option>Lead</option>
                  </select>
                </label>
                <div className="block sm:col-span-2">
                  <div className="border-b border-stone-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-[.1em] text-emerald-800">👔 Hiring Manager Details (Optional)</span>
                  </div>
                </div>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">HR Contact Name</span>
                  <input
                    value={hrName}
                    onChange={e => setHrName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Sarah Connor"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">HR Contact Email</span>
                  <input
                    type="text"
                    value={hrEmail}
                    onChange={e => {
                      setHrEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all focus:ring-2 ${
                      emailError
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                    placeholder="e.g. sarah@company.com"
                  />
                  {emailError && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{emailError}</p>
                  )}
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-stone-700">HR Designation / Team Label</span>
                  <input
                    value={hrDesignation}
                    onChange={e => setHrDesignation(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="e.g. Lead Talent Partner / Tech Recruiter"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Skills (comma separated) *</span>
                <input
                  required
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="React, TypeScript, Node.js"
                  className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Short Summary *</span>
                <textarea
                  required
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="mt-1 block w-full h-16 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Brief summary of the role..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">Full Description *</span>
                <textarea
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="mt-1 block w-full h-24 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Detailed description of the role..."
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Responsibilities (one per line) *</span>
                  <textarea
                    required
                    value={responsibilities}
                    onChange={e => setResponsibilities(e.target.value)}
                    className="mt-1 block w-full h-32 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Lead product design initiatives..."
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Requirements (one per line) *</span>
                  <textarea
                    required
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    className="mt-1 block w-full h-32 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="5+ years of experience..."
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200/60 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPosting(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  Post Job Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAppForEmail && (
        <EmailComposer
          applicationId={selectedAppForEmail.id}
          recipientName={selectedAppForEmail.candidateName || 'Candidate'}
          recipientEmail={selectedAppForEmail.candidateEmail || ''}
          recipientRole="candidate"
          defaultSubject={`Regarding your application for ${recruiterJobs.find(j => j.id === selectedAppForEmail.jobId)?.title || 'Role'}`}
          defaultBody={`Hi ${selectedAppForEmail.candidateName || 'Candidate'},\n\nThis is regarding your application for the position of ${recruiterJobs.find(j => j.id === selectedAppForEmail.jobId)?.title || 'Role'} at ${recruiterJobs.find(j => j.id === selectedAppForEmail.jobId)?.company || 'our company'}.\n\n`}
          isOpen={isEmailComposerOpen}
          onClose={() => setIsEmailComposerOpen(false)}
        />
      )}
    </main>
  );
}

export default function RecruiterPage() {
  return (
    <RoleGuard allowedRoles={['recruiter']}>
      <RecruiterContent />
    </RoleGuard>
  );
}
