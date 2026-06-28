import { useRef, useEffect, useState, useCallback } from 'react';

type Tool = 'pen' | 'eraser' | 'marker' | 'fill';

const COLORS = [
  '#0d0d0d', '#ffffff', '#f5e642', '#ff6b9d', '#4d9fff',
  '#00e5a0', '#c77dff', '#ff8c42', '#ff4444', '#a0522d',
  '#4a90d9', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
];

const SIZES = [2, 5, 10, 20, 35];

interface Props {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  initialData?: string;
}

export default function DrawingCanvas({ onSave, onClose, initialData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#0d0d0d');
  const [size, setSize] = useState(5);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function getCtx() {
    return canvasRef.current?.getContext('2d') ?? null;
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  // Load initial data or fill white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        pushHistory(ctx, canvas);
      };
      img.src = initialData;
    } else {
      ctx.fillStyle = '#fafaf8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      pushHistory(ctx, canvas);
    }
  }, []);

  function pushHistory(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1);
      next.push(snap);
      setHistoryIdx(next.length - 1);
      return next;
    });
  }

  function undo() {
    if (historyIdx <= 0) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const newIdx = historyIdx - 1;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIdx(newIdx);
  }

  function redo() {
    if (historyIdx >= history.length - 1) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const newIdx = historyIdx + 1;
    ctx.putImageData(history[newIdx], 0, 0);
    setHistoryIdx(newIdx);
  }

  function clearCanvas() {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory(ctx, canvas);
  }

  function floodFill(startX: number, startY: number) {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!ctx || !canvas) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    const si = (Math.floor(startY) * w + Math.floor(startX)) * 4;
    const sr = data[si], sg = data[si + 1], sb = data[si + 2], sa = data[si + 3];

    const fillRgb = hexToRgb(color);
    if (!fillRgb) return;
    if (sr === fillRgb.r && sg === fillRgb.g && sb === fillRgb.b) return;

    const stack = [Math.floor(startX) + Math.floor(startY) * w];
    const visited = new Uint8Array(w * h);

    function match(idx: number) {
      return data[idx] === sr && data[idx + 1] === sg && data[idx + 2] === sb && data[idx + 3] === sa;
    }

    while (stack.length) {
      const pos = stack.pop()!;
      if (visited[pos]) continue;
      const idx = pos * 4;
      if (!match(idx)) continue;
      visited[pos] = 1;
      data[idx] = fillRgb.r;
      data[idx + 1] = fillRgb.g;
      data[idx + 2] = fillRgb.b;
      data[idx + 3] = 255;
      const x = pos % w;
      const y = Math.floor(pos / w);
      if (x > 0) stack.push(pos - 1);
      if (x < w - 1) stack.push(pos + 1);
      if (y > 0) stack.push(pos - w);
      if (y < h - 1) stack.push(pos + w);
    }

    ctx.putImageData(imgData, 0, 0);
    pushHistory(ctx, canvas);
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const pos = getPos(e);
    if (tool === 'fill') { floodFill(pos.x, pos.y); return; }
    setDrawing(true);
    lastPos.current = pos;
    const ctx = getCtx();
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || tool === 'fill') return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !lastPos.current) return;

    const pos = getPos(e);
    ctx.lineWidth = tool === 'eraser' ? size * 3 : tool === 'marker' ? size * 2 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else if (tool === 'marker') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = color;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    lastPos.current = pos;
  }, [drawing, tool, color, size]);

  function endDraw() {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas) pushHistory(ctx, canvas);
  }

  function handleSave() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Composite onto white background before saving
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const octx = offscreen.getContext('2d')!;
    octx.fillStyle = '#fafaf8';
    octx.fillRect(0, 0, offscreen.width, offscreen.height);
    octx.drawImage(canvas, 0, 0);
    onSave(offscreen.toDataURL('image/png'));
  }

  const toolBtn = (t: Tool, label: string, title: string) => (
    <button
      className={`btn ${tool === t ? 'btn-yellow' : ''}`}
      style={{ padding: '8px 14px', fontSize: 13 }}
      onClick={() => setTool(t)}
      title={title}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--white)',
        border: 'var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        width: 'min(860px, 98vw)',
        maxHeight: '96vh',
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
          borderBottom: 'var(--border)', flexWrap: 'wrap', background: 'var(--white)',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, marginRight: 4 }}>TOOLS</span>

          <div style={{ display: 'flex', gap: 4 }}>
            {toolBtn('pen', '✏️ Pen', 'Pen')}
            {toolBtn('marker', '🖊️ Marker', 'Highlighter marker')}
            {toolBtn('eraser', '⬜ Eraser', 'Eraser')}
            {toolBtn('fill', '🪣 Fill', 'Fill area with color')}
          </div>

          <div style={{ width: 1, background: 'var(--black)', height: 28, opacity: 0.2 }} />

          {/* Brush size */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                style={{
                  width: 32, height: 32, borderRadius: 'var(--radius)',
                  border: '2px solid var(--black)',
                  background: size === s ? 'var(--black)' : 'var(--white)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{
                  borderRadius: '50%',
                  width: Math.min(s * 1.2, 20),
                  height: Math.min(s * 1.2, 20),
                  background: size === s ? 'var(--white)' : 'var(--black)',
                }} />
              </button>
            ))}
          </div>

          <div style={{ width: 1, background: 'var(--black)', height: 28, opacity: 0.2 }} />

          {/* Undo / Redo */}
          <button className="btn" style={{ padding: '8px 12px', fontSize: 13 }} onClick={undo} title="Undo">↩</button>
          <button className="btn" style={{ padding: '8px 12px', fontSize: 13 }} onClick={redo} title="Redo">↪</button>
          <button className="btn btn-red" style={{ padding: '8px 12px', fontSize: 13 }} onClick={clearCanvas}>Clear</button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-green" onClick={handleSave}>✓ Save Drawing</button>
          </div>
        </div>

        {/* Color palette */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
          borderBottom: 'var(--border)', background: '#f5f5f0', flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 11, opacity: 0.5, marginRight: 4 }}>COLOR</span>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 28, height: 28,
                background: c,
                border: color === c ? '3px solid #0d0d0d' : '2px solid rgba(0,0,0,0.25)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                boxShadow: color === c ? '0 0 0 2px var(--yellow)' : 'none',
                transform: color === c ? 'scale(1.2)' : 'none',
                transition: 'transform 0.1s',
              }}
              title={c}
            />
          ))}
          {/* Custom color */}
          <label style={{ cursor: 'pointer' }} title="Custom color">
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--radius)',
              border: '2px dashed #0d0d0d', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>+</div>
            <input
              type="color" value={color}
              onChange={e => setColor(e.target.value)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
          </label>

          <div style={{
            marginLeft: 8,
            width: 36, height: 36,
            background: color,
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)',
          }} />
        </div>

        {/* Canvas */}
        <div style={{
          flex: 1, overflow: 'auto', background: '#e8e8e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, minHeight: 0,
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            style={{
              cursor: tool === 'eraser' ? 'cell' : tool === 'fill' ? 'crosshair' : 'crosshair',
              border: 'var(--border)',
              boxShadow: 'var(--shadow)',
              touchAction: 'none',
              maxWidth: '100%',
              display: 'block',
              background: '#fafaf8',
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}
