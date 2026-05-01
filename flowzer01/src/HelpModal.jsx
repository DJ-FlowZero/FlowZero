import React, { useState, useEffect, useCallback } from "react";

const C = {
  primary: '#15396a',
  border:  '#c8d8ef',
  bg:      '#f4f8ff',
};

// Minimal markdown renderer — same as MdFileEditor / ProtoEditor
function renderMd(md) {
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let line = raw
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:0.88em">$1</code>');

    if (inList  && !/^\s*[-*]\s/.test(raw)) { html += '</ul>'; inList  = false; }
    if (inTable && !/^\|/.test(raw))         { html += '</table>'; inTable = false; }

    if      (/^### /.test(raw)) { html += `<h3 style="margin:10px 0 4px;color:${C.primary}">${line.replace(/^### /, '')}</h3>`; }
    else if (/^## /.test(raw))  { html += `<h2 style="margin:16px 0 6px;color:${C.primary};border-bottom:1px solid ${C.border};padding-bottom:4px">${line.replace(/^## /, '')}</h2>`; }
    else if (/^# /.test(raw))   { html += `<h1 style="margin:0 0 12px;color:${C.primary};font-size:1.5em">${line.replace(/^# /, '')}</h1>`; }
    else if (/^---$/.test(raw)) { html += `<hr style="border:none;border-top:1px solid ${C.border};margin:14px 0">`; }
    else if (/^> /.test(raw))   { html += `<blockquote style="border-left:4px solid ${C.primary};padding:6px 14px;margin:10px 0;color:#374151;background:${C.bg};border-radius:0 6px 6px 0">${line.replace(/^&gt; /, '')}</blockquote>`; }
    else if (/^\s*[-*]\s/.test(raw)) {
      if (!inList) { html += '<ul style="margin:6px 0;padding-left:22px">'; inList = true; }
      html += `<li style="margin:3px 0">${line.replace(/^\s*[-*]\s/, '')}</li>`;
    }
    else if (/^\|/.test(raw)) {
      if (!inTable) { html += `<table style="border-collapse:collapse;margin:10px 0;font-size:0.9em;width:100%">`; inTable = true; }
      if (/^\|[-| :]+\|/.test(raw)) continue;
      const cells = raw.split('|').filter((_, j, a) => j > 0 && j < a.length - 1);
      html += `<tr>${cells.map((c, ci) => `<td style="border:1px solid ${C.border};padding:6px 12px;${ci === 0 ? 'font-weight:600;background:${C.bg}' : ''}">${c.trim()}</td>`).join('')}</tr>`;
    }
    else if (raw.trim() === '') { html += '<div style="height:7px"></div>'; }
    else { html += `<p style="margin:3px 0;line-height:1.7">${line}</p>`; }
  }
  if (inList)  html += '</ul>';
  if (inTable) html += '</table>';
  return html;
}

// ── HelpModal ───────────────────────────────────────────────────────────────
// Props:
//   fetchPath  — e.g. "fz_md/FZ_help_CreatePuck.md"  (null = closed)
//   onClose    — callback to clear fetchPath
export default function HelpModal({ fetchPath, onClose }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Load content whenever fetchPath changes
  useEffect(() => {
    if (!fetchPath) { setContent(''); setError(''); return; }
    setLoading(true);
    setError('');
    fetch(`/api/txt/load?fetchPath=${encodeURIComponent(fetchPath)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok') setContent(data.content);
        else setError(data.message || 'Could not load help file.');
      })
      .catch(() => setError('Backend offline — help unavailable.'))
      .finally(() => setLoading(false));
  }, [fetchPath]);

  // Escape key closes
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!fetchPath) return;
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fetchPath, handleKey]);

  if (!fetchPath) return null;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 30, 60, 0.45)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 60, overflowY: 'auto',
      }}
    >
      {/* Card — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          border: `1.5px solid ${C.border}`,
          borderRadius: 12,
          boxShadow: '0 8px 40px rgba(15,30,60,0.18)',
          maxWidth: 760, width: '92%',
          padding: '32px 36px 40px',
          position: 'relative',
          marginBottom: 60,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          title="Close (Esc)"
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.4em', color: '#9ca3af', lineHeight: 1,
            padding: '2px 6px', borderRadius: 4,
          }}
        >
          ✕
        </button>

        {loading && (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>Loading…</p>
        )}
        {error && (
          <p style={{ color: '#991b1b', background: '#fee2e2', padding: '8px 14px', borderRadius: 6 }}>
            ⚠ {error}
          </p>
        )}
        {!loading && !error && content && (
          <div
            dangerouslySetInnerHTML={{ __html: renderMd(content) }}
            style={{ fontFamily: 'system-ui, sans-serif', fontSize: '0.97em', color: '#1f2937' }}
          />
        )}
      </div>
    </div>
  );
}
