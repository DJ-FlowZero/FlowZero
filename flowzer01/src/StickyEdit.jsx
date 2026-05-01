import React, { useState, useEffect } from "react";
import { fetchUserIndex, getGestaltFileUrl } from "./userIndexUtil";

const C = {
  primary: '#15396a', border: '#c8d8ef', bg: '#f4f8ff',
  ok: '#166534', okBg: '#dcfce7', err: '#991b1b', errBg: '#fee2e2',
  dirty: '#92400e', dirtyBg: '#fef3c7',
};

function VersionHistory({ backups, onRestore }) {
  const [open, setOpen] = React.useState(false);
  if (!backups || backups.length === 0)
    return <span style={{ fontSize: '0.82em', color: '#9ca3af' }}>No backups yet — save once to create the first.</span>;
  return (
    <span>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.primary, fontWeight: 600, fontSize: '0.86em', padding: 0 }}>
        {open ? '▾' : '▸'} Version history ({backups.length})
      </button>
      {open && (
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
          {backups.map((b, i) => {
            const ts = b.replace(/^.*\.bck\./, '').replace('T', ' ').replace(/-([0-9]{2})-([0-9]{2})$/, ':$1:$2');
            return (
              <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.82em', color: '#374151', flex: 1 }}>{i === 0 ? '● ' : '○ '}{ts}</span>
                <button onClick={() => onRestore(b)} style={{ padding: '2px 10px', fontSize: '0.8em', borderRadius: 4, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.bg, color: C.primary, fontWeight: 600 }}>Restore</button>
              </li>
            );
          })}
        </ul>
      )}
    </span>
  );
}

export default function StickyEdit() {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [profileLabels, setProfileLabels] = useState([]); // [{label, idx, stickyFile, description}]
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [visibility, setVisibility] = useState("secret"); // visibility filter
  const [selectedProfile, setSelectedProfile] = useState(null); // {label, description, stickyFile}
  const [rawContent, setRawContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ message: '', isError: false });
  const [backups, setBackups] = useState([]);

  // Handle file input for loading sticky JSON
  const handleOpen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setJsonData(data);
      setError("");
    } catch {
      setError("Failed to load or parse file.");
      setJsonData(null);
    }
  };

  // Load user index on mount
  useEffect(() => {
    fetchUserIndex()
      .then(async (data) => {
        setUserIndex(data);
        // Fetch each profile file and extract a display label
        const labels = await Promise.all(
          data.map(async (profile, idx) => {
            const stickyFile = profile.fileName.replace(/\.json$/, "_sticky.json");
            try {
              const gestaltPath = await getGestaltFileUrl(profile.fileName);
              const res = await fetch(gestaltPath);
              if (!res.ok) throw new Error();
              const json = await res.json();
              const arr = json.profile || [];
              let display = arr.find(e => e.label === "Real Name")?.value
                || arr.find(e => e.label === "User Name")?.value
                || arr.find(e => e.label === "Name")?.value
                || profile.profileId;
              return {
                label: display,
                idx,
                stickyFile,
                description: profile.description
              };
            } catch {
              return {
                label: profile.profileId,
                idx,
                stickyFile,
                description: profile.description
              };
            }
          })
        );
        setProfileLabels(labels);
        setLoadingIndex(false);
      })
      .catch(() => {
        setUserIndex([]);
        setProfileLabels([]);
        setLoadingIndex(false);
      });
  }, []);

  // Load sticky file by profile selection
  const handleProfileSelect = async (e) => {
    const idx = Number(e.target.value);
    if (isNaN(idx)) return;
    const profile = userIndex[idx];
    const stickyFile = profile.fileName.replace(/\.json$/, "_sticky.json");
    setFilename(stickyFile);
    // Find the label/description from profileLabels
    const labelObj = profileLabels.find(l => l.idx == idx);
    setSelectedProfile(labelObj || null);
    try {
      const gestaltPath = await getGestaltFileUrl(stickyFile);
      const res = await fetch(gestaltPath);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setJsonData(data);
      setRawContent(JSON.stringify(data, null, 2));
      setError("");
      fetch(`/api/profile/backups?filename=${encodeURIComponent(stickyFile)}`)
        .then(r => r.json()).then(d => setBackups(d.backups || [])).catch(() => {});
    } catch {
      setError("Failed to load or parse sticky file.");
      setJsonData(null);
    }
  };

  // Handle field change
  const handleFieldChange = (stickyIdx, key, value) => {
    setJsonData((prev) => {
      const newData = { ...prev };
      const stickyKey = Object.keys(newData)[0];
      newData[stickyKey][stickyIdx][key] = value;
      return newData;
    });
  };

  // Add new sticky note
  const handleAddSticky = () => {
    setJsonData((prev) => {
      const newData = { ...prev };
      const stickyKey = Object.keys(newData)[0];
      if (!newData[stickyKey]) newData[stickyKey] = [];
      newData[stickyKey].push({ stickytype: "", note: "", links: "" });
      return newData;
    });
  };

  // Save as JSON file
  const showStatus = (message, isError = false) => {
    setStatus({ message, isError });
    setTimeout(() => setStatus({ message: '', isError: false }), 8000);
  };

  const handleSave = async () => {
    if (!filename || !jsonData) return;
    setSaving(true);
    try {
      const content = JSON.stringify(jsonData, null, 2);
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRawContent(content);
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

  const handleReload = async () => {
    if (!filename) return;
    try {
      const gestaltPath = await getGestaltFileUrl(filename);
      const res = await fetch(gestaltPath + '?_=' + Date.now());
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJsonData(data);
      setRawContent(JSON.stringify(data, null, 2));
      const bkRes = await fetch(`/api/profile/backups?filename=${encodeURIComponent(filename)}`);
      const bkData = await bkRes.json();
      setBackups(bkData.backups || []);
      showStatus('Reloaded from server');
    } catch {
      showStatus('⚠ Reload failed', true);
    }
  };

  const handleRestore = async (backupFile) => {
    if (!filename) return;
    try {
      const res = await fetch(`/api/profile/restore?filename=${encodeURIComponent(filename)}&file=${encodeURIComponent(backupFile)}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setJsonData(JSON.parse(data.content));
        showStatus('Restored from backup — click Save to apply');
      } else {
        showStatus(`⚠ ${data.message}`, true);
      }
    } catch {
      showStatus('⚠ Restore failed', true);
    }
  };

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!jsonData) {
    return (
      <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
        <div style={{ marginBottom: 16 }}>
          <b>Choose a Profile to Load Stickies:</b>
        </div>
        {loadingIndex ? (
          <div>Loading profiles...</div>
        ) : profileLabels.length === 0 ? (
          <div>No profiles found in fz_user_index.json.</div>
        ) : (
          <select onChange={handleProfileSelect} defaultValue="">
            <option value="">-- Select Profile --</option>
            {profileLabels.map(({label, idx, stickyFile, description}) => (
              <option key={stickyFile} value={idx}>
                {label} ({stickyFile}) - {description}
              </option>
            ))}
          </select>
        )}
        {filename && selectedProfile && (
          <div style={{ marginTop: 18, marginBottom: 8, padding: 8, background: '#f0f7ff', borderRadius: 6, border: '1px solid #b3d1ff', fontSize: '1.1em', fontWeight: 500 }}>
            <span style={{color:'#003366'}}>
              <span style={{fontWeight:700}}>{selectedProfile.label}</span>
              {selectedProfile.description ? <span style={{marginLeft:12, color:'#555'}}>- {selectedProfile.description}</span> : null}
            </span>
          </div>
        )}
        {filename && (
          <div style={{ marginTop: 10, color: '#007', fontSize: '1em' }}>
            <b>Loaded file:</b> {filename}
          </div>
        )}
      </div>
    );
  }

  const stickyKey = Object.keys(jsonData)[0];
  const stickyArr = jsonData[stickyKey];
  // Filter records based on visibility
  // No allowedFlags needed; render stickyArr directly
  // No filteredStickyArr needed; render stickyArr directly
  // Sort by label
  // No sort/delete UI. Just render the array as before.
  const dirty = rawContent !== null && JSON.stringify(jsonData, null, 2) !== rawContent;
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
      {selectedProfile && (
        <div style={{ marginBottom: 18, padding: 8, background: '#f0f7ff', borderRadius: 6, border: '1px solid #b3d1ff', fontSize: '1.1em', fontWeight: 500 }}>
          <span style={{color:'#003366'}}>
            <span style={{fontWeight:700}}>{selectedProfile.label}</span>
            {selectedProfile.description ? <span style={{marginLeft:12, color:'#555'}}>- {selectedProfile.description}</span> : null}
          </span>
        </div>
      )}
      {/* Chrome bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '7px 12px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.primary, fontSize: '0.9em' }}>{filename}</span>
        {dirty && <span style={{ fontSize: '0.78em', fontWeight: 700, padding: '2px 8px', background: C.dirtyBg, color: C.dirty, borderRadius: 5 }}>unsaved</span>}
        <div style={{ flex: 1 }} />
        {status.message && <span style={{ fontSize: '0.85em', fontWeight: 600, padding: '2px 10px', borderRadius: 5, color: status.isError ? C.err : C.ok, background: status.isError ? C.errBg : C.okBg }}>{status.message}</span>}
        <button onClick={handleReload} style={{ padding: '4px 14px', borderRadius: 5, cursor: 'pointer', border: `1px solid ${C.border}`, background: '#fff', color: C.primary, fontWeight: 600, fontSize: '0.88em' }}>↺ Reload</button>
        <button onClick={handleSave} disabled={saving || !dirty} style={{ padding: '4px 16px', borderRadius: 5, cursor: dirty ? 'pointer' : 'default', border: `1px solid ${dirty ? C.primary : C.border}`, background: dirty ? C.primary : '#e5e7eb', color: dirty ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: '0.88em' }}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ margin: 0 }}>
          <input type="file" accept=".json,application/json" onChange={handleOpen} style={{ marginRight: 8 }} />
          <span style={{ color: '#555', fontSize: '0.97em', fontStyle: 'italic' }}>{filename}</span>
        </label>
        <label style={{ marginLeft: 0 }}>
          Visibility:
          <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="secret">Secret</option>
          </select>
        </label>
      </div>
      <form onSubmit={e => e.preventDefault()}>
        <div style={{ display: "flex", gap: 8, fontWeight: "bold", marginBottom: 4 }}>
          <span style={{ width: 120 }}>Stickytype</span>
          <span style={{ width: 300 }}>Note</span>
          <span style={{ width: 200 }}>Links</span>
          <span style={{ width: 90 }}>Flag</span>
        </div>
        {stickyArr.filter(entry => visibility === "secret" || (entry.flag || "secret") === visibility).map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={entry.stickytype || ""}
              onChange={e => handleFieldChange(idx, "stickytype", e.target.value)}
              style={{ width: 120 }}
              placeholder="Stickytype"
            />
            <input
              type="text"
              value={entry.note || ""}
              onChange={e => handleFieldChange(idx, "note", e.target.value)}
              style={{ width: 300 }}
              placeholder="Note"
            />
            <input
              type="text"
              value={entry.links || ""}
              onChange={e => handleFieldChange(idx, "links", e.target.value)}
              style={{ width: 200 }}
              placeholder="Links"
            />
            <select
              value={entry.flag || "secret"}
              onChange={e => handleFieldChange(idx, "flag", e.target.value)}
              style={{ width: 90 }}
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="secret">secret</option>
            </select>
            <button type="button" onClick={() => {
              setJsonData(prev => {
                if (!prev) return prev;
                const newData = { ...prev };
                newData[stickyKey] = newData[stickyKey].filter((_, i) => i !== idx);
                return newData;
              });
            }} style={{ color: '#b00', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }} title="Delete this row">✕</button>
          </div>
        ))}
        <button type="button" onClick={handleAddSticky} style={{ marginTop: 8, marginRight: 8 }}>
          Add Record
        </button>
      </form>
      <div style={{ marginTop: 12, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 7, background: C.bg }}>
        <span style={{ fontWeight: 700, color: C.primary, fontSize: '0.88em', marginRight: 8 }}>Backup / Version History</span>
        <VersionHistory backups={backups} onRestore={handleRestore} />
      </div>
    </div>
  );
}
