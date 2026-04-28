import React, { useState, useEffect } from "react";

export default function TextFileBackandSave() {
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [txtFiles, setTxtFiles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedFetchPath, setSelectedFetchPath] = useState("");

  useEffect(() => {
    fetch('/api/list-txt-files')
      .then(r => r.json())
      .then(data => { setTxtFiles(data); setLoadingList(false); })
      .catch(() => { setTxtFiles([]); setLoadingList(false); });
  }, []);

  const loadText = async (fetchPath, fname) => {
    setStatus("Loading...");
    try {
      const res = await fetch(`/${fetchPath}?_=` + Date.now());
      if (!res.ok) throw new Error("File not found at /" + fetchPath);
      const data = await res.text();
      setText(data);
      setFilename(fname);
      setEditing(true);
      setStatus("");
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  };

  const handleDropdownChange = (e) => {
    const fetchPath = e.target.value;
    setSelectedFetchPath(fetchPath);
    if (!fetchPath) return;
    const file = txtFiles.find(f => f.fetchPath === fetchPath);
    if (file) loadText(file.fetchPath, file.name);
  };

  const saveToGestalt = async () => {
    setStatus("Saving...");
    const res = await fetch("/api/save-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, filename })
    });
    const result = await res.json();
    setStatus(result.message || "Saved.");
    setEditing(false);
    setSelectedFetchPath("");
  };

  const publishFromNewState = async () => {
    if (!filename) { setStatus("Select a file first."); return; }
    if (!window.confirm(`Copy NewState/${filename} → Gestalt/${filename}?`)) {
      setStatus("Cancelled.");
      return;
    }
    setStatus("Publishing...");
    const res = await fetch("/api/refresh-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    });
    const data = await res.json();
    setStatus(data.message);
  };

  return (
    <div style={{ border: "1px solid #aaa", padding: 16, borderRadius: 8, margin: 24 }}>
      <h3 style={{ marginTop: 0 }}>Text File Editor</h3>
      {!editing ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 'bold', marginRight: 8 }}>Choose file:</label>
            {loadingList ? (
              <span style={{ color: '#888' }}>Loading...</span>
            ) : txtFiles.length === 0 ? (
              <span style={{ color: 'red' }}>No files found — backend may need restart</span>
            ) : (
              <select
                value={selectedFetchPath}
                onChange={handleDropdownChange}
                style={{ minWidth: 240, fontSize: '1em', padding: '4px 8px' }}
              >
                <option value="">-- select --</option>
                {txtFiles.map(f => (
                  <option key={f.fetchPath} value={f.fetchPath}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ marginBottom: 12, color: '#666', fontSize: '0.9em' }}>
            Or open a local file:&nbsp;
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                file.text().then(data => {
                  setText(data);
                  setFilename(file.name);
                  setEditing(true);
                  setStatus("");
                });
              }}
            />
          </div>
          <button onClick={publishFromNewState} style={{ fontSize: '0.95em', padding: '6px 14px' }}>
            Publish NewState → Gestalt
          </button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <b>Editing: {filename}</b>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={18}
            style={{ width: '100%', minWidth: 400, marginBottom: 12, fontSize: '0.9em', lineHeight: '1.4', boxSizing: 'border-box' }}
          />
          <button onClick={saveToGestalt} style={{ marginRight: 12 }}>Save to Gestalt</button>
          <button onClick={() => { setEditing(false); setSelectedFetchPath(""); }}>Cancel</button>
        </>
      )}
      <div style={{ marginTop: 16, color: '#007' }}>{status}</div>
    </div>
  );
}
