export type WorkMode = 'Remote' | 'Hybrid' | 'On-site';
export type JobType = 'Full-time' | 'Contract' | 'Part-time';
export type Experience = 'Entry level' | 'Mid level' | 'Senior level' | 'Lead';

export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  initials: string;
  accent: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  experience: Experience;
  salary: string;
  postedAt: string;
  featured?: boolean;
  skills: string[];
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  hrName?: string;
  hrEmail?: string;
  hrDesignation?: string;
}

export type ApplicationStatus = 'Applied' | 'Under Review' | 'Interview' | 'Offer' | 'Rejected';

export interface ApplicationEvent {
  id: string;
  label: string;
  date: string;
}

export interface CandidateResume {
  name: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
}

export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  events: ApplicationEvent[];
  note?: string;
  recruiterNote?: string;
  isMock?: boolean;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateSkills?: string[];
  candidateResume?: CandidateResume;
  candidateCompleteness?: number;
  followupReminder?: '3days' | '1week' | 'custom' | null;
  followupReminderDate?: string | null;
  lastFollowupAt?: string | null;
}

export interface CandidateProfile {
  fullName: string;
  email: string;
  bio: string;
  skills: string[];
  certifications: string[];
  projects: string[];
  resume?: CandidateResume;
}
