import React, { useState, useEffect } from "react";

const PUCK_INDEX_URL = "/fz_PUCK_data/fz_puck_index.json";

export default function PuckLibrary() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    fetch(PUCK_INDEX_URL)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Could not load fz_puck_index.json"); setLoading(false); });
  }, []);

  const handleFieldChange = (idx, key, value) => {
    setEntries(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  const handleSave = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fz_puck_index.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setSaveStatus("Downloaded fz_puck_index.json — replace file in public/fz_PUCK_data/ to persist.");
    setTimeout(() => setSaveStatus(""), 6000);
  };

  const handleDownloadPuck = (filename) => {
    const a = document.createElement("a");
    a.href = `/fz_PUCK_data/${filename}`;
    a.download = filename;
    a.click();
  };

  if (loading) return <div>Loading PUCK Library...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 860 }}>
      <h3 style={{ color: '#15396a', marginTop: 0 }}>PUCK Library</h3>
      {saveStatus && <div style={{ color: "green", marginBottom: 8, fontSize: '0.92em' }}>{saveStatus}</div>}

      {/* Column headings */}
      <div style={{ display: "flex", gap: 8, fontWeight: 'bold', fontSize: '0.88em', color: '#444', marginBottom: 6, borderBottom: '1px solid #ddd', paddingBottom: 4, width: '100%' }}>
        <span style={{ width: 160 }}>Name</span>
        <span style={{ width: 70 }}>Visibility</span>
        <span style={{ width: 90 }}>Date</span>
        <span style={{ flex: 1 }}>Description</span>
        <span style={{ width: 70 }}>Download</span>
      </div>

      {entries.length === 0 && (
        <div style={{ color: '#888', fontSize: '0.93em' }}>No PUCKs in library yet.</div>
      )}

      {entries.map((entry, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: 'center', width: '100%' }}>
          {/* name — read-only */}
          <input
            type="text"
            value={entry.name || ""}
            readOnly
            style={{ width: 160, background: '#f5f5f5', color: '#555', fontSize: '0.9em', borderRadius: 4, border: '1px solid #ddd', padding: '3px 6px' }}
            title="PUCK name — edit fz_puck_index.json to change"
          />
          {/* visibility — read-only */}
          <input
            type="text"
            value={entry.visibility || ""}
            readOnly
            style={{ width: 70, background: '#f5f5f5', color: '#555', fontSize: '0.9em', borderRadius: 4, border: '1px solid #ddd', padding: '3px 6px' }}
          />
          {/* date — read-only */}
          <input
            type="text"
            value={entry.date || ""}
            readOnly
            style={{ width: 90, background: '#f5f5f5', color: '#555', fontSize: '0.9em', borderRadius: 4, border: '1px solid #ddd', padding: '3px 6px' }}
          />
          {/* description — editable */}
          <input
            type="text"
            value={entry.description || ""}
            onChange={e => handleFieldChange(idx, "description", e.target.value)}
            style={{ flex: 1, fontSize: '0.9em', borderRadius: 4, border: '1px solid #bbb', padding: '3px 6px' }}
            placeholder="Description"
            title="Editable — describe what this PUCK is for"
          />
          {/* download button */}
          <button
            type="button"
            onClick={() => handleDownloadPuck(entry.filename)}
            style={{ width: 70, background: '#e8f0fe', border: '1px solid #b0c4ef', borderRadius: 4, padding: '3px 6px', cursor: 'pointer', fontSize: '0.88em', color: '#15396a' }}
            title={`Download ${entry.filename}`}
          >
            ↓ Get
          </button>
        </div>
      ))}

      <button type="button" onClick={handleSave} style={{ marginTop: 8, marginLeft: 8 }}>
        Save Index
      </button>
    </div>
  );
}
