'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Application, ApplicationStatus, CandidateProfile, Job } from './types';
import { jobs as initialJobs } from './jobs';
import { useAuth } from './auth-context';

const PROFILE_KEY = 'careeros-profile-v1';
const APPLICATIONS_KEY = 'careeros-applications-v1';
const JOBS_KEY = 'careeros-jobs-v1';

type NewJob = Omit<Job, 'company' | 'recruiterId'>;

const defaultProfile: CandidateProfile = {
  fullName: '',
  email: '',
  bio: '',
  skills: [],
  certifications: [],
  projects: [],
};

const statusMessages: Record<ApplicationStatus, string> = {
  Applied: 'Application submitted',
  'Under Review': 'Your application is under review',
  Interview: 'Interview stage reached',
  Offer: 'Offer received',
  Rejected: 'Application closed',
};

type CareerState = {
  profile: CandidateProfile;
  applications: Application[];
  jobs: Job[];
  hydrated: boolean;
  completeness: number;
  isTransitioning: boolean;
  saveProfile: (profile: CandidateProfile) => void;
  applyToJob: (jobId: string, note?: string) => void;
  updateApplication: (id: string, status: ApplicationStatus) => void;
  withdrawApplication: (id: string) => void;
  postJob: (job: NewJob) => void;
  addRecruiterNote: (id: string, note: string) => void;
  userRole: 'candidate' | 'recruiter' | null;
  setUserRole: (role: 'candidate' | 'recruiter' | null) => void;
  setFollowupReminder: (id: string, interval: '3days' | '1week' | 'custom' | null, customDate?: string | null) => void;
  logFollowupSent: (id: string) => void;
  sendMockEmail: (applicationId: string, subject: string, body: string, recipientRole: 'hr' | 'candidate') => void;
};

const Context = createContext<CareerState | undefined>(undefined);

export function calculateCompleteness(profile: CandidateProfile) {
  const filled = [
    profile.fullName.trim(),
    profile.email.trim(),
    profile.bio.trim(),
    Boolean(profile.resume),
    profile.skills.length > 0,
    profile.certifications.length > 0,
    profile.projects.length > 0,
  ].filter(Boolean).length;
  return Math.min(100, Math.round((filled / 7) * 100));
}

export function calculateMatchScore(profile: CandidateProfile, job: Job): { score: number; reasons: string[] } {
  if (!profile.fullName && profile.skills.length === 0 && !profile.bio) {
    return {
      score: 0,
      reasons: ['Please complete your candidate profile to see live AI insights.'],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  // 1. Skills (worth 60 points)
  const jobSkills = job.skills.map(s => s.toLowerCase());
  const profileSkills = profile.skills.map(s => s.toLowerCase());

  if (jobSkills.length > 0) {
    const matchingSkills = jobSkills.filter(s => profileSkills.includes(s));
    const skillScore = Math.round((matchingSkills.length / jobSkills.length) * 60);
    score += skillScore;
    if (matchingSkills.length > 0) {
      reasons.push(`Matches skills: ${matchingSkills.map(s => job.skills.find(js => js.toLowerCase() === s)).join(', ')}`);
    }
    const missingSkills = job.skills.filter(js => !profileSkills.includes(js.toLowerCase()));
    if (missingSkills.length > 0) {
      reasons.push(`Missing skills: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}`);
    }
  } else {
    score += 60;
  }

  // 2. Experience level (worth 20 points)
  let expScore = 10;
  if (profile.projects.length > 0) expScore += 5;
  if (profile.certifications.length > 0) expScore += 5;
  score += expScore;
  reasons.push(`Experience level matches the ${job.experience} requirements.`);

  // 3. Work Mode preference matching (worth 20 points)
  const bioLower = profile.bio.toLowerCase();
  const prefersOnSite = bioLower.includes('on-site') || bioLower.includes('office') || bioLower.includes('on site');
  if (job.workMode === 'On-site') {
    if (prefersOnSite) {
      score += 20;
      reasons.push('Matches on-site preference.');
    } else {
      score += 10;
      reasons.push('On-site requirement (candidate profile defaults to remote/hybrid).');
    }
  } else {
    score += 20;
    reasons.push(`Matches ${job.workMode} flexibility.`);
  }

  score = Math.min(100, Math.max(0, score));
  return { score, reasons };
}

export function CareerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile>(defaultProfile);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [hydrated, setHydrated] = useState(false);
  const [isTransitioning] = useState(false);
  const userRole = user?.role ?? null;

  // Handle storage events for multi-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${PROFILE_KEY}-${user?.id}` && e.newValue) {
        try {
          const saved = JSON.parse(e.newValue) as CandidateProfile;
          setProfile({ ...defaultProfile, ...saved, fullName: saved.fullName || user?.username || '', email: user?.email || '' });
        } catch (error) {
          console.error('Failed to parse profile from storage event:', error);
        }
      }
      if (e.key === APPLICATIONS_KEY && e.newValue) {
        try {
          setApplications(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse applications from storage event:', error);
        }
      }
      if (e.key === JOBS_KEY && e.newValue) {
        try {
          const parsedJobs = JSON.parse(e.newValue);
          const mergedJobs = [...initialJobs];
          for (const pj of parsedJobs) {
            if (!mergedJobs.some(j => j.id === pj.id)) mergedJobs.push(pj);
          }
          setJobs(mergedJobs);
        } catch (error) {
          console.error('Failed to parse jobs from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Initial hydration
  useEffect(() => {
    try {
      const savedApplications = localStorage.getItem(APPLICATIONS_KEY);
      const savedJobs = localStorage.getItem(JOBS_KEY);

      // Load or seed mock applications
      if (savedApplications) {
        setApplications(JSON.parse(savedApplications));
      } else {
        // Create mock applications for existing jobs
        const mockApps: Application[] = [
          {
            id: crypto.randomUUID(),
            jobId: initialJobs[0]?.id || 'product-designer',
            status: 'Applied',
            appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
              {
                id: crypto.randomUUID(),
                label: 'Application submitted',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isMock: true,
            candidateName: 'Ananya Iyer',
            candidateEmail: 'ananya.iyer@example.com',
            candidateSkills: ['Figma', 'Prototyping', 'User Research', 'UI Design'],
            candidateCompleteness: 80,
            candidateResume: {
              name: 'ananya_iyer_resume.pdf',
              size: 102400,
              uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            recruiterNote: 'Strong portfolio, scheduled screening call.',
          },
          {
            id: crypto.randomUUID(),
            jobId: initialJobs[0]?.id || 'product-designer',
            status: 'Under Review',
            appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
              {
                id: crypto.randomUUID(),
                label: 'Application submitted',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Application under review',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isMock: true,
            candidateName: 'Rohan Gupta',
            candidateEmail: 'rohan.gupta@example.com',
            candidateSkills: ['Sketch', 'Figma', 'UI Design', 'Design Systems'],
            candidateCompleteness: 100,
            candidateResume: {
              name: 'rohan_gupta_resume.pdf',
              size: 204800,
              uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          {
            id: crypto.randomUUID(),
            jobId: initialJobs[1]?.id || 'frontend-engineer',
            status: 'Interview',
            appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
              {
                id: crypto.randomUUID(),
                label: 'Application submitted',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Application under review',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Interview stage reached',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isMock: true,
            candidateName: 'Sneha Patel',
            candidateEmail: 'sneha.patel@example.com',
            candidateSkills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Node.js'],
            candidateCompleteness: 100,
            candidateResume: {
              name: 'sneha_patel_resume.pdf',
              size: 153600,
              uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            recruiterNote: 'Excellent technical skills, moving to final round.',
          },
          {
            id: crypto.randomUUID(),
            jobId: initialJobs[1]?.id || 'frontend-engineer',
            status: 'Offer',
            appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
              {
                id: crypto.randomUUID(),
                label: 'Application submitted',
                date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Application under review',
                date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Interview stage reached',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Offer received',
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isMock: true,
            candidateName: 'Arjun Mehta',
            candidateEmail: 'arjun.mehta@example.com',
            candidateSkills: ['React', 'Angular', 'TypeScript', 'Redux', 'GraphQL'],
            candidateCompleteness: 95,
            candidateResume: {
              name: 'arjun_mehta_resume.pdf',
              size: 178000,
              uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
          },
          {
            id: crypto.randomUUID(),
            jobId: initialJobs[2]?.id || 'backend-engineer',
            status: 'Rejected',
            appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            events: [
              {
                id: crypto.randomUUID(),
                label: 'Application submitted',
                date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: crypto.randomUUID(),
                label: 'Application closed',
                date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            isMock: true,
            candidateName: 'Priya Sharma',
            candidateEmail: 'priya.sharma@example.com',
            candidateSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS'],
            candidateCompleteness: 75,
            recruiterNote: 'Good technical skills but lacks cloud experience.',
          },
        ];
        setApplications(mockApps);
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(mockApps));
      }

      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs);
        const mergedJobs = [...initialJobs];
        for (const pj of parsedJobs) {
          if (!mergedJobs.some(j => j.id === pj.id)) mergedJobs.push(pj);
        }
        setJobs(mergedJobs);
      }
    } catch (error) {
      console.error('Error during hydration:', error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Candidate profile data is account-scoped. Auth identity always wins for email,
  // while the username supplies a useful first-visit default for the resume name.
  useEffect(() => {
    if (user?.role !== 'candidate') return;

    try {
      const savedProfile = localStorage.getItem(`${PROFILE_KEY}-${user.id}`);
      const saved = savedProfile ? JSON.parse(savedProfile) as Partial<CandidateProfile> : {};
      const nextProfile: CandidateProfile = {
        ...defaultProfile,
        ...saved,
        fullName: saved.fullName?.trim() || user.username,
        email: user.email,
      };
      setProfile(nextProfile);
      localStorage.setItem(`${PROFILE_KEY}-${user.id}`, JSON.stringify(nextProfile));
    } catch (error) {
      console.error('Failed to load candidate profile:', error);
      setProfile({ ...defaultProfile, fullName: user.username, email: user.email });
    }
  }, [user]);

  const persistProfile = useCallback((next: CandidateProfile) => {
    if (user?.role !== 'candidate') return;
    const accountProfile: CandidateProfile = {
      ...next,
      fullName: next.fullName.trim() || user.username,
      email: user.email,
    };
    setProfile(accountProfile);
    localStorage.setItem(`${PROFILE_KEY}-${user.id}`, JSON.stringify(accountProfile));
  }, [user]);

  const persistApplications = useCallback((next: Application[]) => {
    setApplications(next);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
  }, []);

  const persistJobs = useCallback((next: Job[]) => {
    setJobs(next);
    localStorage.setItem(JOBS_KEY, JSON.stringify(next.filter(j => !initialJobs.some(ij => ij.id === j.id))));
  }, []);

  const applyToJob = useCallback(
    (jobId: string, note?: string) => {
      if (user?.role !== 'candidate') return;
      if (applications.some(application => application.jobId === jobId && application.candidateEmail === user.email)) return;

      const now = new Date().toISOString();
      const newApplication: Application = {
        id: crypto.randomUUID(),
        jobId,
        status: 'Applied',
        appliedAt: now,
        note,
        events: [{ id: crypto.randomUUID(), label: 'Application submitted', date: now }],
        isMock: false,
        candidateId: user.id,
        candidateName: user.username,
        candidateEmail: user.email,
        candidateSkills: profile.skills,
        candidateResume: profile.resume,
        candidateCompleteness: calculateCompleteness(profile),
      };

      persistApplications([newApplication, ...applications]);
    },
    [applications, persistApplications, profile, user]
  );

  const updateApplication = useCallback(
    (id: string, status: ApplicationStatus) => {
      const application = applications.find((item) => item.id === id);
      if (!application) return;
      if (user?.role === 'recruiter' && !jobs.some((job) => job.id === application.jobId && job.recruiterId === user.id)) return;

      const now = new Date().toISOString();
      persistApplications(
        applications.map(application =>
          application.id === id
            ? {
              ...application,
              status,
              events: [
                ...application.events,
                { id: crypto.randomUUID(), label: statusMessages[status], date: now },
              ],
            }
            : application
        )
      );
    },
    [applications, jobs, persistApplications, user]
  );

  const withdrawApplication = useCallback(
    (id: string) => updateApplication(id, 'Rejected'),
    [updateApplication]
  );

  const postJob = useCallback(
    (job: NewJob) => {
      if (user?.role !== 'recruiter' || !user.companyName) return;
      const ownedJob: Job = {
        ...job,
        recruiterId: user.id,
        company: user.companyName,
      };
      const updatedJobs = [ownedJob, ...jobs];
      persistJobs(updatedJobs);
    },
    [jobs, persistJobs, user]
  );

  const addRecruiterNote = useCallback(
    (id: string, note: string) => {
      const application = applications.find((item) => item.id === id);
      if (!application || user?.role !== 'recruiter') return;
      if (!jobs.some((job) => job.id === application.jobId && job.recruiterId === user.id)) return;

      persistApplications(
        applications.map(app => (app.id === id ? { ...app, recruiterNote: note } : app))
      );
    },
    [applications, jobs, persistApplications, user]
  );

  // Kept as a compatibility shim for existing feature components. Roles are session-owned by AuthProvider.
  const setUserRole = useCallback((role: 'candidate' | 'recruiter' | null) => { void role; }, []);

  const setFollowupReminder = useCallback(
    (id: string, interval: '3days' | '1week' | 'custom' | null, customDate?: string | null) => {
      persistApplications(
        applications.map(app => {
          if (app.id !== id) return app;

          let reminderDate: string | null = null;
          if (interval === '3days') {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            reminderDate = d.toISOString();
          } else if (interval === '1week') {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            reminderDate = d.toISOString();
          } else if (interval === 'custom' && customDate) {
            reminderDate = new Date(customDate).toISOString();
          }

          return {
            ...app,
            followupReminder: interval,
            followupReminderDate: reminderDate,
            lastFollowupAt: interval ? app.lastFollowupAt || new Date().toISOString() : null,
          };
        })
      );
    },
    [applications, persistApplications]
  );

  const logFollowupSent = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      persistApplications(
        applications.map(app => {
          if (app.id !== id) return app;

          let nextReminderDate: string | null = null;
          let nextReminderType = app.followupReminder;

          if (app.followupReminder === '3days') {
            const d = new Date();
            d.setDate(d.getDate() + 3);
            nextReminderDate = d.toISOString();
          } else if (app.followupReminder === '1week') {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            nextReminderDate = d.toISOString();
          } else {
            nextReminderType = null;
            nextReminderDate = null;
          }

          return {
            ...app,
            lastFollowupAt: now,
            followupReminder: nextReminderType,
            followupReminderDate: nextReminderDate,
            events: [
              ...app.events,
              { id: crypto.randomUUID(), label: 'Follow-up email sent to HR', date: now },
            ],
          };
        })
      );
    },
    [applications, persistApplications]
  );

  const sendMockEmail = useCallback(
    (applicationId: string, subject: string, body: string, recipientRole: 'hr' | 'candidate') => {
      const now = new Date().toISOString();
      persistApplications(
        applications.map(app => {
          if (app.id !== applicationId) return app;
          
          const label = recipientRole === 'hr'
            ? `Sent email to HR: "${subject}"`
            : `Sent email to Candidate: "${subject}"`;
            
          const updatedEvents = [
            ...app.events,
            { id: crypto.randomUUID(), label, date: now }
          ];

          let nextReminderDate = app.followupReminderDate;
          let nextReminderType = app.followupReminder;

          if (recipientRole === 'hr') {
            if (app.followupReminder === '3days') {
              const d = new Date();
              d.setDate(d.getDate() + 3);
              nextReminderDate = d.toISOString();
            } else if (app.followupReminder === '1week') {
              const d = new Date();
              d.setDate(d.getDate() + 7);
              nextReminderDate = d.toISOString();
            } else if (app.followupReminder === 'custom') {
              nextReminderType = null;
              nextReminderDate = null;
            }
          }

          return {
            ...app,
            lastFollowupAt: recipientRole === 'hr' ? now : app.lastFollowupAt,
            followupReminder: nextReminderType,
            followupReminderDate: nextReminderDate,
            events: updatedEvents
          };
        })
      );
    },
    [applications, persistApplications]
  );

  const value = useMemo(
    () => ({
      profile,
      applications,
      jobs,
      hydrated,
      completeness: calculateCompleteness(profile),
      isTransitioning,
      saveProfile: persistProfile,
      applyToJob,
      updateApplication,
      withdrawApplication,
      postJob,
      addRecruiterNote,
      userRole,
      setUserRole,
      setFollowupReminder,
      logFollowupSent,
      sendMockEmail,
    }),
    [
      profile,
      applications,
      jobs,
      hydrated,
      isTransitioning,
      persistProfile,
      applyToJob,
      updateApplication,
      withdrawApplication,
      postJob,
      addRecruiterNote,
      userRole,
      setUserRole,
      setFollowupReminder,
      logFollowupSent,
      sendMockEmail,
    ]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useCareer() {
  const context = useContext(Context);
  if (!context) throw new Error('useCareer must be used inside CareerProvider');
  return context;
}
