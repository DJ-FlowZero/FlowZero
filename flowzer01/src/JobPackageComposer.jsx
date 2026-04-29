import React, { useState, useEffect } from "react";

const PUCK_INDEX_URL = "/fz_PUCK_data/fz_puck_index.json";

export default function JobPackageComposer() {
  const [entries, setEntries] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState({}); // { filename: true/false }
  const [jobBrief, setJobBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    fetch(PUCK_INDEX_URL)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => setLoadError("Could not load fz_puck_index.json"));
  }, []);

  const toggleSelect = (filename) => {
    setSelected(prev => ({ ...prev, [filename]: !prev[filename] }));
  };

  const selectedEntries = entries.filter(e => selected[e.filename]);

  const handleGenerate = async () => {
    if (!jobBrief.trim() && selectedEntries.length === 0) {
      setGenError("Add a job brief or select at least one PUCK.");
      return;
    }
    setGenError("");
    setGenerating(true);

    try {
      const date = new Date().toISOString().slice(0, 10);
      let parts = [];

      parts.push(`=== COMPOSITE PUCK ===`);
      parts.push(`Generated: ${date}`);

      if (jobBrief.trim()) {
        parts.push(`\n--- JOB BRIEF ---`);
        parts.push(jobBrief.trim());
      }

      for (const entry of selectedEntries) {
        const res = await fetch(`/fz_PUCK_data/${entry.filename}`);
        if (!res.ok) throw new Error(`Could not fetch ${entry.filename}`);
        const text = await res.text();
        parts.push(`\n--- PUCK: ${entry.name} ---`);
        parts.push(text.trim());
      }

      const composite = parts.join("\n\n");
      const blob = new Blob([composite], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `CompositePUCK_${date}.txt`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setGenError(err.message || "Failed to generate CompositePUCK.");
    } finally {
      setGenerating(false);
    }
  };

  if (loadError) return <div style={{ color: "red" }}>{loadError}</div>;

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 860 }}>
      <h3 style={{ color: '#15396a', marginTop: 0 }}>Compose Job Package</h3>

      {/* Job Brief */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6, color: '#15396a' }}>
          Job Brief
        </label>
        <textarea
          value={jobBrief}
          onChange={e => setJobBrief(e.target.value)}
          placeholder="Describe the task, context, or instructions for this job package..."
          rows={6}
          style={{
            width: '100%',
            fontSize: '0.95em',
            borderRadius: 4,
            border: '1px solid #bbb',
            padding: '8px 10px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* PUCK selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 6, color: '#15396a' }}>
          Select PUCKs to include
        </label>
        {entries.length === 0 ? (
          <div style={{ color: '#888', fontSize: '0.93em' }}>No PUCKs in library yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.map((entry, idx) => (
              <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.95em' }}>
                <input
                  type="checkbox"
                  checked={!!selected[entry.filename]}
                  onChange={() => toggleSelect(entry.filename)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 500, color: '#15396a' }}>{entry.name}</span>
                {entry.visibility && (
                  <span style={{ fontSize: '0.82em', color: '#888', background: '#f0f0f0', borderRadius: 4, padding: '1px 6px' }}>
                    {entry.visibility}
                  </span>
                )}
                {entry.description && (
                  <span style={{ fontSize: '0.85em', color: '#555' }}>— {entry.description}</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Status / error */}
      {genError && <div style={{ color: 'red', fontSize: '0.92em', marginBottom: 8 }}>{genError}</div>}

      {/* Actions */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          style={{ marginTop: 8, marginLeft: 8 }}
        >
          {generating ? "Generating..." : "Generate CompositePUCK"}
        </button>
        <span style={{ fontSize: '0.82em', color: '#888', marginTop: 8 }}>
          {selectedEntries.length > 0
            ? `${selectedEntries.length} PUCK${selectedEntries.length > 1 ? 's' : ''} selected`
            : "No PUCKs selected"}
        </span>
      </div>
    </div>
  );
}
