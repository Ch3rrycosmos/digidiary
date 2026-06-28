import { useState, useEffect, useRef } from 'react';
import type { Entry, EntryType } from './types';
import DrawingCanvas from './DrawingCanvas';

const MOODS = ['😊', '😢', '😤', '😴', '🥰', '😰', '🤩', '🧠', '🌧️', '☀️', '🌙', '✨', '🔥', '💭', '🎉'];

interface Props {
  type: EntryType;
  entry?: Entry | null;
  onSave: (data: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, data: Partial<Entry>) => void;
  onClose: () => void;
}

export default function Editor({ type, entry, onSave, onUpdate, onClose }: Props) {
  const [title, setTitle] = useState(entry?.title ?? '');
  const [content, setContent] = useState(entry?.content ?? '');
  const [mood, setMood] = useState(entry?.mood ?? '');
  const [images, setImages] = useState<string[]>(entry?.images ?? []);
  const [drawings, setDrawings] = useState<string[]>(entry?.drawings ?? []);
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [editDrawingIdx, setEditDrawingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      setMood(entry.mood);
      setImages(entry.images ?? []);
      setDrawings(entry.drawings ?? []);
    }
  }, [entry]);

  function handleSave() {
    if (!title.trim() && !content.trim() && images.length === 0 && drawings.length === 0) return;
    const data = {
      type,
      title: title.trim() || 'Untitled',
      content: content.trim(),
      mood,
      tags: [] as string[],
      images,
      drawings,
    };
    if (entry) {
      onUpdate(entry.id, data);
    } else {
      onSave(data);
    }
    onClose();
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        setImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function openNewDrawing() {
    setEditDrawingIdx(null);
    setCanvasOpen(true);
  }

  function openEditDrawing(idx: number) {
    setEditDrawingIdx(idx);
    setCanvasOpen(true);
  }

  function saveDrawing(dataUrl: string) {
    if (editDrawingIdx !== null) {
      setDrawings(prev => prev.map((d, i) => i === editDrawingIdx ? dataUrl : d));
    } else {
      setDrawings(prev => [...prev, dataUrl]);
    }
    setCanvasOpen(false);
    setEditDrawingIdx(null);
  }

  function removeDrawing(idx: number) {
    setDrawings(prev => prev.filter((_, i) => i !== idx));
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const hasMedia = images.length > 0 || drawings.length > 0;

  return (
    <>
      <div className="editor-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="editor-panel">
          <div className="editor-topbar">
            <h2>{entry ? 'Edit' : 'New'} {type === 'diary' ? '📖 Diary' : '📓 Journal'}</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={onClose}>✕ Cancel</button>
              <button
                className={`btn ${type === 'diary' ? 'btn-pink' : 'btn-blue'}`}
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>

          <div className="editor-body">
            {/* Title */}
            <div>
              <div className="field-label">Title</div>
              <input
                className="title-input"
                placeholder={type === 'diary' ? "What's on your mind?" : "What are you exploring?"}
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Mood */}
            <div>
              <div className="field-label">Mood</div>
              <div className="mood-picker">
                {MOODS.map(m => (
                  <button
                    key={m}
                    className={`mood-btn ${mood === m ? 'selected' : ''}`}
                    onClick={() => setMood(mood === m ? '' : m)}
                  >{m}</button>
                ))}
              </div>
            </div>

            {/* Writing area */}
            <div style={{ flex: 1 }}>
              <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{type === 'diary' ? 'Your Entry' : 'Your Thoughts'}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{wordCount} words</span>
              </div>
              <textarea
                placeholder={
                  type === 'diary'
                    ? 'Write freely. This is your space. No one is watching...'
                    : 'Explore your ideas, observations, and reflections...'
                }
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ minHeight: 200 }}
              />
            </div>

            {/* Images & Drawings */}
            <div>
              <div className="field-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Images & Doodles</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5 }}>
                  {images.length + drawings.length} attached
                </span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: hasMedia ? 12 : 0 }}>
                <button
                  className="btn"
                  style={{ fontSize: 13 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📎 Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <button
                  className="btn btn-yellow"
                  style={{ fontSize: 13 }}
                  onClick={openNewDrawing}
                >
                  🎨 New Doodle
                </button>
              </div>

              {/* Image thumbnails */}
              {images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  {images.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt=""
                        style={{
                          width: 120, height: 90, objectFit: 'cover',
                          border: 'var(--border)', borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow-sm)', display: 'block',
                        }}
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--red)', color: 'white', border: '2px solid white',
                          cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drawing thumbnails */}
              {drawings.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  {drawings.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt="doodle"
                        onClick={() => openEditDrawing(idx)}
                        title="Click to edit doodle"
                        style={{
                          width: 160, height: 100, objectFit: 'cover',
                          border: '2.5px solid var(--black)',
                          borderRadius: 'var(--radius)',
                          boxShadow: 'var(--shadow-sm)',
                          cursor: 'pointer', display: 'block',
                          background: '#fafaf8',
                        }}
                      />
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        display: 'flex', gap: 4, padding: 4,
                        background: 'rgba(255,255,255,0.9)',
                        borderTop: '1.5px solid var(--black)',
                        borderBottomLeftRadius: 'var(--radius)',
                        borderBottomRightRadius: 'var(--radius)',
                      }}>
                        <button
                          onClick={() => openEditDrawing(idx)}
                          style={{
                            flex: 1, fontSize: 10, fontWeight: 700, padding: '2px 0',
                            border: '1.5px solid var(--black)', borderRadius: 2,
                            background: 'var(--yellow)', cursor: 'pointer',
                          }}
                        >✏️ Edit</button>
                        <button
                          onClick={() => removeDrawing(idx)}
                          style={{
                            flex: 1, fontSize: 10, fontWeight: 700, padding: '2px 0',
                            border: '1.5px solid var(--black)', borderRadius: 2,
                            background: 'var(--red)', color: 'white', cursor: 'pointer',
                          }}
                        >× Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {canvasOpen && (
        <DrawingCanvas
          initialData={editDrawingIdx !== null ? drawings[editDrawingIdx] : undefined}
          onSave={saveDrawing}
          onClose={() => { setCanvasOpen(false); setEditDrawingIdx(null); }}
        />
      )}
    </>
  );
}
