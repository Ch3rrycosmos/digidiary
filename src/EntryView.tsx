import type { Entry } from './types';

interface Props {
  entry: Entry;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function EntryView({ entry, onClose, onEdit, onDelete }: Props) {
  const wordCount = entry.content.trim().split(/\s+/).filter(Boolean).length;

  function confirmDelete() {
    if (window.confirm('Delete this entry? This cannot be undone.')) {
      onDelete();
      onClose();
    }
  }

  return (
    <div className="view-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="view-panel">
        <div className={`view-accent ${entry.type}`} />

        <div className="view-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`tag tag-${entry.type}`}>
              {entry.type === 'diary' ? '📖 Diary' : '📓 Journal'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onEdit}>✏️ Edit</button>
            <button className="btn btn-red" onClick={confirmDelete}>Delete</button>
            <button className="btn btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="view-body">
          <div className="view-meta">
            {entry.mood && <span className="view-mood">{entry.mood}</span>}
            <span className="view-date">{formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}</span>
            <span className="view-date" style={{ marginLeft: 'auto' }}>{wordCount} words</span>
          </div>

          <h1 className="view-title">{entry.title}</h1>

          <div className="view-content">{entry.content || <em style={{ opacity: 0.4 }}>No content yet.</em>}</div>

          {/* Images */}
          {(entry.images?.length ?? 0) > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1, opacity: 0.45, marginBottom: 12,
                fontFamily: 'var(--mono)',
              }}>Photos</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {entry.images.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img
                      src={src} alt=""
                      style={{
                        width: 180, height: 130, objectFit: 'cover',
                        border: 'var(--border)', borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow)', display: 'block',
                        transition: 'transform 0.1s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.transform = 'rotate(-1deg) scale(1.02)')}
                      onMouseOut={e => (e.currentTarget.style.transform = '')}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Drawings */}
          {(entry.drawings?.length ?? 0) > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: 1, opacity: 0.45, marginBottom: 12,
                fontFamily: 'var(--mono)',
              }}>Doodles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {entry.drawings.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img
                      src={src} alt="doodle"
                      style={{
                        maxWidth: '100%', width: 280,
                        border: 'var(--border)', borderRadius: 'var(--radius)',
                        boxShadow: 'var(--shadow)', display: 'block', background: '#fafaf8',
                        transition: 'transform 0.15s',
                      }}
                      onMouseOver={e => (e.currentTarget.style.transform = 'rotate(1deg) scale(1.01)')}
                      onMouseOut={e => (e.currentTarget.style.transform = '')}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
