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

// Jedit: JSON Editor Component
export default function Jedit() {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [visibility, setVisibility] = useState("secret"); // visibility filter
  const [selectedProfile, setSelectedProfile] = useState(null); // {profileId, description}
  const [rawContent, setRawContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ message: '', isError: false });
  const [backups, setBackups] = useState([]);

  // Load user index on mount
  useEffect(() => {
    fetchUserIndex()
      .then((data) => {
        setUserIndex(data);
        setLoadingIndex(false);
      })
      .catch(() => {
        setUserIndex([]);
        setLoadingIndex(false);
      });
  }, []);

  // Load JSON file from file picker (legacy/manual)
  const handleOpen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilename(file.name);
    if (file.name === "fz_user_index.json") {
      setError("Only Profiles can be edited with Profile Edit.");
      setJsonData(null);
      return;
    }
    if (!/^fz.*\.json$/i.test(file.name)) {
      setError("Only files starting with 'fz' can be opened.");
      setJsonData(null);
      return;
    }
    try {
      const text = await file.text();
      setJsonData(JSON.parse(text));
      setError("");
    } catch {
      setError("Invalid JSON file.");
    }
  };

  // Load JSON file by fileName (from user index)
  const handleProfileSelect = async (e) => {
    const fileName = e.target.value;
    if (!fileName) return;
    setFilename(fileName);
    const profile = userIndex.find(p => p.fileName === fileName);
    setSelectedProfile(profile ? { profileId: profile.profileId, description: profile.description } : null);
    try {
      const gestaltPath = await getGestaltFileUrl(fileName);
      const res = await fetch(gestaltPath);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setJsonData(data);
      setRawContent(JSON.stringify(data, null, 2));
      setError("");
      fetch(`/api/profile/backups?filename=${encodeURIComponent(fileName)}`)
        .then(r => r.json()).then(d => setBackups(d.backups || [])).catch(() => {});
    } catch {
      setError("Failed to load or parse profile file.");
      setJsonData(null);
    }
  };

  // No auto-load; fields remain empty until a file is chosen

  // Handle field change
  const handleFieldChange = (profileIdx, key, value) => {
    setJsonData((prev) => {
      const newData = { ...prev };
      const profileKey = Object.keys(newData)[0];
      newData[profileKey][profileIdx][key] = value;
      return newData;
    });
  };


  // Add new profile item
  const handleAddItem = React.useCallback(() => {
    setJsonData(prev => {
      if (!prev) return prev;
      const newData = { ...prev };
      const profileKey = Object.keys(newData)[0];
      newData[profileKey] = Array.isArray(newData[profileKey]) ? [...newData[profileKey]] : [];
      newData[profileKey].push({
        label: "new label",
        value: "",
        flag: "",
        todo: "",
        links: "",
        comment: "",
        type: "",
        subtype: "",
        alias: ""
      });
      return newData;
    });
  }, []);

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
          <b>Choose a Profile to Edit:</b>
        </div>
        {loadingIndex ? (
          <div>Loading profiles...</div>
        ) : userIndex.length === 0 ? (
          <div>No profiles found in fz_user_index.json.</div>
        ) : (
          <select onChange={handleProfileSelect} defaultValue="">
            <option value="">-- Select Profile --</option>
            {userIndex.map((profile) => (
              <option key={profile.profileId} value={profile.fileName}>
                {profile.profileId} - {profile.description}
              </option>
            ))}
          </select>
        )}
        {filename && selectedProfile && (
          <div style={{ marginTop: 18, marginBottom: 8, padding: 8, background: '#f0f7ff', borderRadius: 6, border: '1px solid #b3d1ff', fontSize: '1.1em', fontWeight: 500 }}>
            <span style={{color:'#003366'}}>
              <span style={{fontWeight:700}}>{selectedProfile.profileId}</span>
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

  // --- Editable Profile Table UI ---
  const profileKey = Object.keys(jsonData)[0];
  const profileArr = jsonData[profileKey];
  const dirty = rawContent !== null && JSON.stringify(jsonData, null, 2) !== rawContent;

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
      {selectedProfile && (
        <div style={{ marginBottom: 18, padding: 8, background: '#f0f7ff', borderRadius: 6, border: '1px solid #b3d1ff', fontSize: '1.1em', fontWeight: 500 }}>
          <span style={{color:'#003366'}}>
            <span style={{fontWeight:700}}>{selectedProfile.profileId}</span>
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
          <span style={{ width: 120 }}>Label</span>
          <span style={{ width: 180 }}>Value</span>
          <span style={{ width: 90 }}>Flag</span>
          <span style={{ width: 120 }}>Type</span>
          <span style={{ width: 120 }}>Subtype</span>
          <span style={{ width: 120 }}>Alias</span>
        </div>
        {profileArr.filter(entry => visibility === "secret" || (entry.flag || "secret") === visibility).map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={entry.label}
              onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
              style={{ width: 120 }}
              placeholder="Label"
            />
            <input
              type="text"
              value={entry.value}
              onChange={(e) => handleFieldChange(idx, "value", e.target.value)}
              style={{ width: 180 }}
              placeholder="Value"
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
            <input
              type="text"
              value={entry.type || ""}
              onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
              style={{ width: 120 }}
              placeholder="Type"
            />
            <input
              type="text"
              value={entry.subtype || ""}
              onChange={(e) => handleFieldChange(idx, "subtype", e.target.value)}
              style={{ width: 120 }}
              placeholder="Subtype"
            />
            <input
              type="text"
              value={entry.alias || ""}
              onChange={(e) => handleFieldChange(idx, "alias", e.target.value)}
              style={{ width: 120 }}
              placeholder="Alias"
            />
          </div>
        ))}
        <button type="button" onClick={handleAddItem} style={{ marginTop: 8, marginRight: 8 }}>
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
