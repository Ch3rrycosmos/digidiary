import { useState, useMemo } from 'react';
import { useEntries } from './useEntries';
import Editor from './Editor';
import EntryView from './EntryView';
import type { Entry, EntryType } from './types';
import './index.css';

type View = 'all' | 'diary' | 'journal';

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function App() {
  const { entries, addEntry, updateEntry, deleteEntry } = useEntries();
  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<EntryType>('diary');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = entries;
    if (view !== 'all') list = list.filter(e => e.type === view);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, view, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Entry[]> = {};
    for (const e of filtered) {
      const key = formatDate(e.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }
    return groups;
  }, [filtered]);

  const diaryCount = entries.filter(e => e.type === 'diary').length;
  const journalCount = entries.filter(e => e.type === 'journal').length;
  const totalWords = entries.reduce((acc, e) => acc + e.content.trim().split(/\s+/).filter(Boolean).length, 0);

  function openNew(type: EntryType) {
    setEditorType(type);
    setEditingEntry(null);
    setEditorOpen(true);
    setSidebarOpen(false);
  }

  function openEdit(entry: Entry) {
    setEditorType(entry.type);
    setEditingEntry(entry);
    setEditorOpen(true);
    setViewingEntry(null);
  }

  const viewTitle = view === 'all' ? 'All Entries' : view === 'diary' ? 'Diary' : 'Journal';

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>digi<br />diary</h1>
          <div><span>your digital space</span></div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Views</div>

          {(['all', 'diary', 'journal'] as View[]).map(v => (
            <button
              key={v}
              className={`nav-item ${view === v ? 'active' : ''}`}
              onClick={() => { setView(v); setSidebarOpen(false); }}
            >
              <span className="nav-icon">
                {v === 'all' ? '🗂️' : v === 'diary' ? '📖' : '📓'}
              </span>
              {v === 'all' ? 'All Entries' : v === 'diary' ? 'Diary' : 'Journal'}
              <span className="nav-count">
                {v === 'all' ? entries.length : v === 'diary' ? diaryCount : journalCount}
              </span>
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Write</div>

          <button className="nav-item" onClick={() => openNew('diary')}>
            <span className="nav-icon">✏️</span>
            New Diary Entry
          </button>

          <button className="nav-item" onClick={() => openNew('journal')}>
            <span className="nav-icon">💡</span>
            New Journal Entry
          </button>
        </nav>

        <div className="sidebar-footer">
          made with ♥ for you
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-value">{entries.length}</div>
            <div className="stat-label">Entries</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{diaryCount}</div>
            <div className="stat-label">Diary</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{journalCount}</div>
            <div className="stat-label">Journal</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{totalWords > 999 ? `${(totalWords/1000).toFixed(1)}k` : totalWords}</div>
            <div className="stat-label">Words</div>
          </div>
        </div>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '8px 10px', display: 'none' }}
              id="menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="topbar-title">{viewTitle}</div>
          </div>

          <div className="topbar-right">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Search entries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-tabs">
              <button
                className={`filter-tab ${view === 'all' ? 'active' : ''}`}
                onClick={() => setView('all')}
              >All</button>
              <button
                className={`filter-tab ${view === 'diary' ? 'active' : ''}`}
                onClick={() => setView('diary')}
              >Diary</button>
              <button
                className={`filter-tab ${view === 'journal' ? 'active' : ''}`}
                onClick={() => setView('journal')}
              >Journal</button>
            </div>

            <button className="btn btn-pink" onClick={() => openNew('diary')}>
              + Diary
            </button>
            <button className="btn btn-blue" onClick={() => openNew('journal')}>
              + Journal
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">{view === 'journal' ? '📓' : '📖'}</div>
              <h2>{search ? 'No results found' : `No ${view === 'all' ? '' : view} entries yet`}</h2>
              <p>
                {search
                  ? 'Try different keywords'
                  : 'Start writing your first entry. This is your space — no rules, no judgement.'}
              </p>
              {!search && (
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button className="btn btn-pink" onClick={() => openNew('diary')}>+ New Diary</button>
                  <button className="btn btn-blue" onClick={() => openNew('journal')}>+ New Journal</button>
                </div>
              )}
            </div>
          ) : (
            Object.entries(grouped).map(([date, dayEntries]) => (
              <div key={date} className="date-group">
                <div className="date-group-label">{date}</div>
                <div className="entry-grid">
                  {dayEntries.map(entry => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      onClick={() => setViewingEntry(entry)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Editor */}
      {editorOpen && (
        <Editor
          type={editorType}
          entry={editingEntry}
          onSave={addEntry}
          onUpdate={updateEntry}
          onClose={() => { setEditorOpen(false); setEditingEntry(null); }}
        />
      )}

      {/* Viewer */}
      {viewingEntry && (
        <EntryView
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
          onEdit={() => openEdit(viewingEntry)}
          onDelete={() => deleteEntry(viewingEntry.id)}
        />
      )}
    </div>
  );
}

function EntryCard({ entry, onClick }: { entry: Entry; onClick: () => void }) {
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;
  const preview = entry.content.slice(0, 160);

  return (
    <div className="entry-card" onClick={onClick}>
      <div className={`entry-card-accent ${entry.type}`} />
      <div className="entry-card-body">
        <div className="entry-card-header">
          <div className="entry-card-title">{entry.title}</div>
          <div className="entry-card-date">{shortDate(entry.createdAt)}</div>
        </div>
        {entry.content && (
          <div className="entry-card-preview">{preview}{entry.content.length > 160 ? '…' : ''}</div>
        )}
      </div>
      <div className="entry-card-footer">
        <span className={`tag tag-${entry.type}`}>
          {entry.type === 'diary' ? '📖' : '📓'} {entry.type}
        </span>
        {entry.mood && <span className="entry-card-mood">{entry.mood}</span>}
        {(entry.images?.length ?? 0) > 0 && (
          <span title={`${entry.images.length} photo${entry.images.length > 1 ? 's' : ''}`} style={{ fontSize: 13 }}>📎{entry.images.length}</span>
        )}
        {(entry.drawings?.length ?? 0) > 0 && (
          <span title={`${entry.drawings.length} doodle${entry.drawings.length > 1 ? 's' : ''}`} style={{ fontSize: 13 }}>🎨{entry.drawings.length}</span>
        )}
        <span className="entry-card-words">{wordCount}w</span>
      </div>
    </div>
  );
}
