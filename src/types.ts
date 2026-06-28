export type EntryType = 'diary' | 'journal';

export interface Entry {
  id: string;
  type: EntryType;
  title: string;
  content: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  images: string[];   // base64 data URLs
  drawings: string[]; // base64 canvas snapshots
}
