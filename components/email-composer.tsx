'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCareer } from '@/lib/state';

interface EmailComposerProps {
  applicationId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: 'hr' | 'candidate';
  defaultSubject: string;
  defaultBody: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EmailComposer({
  applicationId,
  recipientName,
  recipientEmail,
  recipientRole,
  defaultSubject,
  defaultBody,
  isOpen,
  onClose,
}: EmailComposerProps) {
  const { sendMockEmail } = useCareer();
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject);
      setBody(defaultBody);
      setIsSent(false);
      setIsSending(false);
      setCopied(false);
    }
  }, [isOpen, defaultSubject, defaultBody]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(recipientEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    // Simulate sending email
    await new Promise((resolve) => setTimeout(resolve, 800));

    sendMockEmail(applicationId, subject, body, recipientRole);
    setIsSending(false);
    setIsSent(true);

    // Close modal after success animation
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-[#fbfcfa] shadow-2xl animate-in zoom-in-95 duration-200">
        {isSent ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-800 animate-bounce">
              ✓
            </div>
            <h3 className="mt-6 text-xl font-bold tracking-tight text-ink">Email Dispatched!</h3>
            <p className="mt-2 text-sm text-stone-500">
              The communication has been logged in the application activity history.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col">
            <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50/50 to-white">
              <div>
                <h3 className="text-base font-bold text-ink">Compose Message</h3>
                <p className="text-xs text-stone-500">
                  {recipientRole === 'hr' ? 'Contacting HR Contact / Hiring Manager' : 'Contacting Candidate'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="text-stone-400 hover:text-stone-600 text-2xl font-light outline-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-[60px_1fr] items-start text-sm border-b border-stone-100 pb-3">
                <span className="font-semibold text-stone-500 mt-0.5">To:</span>
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-ink bg-stone-100 px-2 py-0.5 rounded-md justify-self-start self-start text-xs">
                    {recipientName} ({recipientEmail})
                  </span>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="flex flex-wrap items-center gap-2 pb-2 text-[11px] font-semibold text-stone-500 border-b border-stone-100">
                <span>Quick Tools:</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="focus-ring px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Email'}
                </button>
                <a
                  href={mailtoUrl}
                  className="focus-ring px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition flex items-center gap-1"
                >
                  ✉ Open in Mail App
                </a>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-stone-500">Subject</span>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm outline-none transition focus:border-green-700 focus:bg-white"
                  placeholder="Subject"
                  disabled={isSending}
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-stone-500">Message</span>
                <textarea
                  required
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-green-700 focus:bg-white"
                  placeholder="Compose your message here..."
                  disabled={isSending}
                />
              </label>
            </div>

            <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 rounded-lg bg-green-800 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-green-900 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </>
                ) : (
                  'Send via CareerOS'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
