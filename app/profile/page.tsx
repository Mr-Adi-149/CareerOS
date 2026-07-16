'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { CandidateProfile } from '@/lib/types';
import { useCareer } from '@/lib/state';
import { useAuth } from '@/lib/auth-context';
import { RoleGuard } from '@/components/role-guard';

const splitTags = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

function ProfileContent() {
  const { profile, saveProfile, completeness, hydrated, userRole, setUserRole } = useCareer();
  const { user } = useAuth();
  const [draft, setDraft] = useState<CandidateProfile>(profile);
  const [saved, setSaved] = useState(false);

  // Local state for array fields to allow typing spaces and commas
  const [skillsInput, setSkillsInput] = useState(profile.skills.join(', '));
  const [certificationsInput, setCertificationsInput] = useState(profile.certifications.join(', '));
  const [projectsInput, setProjectsInput] = useState(profile.projects.join(', '));

  useEffect(() => {
    setDraft(profile);
    setSkillsInput(profile.skills.join(', '));
    setCertificationsInput(profile.certifications.join(', '));
    setProjectsInput(profile.projects.join(', '));
  }, [profile]);

  if (!hydrated) return <main className="shell py-12"><div className="h-96 animate-pulse rounded-2xl bg-stone-200" /></main>;

  if (userRole !== 'candidate') {
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white/70 backdrop-blur-md p-8 text-center shadow-lg">
          <div className="h-16 w-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Access Denied</h2>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            Candidate profiles are only accessible to job seekers. Recruiters do not have a candidate profile.
          </p>
          <button
            onClick={() => setUserRole(null)}
            className="mt-6 w-full focus-ring rounded-xl bg-green-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-900"
          >
            Switch Role
          </button>
        </div>
      </div>
    );
  }

  const update = (key: keyof CandidateProfile, value: string | string[] | CandidateProfile['resume']) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveProfile(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        update('resume', {
          name: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main>
      <section className="border-b border-stone-200 bg-[#edf3ec]">
        <div className="shell py-12 sm:py-16">
          <p className="eyebrow">Candidate identity</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] text-ink sm:text-5xl">Build a profile that opens doors.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">The details you add here power your candidate workspace and help you present your best self with every application.</p>
        </div>
      </section>
      <form onSubmit={submit} className="shell grid gap-6 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="glass-card rounded-2xl p-5 sm:p-7">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-[-.035em] text-ink">Profile details</h2>
              <p className="mt-1 text-sm text-stone-500">Keep it clear, current, and specific to the work you want.</p>
            </div>
            <div className="flex items-center gap-3">
              {saved && <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">Saved</span>}
            </div>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-stone-700">Full name
              <input value={draft.fullName} onChange={(event) => update('fullName', event.target.value)} required className="focus-ring mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-green-700 focus:bg-white" placeholder="Alex Morgan" />
            </label>
            <label className="text-sm font-semibold text-stone-700">Email <span className="font-normal text-stone-400">(account-linked)</span>
              <div className="relative mt-2">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-400">🔒</span>
                <input value={user?.email || draft.email} type="email" disabled className="w-full cursor-not-allowed rounded-lg border border-stone-200 bg-stone-100 py-2.5 pl-9 pr-3 text-sm font-normal text-stone-500 outline-none" />
              </div>
            </label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-stone-700">Professional bio
            <textarea value={draft.bio} onChange={(event) => update('bio', event.target.value)} className="focus-ring mt-2 min-h-32 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal leading-6 outline-none transition focus:border-green-700 focus:bg-white" placeholder="Tell hiring teams what you do best and the kind of impact you enjoy making." />
          </label>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-stone-700">Skills<span className="ml-1 font-normal text-stone-400">(comma separated)</span>
              <input value={skillsInput} onChange={(event) => { setSkillsInput(event.target.value); update('skills', splitTags(event.target.value)); }} className="focus-ring mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-green-700 focus:bg-white" placeholder="React, TypeScript, Product design" />
            </label>
            <label className="text-sm font-semibold text-stone-700">Certifications<span className="ml-1 font-normal text-stone-400">(comma separated)</span>
              <input value={certificationsInput} onChange={(event) => { setCertificationsInput(event.target.value); update('certifications', splitTags(event.target.value)); }} className="focus-ring mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-green-700 focus:bg-white" placeholder="AWS Cloud Practitioner" />
            </label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-stone-700">Projects<span className="ml-1 font-normal text-stone-400">(comma separated)</span>
            <input value={projectsInput} onChange={(event) => { setProjectsInput(event.target.value); update('projects', splitTags(event.target.value)); }} className="focus-ring mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-normal outline-none transition focus:border-green-700 focus:bg-white" placeholder="Portfolio refresh, Growth dashboard" />
          </label>
          <div className="mt-7 flex justify-end border-t border-stone-100 pt-5">
            <button className="focus-ring rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900">Save profile</button>
          </div>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="glass-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-ink">Profile completeness</p>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-4xl font-semibold tracking-[-.07em] text-ink">{completeness}%</p>
              <p className="text-xs font-medium text-stone-500">out of 100</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-gradient-to-r from-green-700 via-emerald-500 to-lime-400 transition-all duration-700" style={{ width: `${completeness}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-stone-500">Completeness is based on your bio, resume, skills, certifications, and projects.</p>
          </section>
          <section className="glass-card rounded-2xl p-5">
            <p className="text-sm font-semibold text-ink">Resume</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">Add a document to complete your candidate profile.</p>
            {draft.resume ?
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="truncate text-sm font-semibold text-green-900">{draft.resume.name}</p>
                <p className="mt-1 text-xs text-green-800">{Math.ceil(draft.resume.size / 1024)} KB · uploaded {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(draft.resume.uploadedAt))}</p>
                <button type="button" onClick={() => update('resume', undefined)} className="focus-ring mt-3 text-xs font-bold text-red-700 hover:underline">Remove resume</button>
              </div> :
              <label className="focus-ring mt-4 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-7 text-center transition hover:border-green-500 hover:bg-green-50">
                <span className="text-lg text-green-800">↑</span>
                <span className="mt-2 text-sm font-semibold text-ink">Upload your resume</span>
                <span className="mt-1 text-xs text-stone-500">PDF, DOCX, or TXT</span>
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={upload} className="sr-only" />
              </label>
            }
          </section>
        </aside>
      </form>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RoleGuard allowedRoles={['candidate']}>
      <ProfileContent />
    </RoleGuard>
  );
}
