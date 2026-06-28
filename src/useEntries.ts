import { useState, useEffect } from 'react';
import type { Entry } from './types';

const STORAGE_KEY = 'digi-diary-entries';

const SAMPLE: Entry[] = [
  {
    id: '1',
    type: 'diary',
    title: 'First day of June',
    content: 'Today was unexpectedly wonderful. Woke up early, made coffee, and sat by the window watching the rain. There\'s something deeply calming about grey mornings.\n\nWent for a walk later — the streets smelled like petrichor and someone was playing guitar on a balcony. Life felt very cinematic for a moment.',
    mood: '🌧️',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: [], images: [], drawings: [],
  },
  {
    id: '2',
    type: 'journal',
    title: 'Reflections on consistency',
    content: 'I\'ve been thinking about why it\'s so hard to maintain habits. Not the motivation part — I actually feel motivated most days. It\'s the transition moments. The getting started.\n\nMaybe the solution isn\'t discipline but design. Reduce friction. Make the good thing the easy thing.\n\nNote to self: put the journal on the desk, not in the drawer.',
    mood: '🧠',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    tags: [], images: [], drawings: [],
  },
];

function load(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE;
    return JSON.parse(raw);
  } catch {
    return SAMPLE;
  }
}

function save(entries: Entry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>(load);

  useEffect(() => {
    save(entries);
  }, [entries]);

  function addEntry(data: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const entry: Entry = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setEntries(prev => [entry, ...prev]);
    return entry;
  }

  function updateEntry(id: string, data: Partial<Entry>) {
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e)
    );
  }

  function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  return { entries, addEntry, updateEntry, deleteEntry };
}
