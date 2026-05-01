import React, { useState, useEffect, useCallback } from "react";

// ── Shared palette (matches TextFileBackandSave / ProtoEditor) ──────────────
const C = {
  primary: '#15396a',
  border:  '#c8d8ef',
  bg:      '#f4f8ff',
  ok:      '#166534',
  okBg:    '#dcfce7',
  err:     '#991b1b',
  errBg:   '#fee2e2',
  dirty:   '#92400e',
  dirtyBg: '#fef3c7',
};

// ── Minimal markdown renderer (no dependencies) ─────────────────────────────
// Content is user-authored local files — dangerouslySetInnerHTML is acceptable here.
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
    else if (/^## /.test(raw))  { html += `<h2 style="margin:14px 0 6px;color:${C.primary}">${line.replace(/^## /, '')}</h2>`; }
    else if (/^# /.test(raw))   { html += `<h1 style="margin:16px 0 8px;color:${C.primary}">${line.replace(/^# /, '')}</h1>`; }
    else if (/^---$/.test(raw)) { html += `<hr style="border:none;border-top:1px solid ${C.border};margin:12px 0">`; }
    else if (/^> /.test(raw))   { html += `<blockquote style="border-left:3px solid ${C.primary};padding:4px 12px;margin:8px 0;color:#374151;background:${C.bg}">${line.replace(/^&gt; /, '')}</blockquote>`; }
    else if (/^\s*[-*]\s/.test(raw)) {
      if (!inList) { html += '<ul style="margin:6px 0;padding-left:22px">'; inList = true; }
      html += `<li style="margin:2px 0">${line.replace(/^\s*[-*]\s/, '')}</li>`;
    }
    else if (/^\|/.test(raw)) {
      if (!inTable) { html += `<table style="border-collapse:collapse;margin:8px 0;font-size:0.9em">`; inTable = true; }
      if (/^\|[-| :]+\|/.test(raw)) continue;
      const cells = raw.split('|').filter((_, j, a) => j > 0 && j < a.length - 1);
      html += `<tr>${cells.map(c => `<td style="border:1px solid ${C.border};padding:4px 10px">${c.trim()}</td>`).join('')}</tr>`;
    }
    else if (raw.trim() === '') { html += '<div style="height:6px"></div>'; }
    else { html += `<p style="margin:3px 0">${line}</p>`; }
  }
  if (inList)  html += '</ul>';
  if (inTable) html += '</table>';
  return html;
}

// ── Version history panel ───────────────────────────────────────────────────
function VersionHistory({ backups, onRestore }) {
  const [open, setOpen] = useState(false);
  if (!backups || backups.length === 0) {
    return <span style={{ fontSize: '0.82em', color: '#9ca3af' }}>No backups yet — save once to create the first.</span>;
  }
  return (
    <span>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: C.primary, fontWeight: 600, fontSize: '0.86em', padding: 0,
      }}>
        {open ? '▾' : '▸'} Version history ({backups.length})
      </button>
      {open && (
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
          {backups.map((b, i) => {
            const ts = b.replace(/^.*\.bck\./, '').replace('T', ' ').replace(/-(\d{2})-(\d{2})$/, ':$1:$2');
            return (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82em', color: '#374151', flex: 1 }}>
                  {i === 0 ? '● ' : '○ '}{ts}
                </span>
                <button onClick={() => onRestore(b)} style={{
                  padding: '2px 10px', fontSize: '0.8em', borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${C.border}`, background: C.bg, color: C.primary, fontWeight: 600,
                }}>
                  Restore
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function MdFileEditor() {
  const [mdFiles,     setMdFiles]     = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [fetchPath,   setFetchPath]   = useState('');
  const [filename,    setFilename]    = useState('');
  const [rawContent,  setRawContent]  = useState('');
  const [draft,       setDraft]       = useState('');
  const [backups,     setBackups]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [status,      setStatus]      = useState({ message: '', isError: false });
  const [preview,     setPreview]     = useState(false);

  const dirty = draft !== rawContent;

  const showStatus = (message, isError = false) => {
    setStatus({ message, isError });
    setTimeout(() => setStatus({ message: '', isError: false }), 8000);
  };

  // Load file list on mount
  useEffect(() => {
    fetch('/api/list-md-files')
      .then(r => r.json())
      .then(data => { setMdFiles(Array.isArray(data) ? data : []); setLoadingList(false); })
      .catch(() => { setMdFiles([]); setLoadingList(false); });
  }, []);

  const loadFile = useCallback((fp) => {
    if (!fp) return;
    setLoading(true);
    setPreview(false);
    fetch(`/api/txt/load?fetchPath=${encodeURIComponent(fp)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok') {
          setRawContent(data.content);
          setDraft(data.content);
          setBackups(data.backups || []);
          showStatus(`Loaded — ${(data.backups || []).length} backup(s) available`);
        } else {
          showStatus(`⚠ ${data.message}`, true);
        }
      })
      .catch(() => showStatus('⚠ Backend offline', true))
      .finally(() => setLoading(false));
  }, []);

  const handleDropdownChange = (e) => {
    const fp = e.target.value;
    if (!fp) return;
    const file = mdFiles.find(f => f.fetchPath === fp);
    if (!file) return;
    if (dirty && !window.confirm('Unsaved changes — switch file anyway?')) return;
    setFetchPath(fp);
    setFilename(file.name);
    setRawContent('');
    setDraft('');
    setBackups([]);
    loadFile(fp);
  };

  const handleSave = async () => {
    if (!fetchPath) return;
    setSaving(true);
    try {
      const res = await fetch('/api/txt/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fetchPath, content: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRawContent(draft);
        setBackups(data.backups || []);
        showStatus(`✓ ${data.message || 'Saved'}`);
      } else {
        showStatus(`⚠ ${data.message || 'Save failed'}`, true);
      }
    } catch {
      showStatus('⚠ Backend offline — not saved', true);
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (backupFile) => {
    if (!fetchPath) return;
    fetch(`/api/txt/restore?fetchPath=${encodeURIComponent(fetchPath)}&file=${encodeURIComponent(backupFile)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok') {
          setDraft(data.content);
          showStatus('Restored from backup — click Save to apply');
        } else {
          showStatus(`⚠ ${data.message}`, true);
        }
      })
      .catch(() => showStatus('⚠ Restore failed', true));
  };

  const tabBtn = (active, label, onClick) => (
    <button onClick={onClick} style={{
      padding: '3px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: '0.85em',
      border: `1px solid ${C.primary}`,
      background: active ? C.primary : '#eaf1fa',
      color:      active ? '#fff'    : C.primary,
    }}>{label}</button>
  );

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900 }}>

      {/* File selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 700, color: C.primary, fontSize: '0.9em', flexShrink: 0 }}>File:</label>
        {loadingList ? (
          <span style={{ color: '#9ca3af', fontSize: '0.9em' }}>Loading list…</span>
        ) : mdFiles.length === 0 ? (
          <span style={{ color: C.err, fontSize: '0.9em' }}>No .md files found — backend may need restart</span>
        ) : (
          <select value={fetchPath} onChange={handleDropdownChange} style={{
            flex: 1, minWidth: 220, fontSize: '0.9em', padding: '4px 8px',
            border: `1px solid ${C.border}`, borderRadius: 5,
          }}>
            <option value=''>— select —</option>
            {mdFiles.map(f => (
              <option key={f.fetchPath} value={f.fetchPath}>{f.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Action chrome: filename · dirty · status · Reload · Save */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        padding: '7px 12px', background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 7, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary, fontSize: '0.9em' }}>
          {filename || '—'}
        </span>

        {dirty && filename && (
          <span style={{
            fontSize: '0.78em', fontWeight: 700, padding: '2px 8px',
            background: C.dirtyBg, color: C.dirty, borderRadius: 5,
          }}>
            unsaved
          </span>
        )}

        {/* Raw / Preview tabs inline */}
        {fetchPath && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
            {tabBtn(!preview, 'Raw',     () => setPreview(false))}
            {tabBtn( preview, 'Preview', () => setPreview(true))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {status.message && (
          <span style={{
            fontSize: '0.85em', fontWeight: 600, padding: '2px 10px', borderRadius: 5,
            color:      status.isError ? C.err   : C.ok,
            background: status.isError ? C.errBg : C.okBg,
          }}>
            {status.message}
          </span>
        )}

        <button onClick={() => loadFile(fetchPath)} disabled={!fetchPath || loading} style={{
          padding: '4px 14px', borderRadius: 5, cursor: fetchPath ? 'pointer' : 'default',
          border: `1px solid ${C.border}`, background: '#fff', color: C.primary,
          fontWeight: 600, fontSize: '0.88em',
        }}>
          {loading ? '…' : '↺ Reload'}
        </button>

        <button onClick={handleSave} disabled={saving || !dirty || !fetchPath} style={{
          padding: '4px 16px', borderRadius: 5,
          cursor: (dirty && fetchPath) ? 'pointer' : 'default',
          border: `1px solid ${(dirty && fetchPath) ? C.primary : C.border}`,
          background: (dirty && fetchPath) ? C.primary : '#e5e7eb',
          color:      (dirty && fetchPath) ? '#fff'    : '#9ca3af',
          fontWeight: 700, fontSize: '0.88em',
        }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Edit / Preview area */}
      {!fetchPath ? (
        <div style={{
          padding: 32, color: '#9ca3af', fontSize: '0.92em', textAlign: 'center',
          border: `1px dashed ${C.border}`, borderRadius: 6,
        }}>
          Select a .md file above to begin editing.
        </div>
      ) : preview ? (
        <div
          dangerouslySetInnerHTML={{ __html: renderMd(draft) }}
          style={{
            minHeight: 400, padding: 20,
            border: `1px solid ${C.border}`, borderRadius: 6,
            background: '#fff', fontSize: '0.95em', lineHeight: 1.7,
          }}
        />
      ) : (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          style={{
            width: '100%', minHeight: 400, fontSize: '0.92em',
            fontFamily: 'Menlo, Monaco, Consolas, monospace',
            border: `1px solid ${C.border}`, borderRadius: 6, padding: 12,
            background: C.bg, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
          }}
        />
      )}

      {/* Version history */}
      <div style={{
        marginTop: 8, padding: '8px 12px',
        border: `1px solid ${C.border}`, borderRadius: 7, background: C.bg,
      }}>
        <span style={{ fontWeight: 700, color: C.primary, fontSize: '0.88em', marginRight: 8 }}>
          Backup / Version History
        </span>
        <VersionHistory backups={backups} onRestore={handleRestore} />
      </div>

    </div>
  );
}
