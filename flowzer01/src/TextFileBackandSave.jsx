import React, { useState } from "react";

export default function TextFileBackandSave() {
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("text_text.txt");

  // Load the current file content for editing
  const loadText = async (fname = filename) => {
    setStatus("Loading...");
    try {
      const res = await fetch(`/${fname}?_=` + Date.now());
      if (!res.ok) throw new Error("File not found");
      const data = await res.text();
      setText(data);
      setFilename(fname);
      setEditing(true);
      setStatus("");
    } catch (e) {
      setStatus("Error loading file: " + e.message);
    }
  };

  // Save edited text to NewState
  const saveToNewState = async () => {
    setStatus("Saving...");
    const content = text;
    // Always use the React state for filename
    const res = await fetch("/api/save-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, filename })
    });
    const result = await res.json();
    setStatus(result.message);
    setEditing(false);
  };


  // Refresh (publish) from NewState to public with confirmation
  const refreshToPublic = async () => {
    if (!window.confirm("Are you sure you want to overwrite the public file with the staged version?")) {
      setStatus("Refresh cancelled.");
      return;
    }
    setStatus("Refreshing...");
    const res = await fetch("/api/refresh-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename })
    });
    const data = await res.json();
    setStatus(data.message);
  };

  return (
    <div style={{ border: "1px solid #aaa", padding: 16, borderRadius: 8, maxWidth: 500, margin: 24 }}>
      <h3>Generic Text edit-save-backup-refresh</h3>
      {!editing ? (
        <>
          <div style={{ marginBottom: 8 }}>
            <label>
              Filename:
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                style={{ marginLeft: 8, width: 180 }}
                placeholder="text_text.txt"
              />
              <button onClick={() => loadText(filename)} style={{ marginLeft: 8 }}>Load</button>
            </label>
          </div>
          <button onClick={refreshToPublic} style={{ marginRight: 12 }}>[Refresh] to Public</button>
          <input
            type="file"
            accept=".txt,text/plain"
            style={{ marginLeft: 12 }}
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
            style={{ width: '98vw', maxWidth: '100%', minWidth: 400, marginBottom: 12, fontSize: '0.9em', lineHeight: '1.4' }}
          />
          <button onClick={saveToNewState} style={{ marginRight: 12 }}>Save to NewState</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </>
      )}
      <div style={{ marginTop: 16, color: '#007' }}>{status}</div>
      <div style={{ marginTop: 24, fontSize: '0.95em', color: '#888' }}>
        This function accepts a an input file prompt, and allows edit, backed-up save and re-publish to the \Public directory from \Newstate
      </div>
    </div>
  );
}
