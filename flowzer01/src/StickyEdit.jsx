
import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil";

export default function StickyEdit() {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [profileLabels, setProfileLabels] = useState([]); // [{label, idx, stickyFile}]
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [visibility, setVisibility] = useState("secret"); // visibility filter

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
              const res = await fetch(`/${profile.fileName}`);
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
    const idx = e.target.value;
    if (idx === "") return;
    const profile = userIndex[idx];
    const stickyFile = profile.fileName.replace(/\.json$/, "_sticky.json");
    setFilename(stickyFile);
    try {
      const res = await fetch(`/${stickyFile}`);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setJsonData(data);
      setError("");
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
  const handleSaveAs = () => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "edited_sticky.json";
    a.click();
    URL.revokeObjectURL(a.href);
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
  const allowedFlags = visibility === "secret" ? ["secret", "private", "public"] : visibility === "private" ? ["private", "public"] : ["public"];
  const filteredStickyArr = stickyArr.filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAs();
        }}
      >
        {/* Header Row */}
        <div style={{ display: "flex", gap: 8, fontWeight: "bold", marginBottom: 4 }}>
          <span style={{ width: 120 }}>Stickytype</span>
          <span style={{ width: 300 }}>Note</span>
          <span style={{ width: 200 }}>Links</span>
          <span style={{ width: 90 }}>Flag</span>
        </div>
        {filteredStickyArr.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={entry.stickytype}
              onChange={(e) => handleFieldChange(idx, "stickytype", e.target.value)}
              style={{ width: 120 }}
              placeholder="Stickytype"
            />
            <input
              type="text"
              value={entry.note}
              onChange={(e) => handleFieldChange(idx, "note", e.target.value)}
              style={{ width: 300 }}
              placeholder="Note"
            />
            <input
              type="text"
              value={entry.links}
              onChange={(e) => handleFieldChange(idx, "links", e.target.value)}
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
          </div>
        ))}
        <button type="button" onClick={handleAddSticky} style={{ marginTop: 8, marginRight: 8 }}>
          Add Sticky
        </button>
        <button type="button" onClick={handleSaveAs} style={{ marginTop: 8, marginLeft: 8 }}>
          Save As
        </button>
      </form>
    </div>
  );
}
