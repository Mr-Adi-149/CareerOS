'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const SavedContext = createContext<{ saved: string[]; toggle: (id: string) => void }>({ saved: [], toggle: () => undefined });
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => { const stored = localStorage.getItem('talentlane-saved'); if (stored) setSaved(JSON.parse(stored)); }, []);
  const toggle = (id: string) => setSaved((current) => { const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]; localStorage.setItem('talentlane-saved', JSON.stringify(next)); return next; });
  return <SavedContext.Provider value={{ saved, toggle }}>{children}</SavedContext.Provider>;
}
export const useSaved = () => useContext(SavedContext);
