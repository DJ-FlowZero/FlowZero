// ProtoEditor.jsx — PROTOTYPE unified file editor sidecar
// Tests the load / edit / save / backup pattern for JSON, TXT, and MD file types.
// Files live in public/PROTO/. Not connected to production data.
//
// Architecture:
//   ProtoEditor (owns: rawContent, draftContent, status, backups)
//     ├── JsonFieldEditor  value={draft} onChange={setDraft}  — parses JSON, field-type form
//     ├── TxtEditor        value={draft} onChange={setDraft}  — plain textarea
//     └── MdEditor         value={draft} onChange={setDraft}  — textarea + preview toggle
//   All three implement the same (value, onChange) interface.
//   ProtoEditor handles load/save/backup; the edit slot is the only thing that differs.

import React, { useState, useEffect, useCallback } from 'react';

const PROTO_FILES = [
  { name: 'PR_Json.json', type: 'json', label: 'JSON — field edit' },
  { name: 'PR_text.txt',  type: 'txt',  label: 'TXT — textarea'   },
  { name: 'PR_MD.md',     type: 'md',   label: 'MD — raw + preview'},
];

// ── Shared palette ──────────────────────────────────────────────────────────
const C = {
  primary:  '#15396a',
  border:   '#c8d8ef',
  bg:       '#f4f8ff',
  ok:       '#166534',
  okBg:     '#dcfce7',
  err:      '#991b1b',
  errBg:    '#fee2e2',
  dirty:    '#92400e',
  dirtyBg:  '#fef3c7',
};

// ── Type badge (shows detected value type per field) ────────────────────────
function TypeBadge({ type }) {
  const palette = {
    string:  ['#1e40af', '#dbeafe'],
    number:  ['#065f46', '#d1fae5'],
    boolean: ['#4c1d95', '#ede9fe'],
    array:   ['#92400e', '#fef3c7'],
    object:  ['#374151', '#f3f4f6'],
    null:    ['#6b7280', '#f3f4f6'],
  };
  const [fg, bg] = palette[type] || ['#374151', '#f3f4f6'];
  return (
    <span style={{
      fontSize: '0.7em', padding: '1px 7px', borderRadius: 8,
      background: bg, color: fg, fontWeight: 700,
      letterSpacing: 0.3, fontFamily: 'monospace', flexShrink: 0,
    }}>
      {type}
    </span>
  );
}

// ── Per-field input (type-detected) ────────────────────────────────────────
function FieldInput({ value, onChange }) {
  const type = value === null ? 'null'
    : Array.isArray(value) ? 'array'
    : typeof value;

  const inputStyle = {
    flex: 1, fontSize: '0.92em', padding: '3px 8px',
    border: `1px solid ${C.border}`, borderRadius: 5,
    fontFamily: 'inherit', background: '#fff', minWidth: 0,
  };
  const taStyle = {
    ...inputStyle, resize: 'vertical', fontFamily: 'monospace',
    fontSize: '0.85em', minHeight: 56,
  };

  if (type === 'boolean') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input type="checkbox" checked={value}
          onChange={e => onChange(e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        <span style={{ fontSize: '0.9em', color: value ? C.ok : '#6b7280' }}>
          {String(value)}
        </span>
      </label>
    );
  }
  if (type === 'number') {
    return (
      <input type="number" value={value} style={inputStyle}
        onChange={e => onChange(Number(e.target.value))} />
    );
  }
  if (type === 'null') {
    return <input type="text" value="null" disabled style={{ ...inputStyle, color: '#9ca3af' }} />;
  }
  if (type === 'array' || type === 'object') {
    return (
      <textarea
        value={JSON.stringify(value, null, 2)}
        style={taStyle}
        onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
      />
    );
  }
  // string (default)
  return (
    <input type="text" value={value} style={inputStyle}
      onChange={e => onChange(e.target.value)} />
  );
}

// ── JSON field editor ───────────────────────────────────────────────────────
// Parses the raw JSON string, renders one row per top-level field,
// re-serializes to JSON string on every change and calls onChange.
function JsonFieldEditor({ value, onChange }) {
  let parsed = null;
  let parseError = null;
  try { parsed = JSON.parse(value); } catch (e) { parseError = e.message; }

  if (parseError) {
    return (
      <div>
        <div style={{ color: C.err, fontSize: '0.88em', marginBottom: 6 }}>
          ⚠ JSON parse error: {parseError} — editing raw text below
        </div>
        <textarea value={value} style={{ width: '100%', minHeight: 240, fontFamily: 'monospace', fontSize: '0.9em', padding: 10 }}
          onChange={e => onChange(e.target.value)} />
      </div>
    );
  }

  const handleFieldChange = (key, newVal) => {
    onChange(JSON.stringify({ ...parsed, [key]: newVal }, null, 2));
  };

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.92em' }}>
      <thead>
        <tr style={{ background: C.bg, color: '#374151', textTransform: 'uppercase', fontSize: '0.75em', letterSpacing: 0.5 }}>
          <th style={{ padding: '5px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, width: '22%' }}>Field</th>
          <th style={{ padding: '5px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, width: '10%' }}>Type</th>
          <th style={{ padding: '5px 10px', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(parsed).map(([k, v], i) => {
          const vtype = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
          return (
            <tr key={k} style={{ background: i % 2 === 0 ? '#fff' : C.bg }}>
              <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.88em', color: C.primary, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                {k}
              </td>
              <td style={{ padding: '7px 10px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                <TypeBadge type={vtype} />
              </td>
              <td style={{ padding: '7px 10px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                <FieldInput value={v} onChange={newVal => handleFieldChange(k, newVal)} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── TXT editor ──────────────────────────────────────────────────────────────
function TxtEditor({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', minHeight: 340, fontSize: '0.92em',
        fontFamily: 'Menlo, Monaco, Consolas, monospace',
        border: `1px solid ${C.border}`, borderRadius: 6, padding: 12,
        background: C.bg, resize: 'vertical', lineHeight: 1.6,
        boxSizing: 'border-box',
      }}
    />
  );
}

// ── Minimal markdown renderer (no dependencies) ─────────────────────────────
// Content is user-authored local files — dangerouslySetInnerHTML is acceptable here.
function renderMd(md) {
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    // HTML-escape first, then apply inline formatting
    let line = raw
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:0.88em">$1</code>');

    // Close open blocks if this line doesn't continue them
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
      if (/^\|[-| :]+\|/.test(raw)) continue; // skip separator row
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

// ── MD editor ───────────────────────────────────────────────────────────────
function MdEditor({ value, onChange }) {
  const [preview, setPreview] = useState(false);
  const tabBtn = (active, label, onClick) => (
    <button onClick={onClick} style={{
      padding: '3px 14px', borderRadius: 5, cursor: 'pointer', fontWeight: 600, fontSize: '0.88em',
      border: `1px solid ${C.primary}`,
      background: active ? C.primary : '#eaf1fa',
      color:      active ? '#fff'    : C.primary,
    }}>{label}</button>
  );
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {tabBtn(!preview, 'Raw',     () => setPreview(false))}
        {tabBtn( preview, 'Preview', () => setPreview(true))}
      </div>
      {!preview ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} style={{
          width: '100%', minHeight: 340, fontSize: '0.9em',
          fontFamily: 'Menlo, Monaco, Consolas, monospace',
          border: `1px solid ${C.border}`, borderRadius: 6, padding: 12,
          background: C.bg, resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box',
        }} />
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: renderMd(value) }}
          style={{
            minHeight: 340, padding: 16,
            border: `1px solid ${C.border}`, borderRadius: 6,
            background: '#fff', fontSize: '0.95em', lineHeight: 1.65,
          }}
        />
      )}
    </div>
  );
}

// ── Import from app ─────────────────────────────────────────────────────────
// Fetches any live app file into the draft — never writes to the original.
// Sources: txt/md from /api/list-txt-files + JSON profiles from profile index.
function ImportFromApp({ onImport }) {
  const [open,       setOpen]       = useState(false);
  const [txtFiles,   setTxtFiles]   = useState([]);   // {name, fetchPath}
  const [profiles,   setProfiles]   = useState([]);   // {realName, fileName}
  const [selected,   setSelected]   = useState('');   // fetchPath or 'profile:fileName'
  const [importing,  setImporting]  = useState(false);
  const [importMsg,  setImportMsg]  = useState('');

  // Lazy-load file lists when panel opens
  useEffect(() => {
    if (!open) return;
    fetch('/api/list-txt-files')
      .then(r => r.json()).then(d => setTxtFiles(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/Gestalt/fz_profile_index.json?_=' + Date.now())
      .then(r => r.json()).then(d => setProfiles(Array.isArray(d) ? d : [])).catch(() => {});
  }, [open]);

  const handleImport = () => {
    if (!selected) return;
    setImporting(true);
    setImportMsg('');
    let url;
    if (selected.startsWith('profile:')) {
      url = '/Gestalt/' + selected.replace('profile:', '');
    } else {
      url = '/' + selected + '?_=' + Date.now();
    }
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => {
        onImport(text, selected);
        setImportMsg('✓ Imported into draft — click Save to write to PROTO/');
        setTimeout(() => setImportMsg(''), 8000);
      })
      .catch(e => setImportMsg(`⚠ ${e.message}`))
      .finally(() => setImporting(false));
  };

  return (
    <div style={{ marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 7, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', textAlign: 'left', padding: '7px 12px',
        background: C.bg, border: 'none', cursor: 'pointer',
        fontWeight: 700, fontSize: '0.86em', color: C.primary,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {open ? '▾' : '▸'} Import from app
        <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: '0.88em' }}>
          — load a live file into the editor without overwriting the original
        </span>
      </button>

      {open && (
        <div style={{ padding: '10px 12px', background: '#fff', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

            <select value={selected} onChange={e => setSelected(e.target.value)} style={{
              flex: 1, minWidth: 200, fontSize: '0.88em', padding: '4px 8px',
              border: `1px solid ${C.border}`, borderRadius: 5,
            }}>
              <option value=''>— pick a file —</option>

              {profiles.length > 0 && (
                <optgroup label='Profiles (JSON)'>
                  {profiles.map(p => (
                    <option key={p.fileName} value={`profile:${p.fileName}`}>
                      {p.realName} ({p.fileName})
                    </option>
                  ))}
                </optgroup>
              )}

              {txtFiles.length > 0 && (
                <optgroup label='Text / Docs'>
                  {txtFiles.map(f => (
                    <option key={f.fetchPath} value={f.fetchPath}>{f.name}</option>
                  ))}
                </optgroup>
              )}
            </select>

            <button onClick={handleImport} disabled={!selected || importing} style={{
              padding: '4px 16px', borderRadius: 5, fontWeight: 700, fontSize: '0.88em',
              cursor: selected ? 'pointer' : 'default',
              border: `1px solid ${selected ? C.primary : C.border}`,
              background: selected ? C.primary : '#e5e7eb',
              color:      selected ? '#fff'    : '#9ca3af',
            }}>
              {importing ? 'Importing…' : 'Import →  draft'}
            </button>
          </div>

          {importMsg && (
            <div style={{
              marginTop: 6, fontSize: '0.83em', fontWeight: 600,
              color:      importMsg.startsWith('✓') ? C.ok  : C.err,
              background: importMsg.startsWith('✓') ? C.okBg : C.errBg,
              padding: '3px 10px', borderRadius: 5, display: 'inline-block',
            }}>
              {importMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Version history panel ───────────────────────────────────────────────────
function VersionHistory({ backups, onRestore }) {
  const [open, setOpen] = useState(false);
  if (backups.length === 0) {
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
            // Backup filenames: PR_Json.json.bck.2026-05-01T14-30-00
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

// ── Main ProtoEditor ────────────────────────────────────────────────────────
export default function ProtoEditor() {
  const [selectedFile, setSelectedFile] = useState(PROTO_FILES[0].name);
  const [rawContent,   setRawContent]   = useState(''); // last saved/loaded state
  const [draft,        setDraft]        = useState(''); // current editing state
  const [status,       setStatus]       = useState({ message: '', isError: false });
  const [backups,      setBackups]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);

  const dirty    = draft !== rawContent;
  const fileType = PROTO_FILES.find(f => f.name === selectedFile)?.type || 'txt';

  const showStatus = (message, isError = false) => {
    setStatus({ message, isError });
    setTimeout(() => setStatus({ message: '', isError: false }), 8000);
  };

  const handleLoad = useCallback(() => {
    setLoading(true);
    fetch(`/api/proto/load?file=${encodeURIComponent(selectedFile)}`)
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
      .catch(() => { setDraft(''); showStatus('⚠ Backend offline — restart backend.cjs and try ↺ Load again', true); })
      .finally(() => setLoading(false));
  }, [selectedFile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/proto/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile, content: draft }),
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
    fetch(`/api/proto/restore?file=${encodeURIComponent(backupFile)}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'ok') {
          setDraft(data.content);
          showStatus(`Restored from ${backupFile} — click Save to apply`);
        } else {
          showStatus(`⚠ ${data.message}`, true);
        }
      })
      .catch(() => showStatus('⚠ Restore failed', true));
  };

  // Auto-load when selected file changes
  useEffect(() => { handleLoad(); }, [handleLoad]);

  const handleFileSelect = (name) => {
    if (dirty && !window.confirm('Unsaved changes — switch file anyway?')) return;
    setSelectedFile(name);
  };

  // Receives content from ImportFromApp — populates draft only, original untouched
  const handleImportIntoDraft = (text) => {
    setDraft(text);
    // rawContent intentionally NOT updated → unsaved pill fires immediately
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900 }}>

      {/* File type selector tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {PROTO_FILES.map(f => (
          <button key={f.name} onClick={() => handleFileSelect(f.name)} style={{
            padding: '5px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.88em',
            border: `2px solid ${C.primary}`,
            background: selectedFile === f.name ? C.primary : '#eaf1fa',
            color:      selectedFile === f.name ? '#fff'    : C.primary,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Shared action chrome: filename · dirty · status · Load · Save */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        padding: '7px 12px', background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 7, flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary, fontSize: '0.9em' }}>
          {selectedFile}
        </span>

        {dirty && (
          <span style={{
            fontSize: '0.78em', fontWeight: 700, padding: '2px 8px',
            background: C.dirtyBg, color: C.dirty, borderRadius: 5,
          }}>
            unsaved
          </span>
        )}

        <div style={{ flex: 1 }} />

        {status.message && (
          <span style={{
            fontSize: '0.85em', fontWeight: 600,
            color:      status.isError ? C.err   : C.ok,
            background: status.isError ? C.errBg : C.okBg,
            padding: '2px 10px', borderRadius: 5,
          }}>
            {status.message}
          </span>
        )}

        <button onClick={handleLoad} disabled={loading} style={{
          padding: '4px 14px', borderRadius: 5, cursor: 'pointer',
          border: `1px solid ${C.border}`, background: '#fff', color: C.primary,
          fontWeight: 600, fontSize: '0.88em',
        }}>
          {loading ? '…' : '↺ Load'}
        </button>

        <button onClick={handleSave} disabled={saving || !dirty} style={{
          padding: '4px 16px', borderRadius: 5,
          cursor: dirty ? 'pointer' : 'default',
          border: `1px solid ${dirty ? C.primary : C.border}`,
          background: dirty ? C.primary : '#e5e7eb',
          color:      dirty ? '#fff'    : '#9ca3af',
          fontWeight: 700, fontSize: '0.88em',
        }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Import from app panel */}
      <ImportFromApp onImport={handleImportIntoDraft} />

      {/* Type-specific edit slot */}
      <div style={{ marginBottom: 10 }}>
        {loading ? (
          <div style={{ padding: 24, color: '#9ca3af', fontSize: '0.92em' }}>Loading…</div>
        ) : status.isError ? (
          <div style={{ padding: 24, color: '#991b1b', background: '#fee2e2', borderRadius: 6, fontSize: '0.92em' }}>
            {status.message}
          </div>
        ) : (
          <>
            {fileType === 'json' && <JsonFieldEditor value={draft} onChange={setDraft} />}
            {fileType === 'txt'  && <TxtEditor       value={draft} onChange={setDraft} />}
            {fileType === 'md'   && <MdEditor        value={draft} onChange={setDraft} />}
          </>
        )}
      </div>

      {/* Backup / version history */}
      <div style={{
        padding: '8px 12px', border: `1px solid ${C.border}`,
        borderRadius: 7, background: C.bg,
      }}>
        <span style={{ fontWeight: 700, color: C.primary, fontSize: '0.88em', marginRight: 8 }}>
          Backup / Version History
        </span>
        <VersionHistory backups={backups} onRestore={handleRestore} />
      </div>

    </div>
  );
}
