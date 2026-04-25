import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil";

// Jedit: JSON Editor Component
export default function Jedit() {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [saveStatus] = useState("");
  const [visibility, setVisibility] = useState("secret"); // visibility filter

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
    const idx = e.target.value;
    if (idx === "") return;
    const profile = userIndex[idx];
    setFilename(profile.fileName);
    try {
      const res = await fetch(`/${profile.fileName}`);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setJsonData(data);
      setError("");
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
      // Defensive: clone the array to avoid mutation
      newData[profileKey] = Array.isArray(newData[profileKey]) ? [...newData[profileKey]] : [];
      newData[profileKey].push({
        label: "new label",
        value: "",
        flag: "",
        todo: "",
        comment: ""
      });
      return newData;
    });
  }, []);

  // Save as JSON file and backup to backend (no local download)
  // Save as JSON file (download)
  const handleSaveAs = () => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "edited.json";
    a.click();
    URL.revokeObjectURL(a.href);
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
            {userIndex.map((profile, idx) => (
              <option key={profile.profileId} value={idx}>
                {profile.profileId} - {profile.description}
              </option>
            ))}
          </select>
        )}
        <div style={{ margin: "16px 0 8px 0", color: "#888", fontSize: "0.95em" }}>or open a file manually:</div>
        <label style={{ margin: 0 }}>
          <input type="file" accept=".json,application/json" onChange={handleOpen} style={{ marginRight: 8 }} />
          <span style={{ color: '#555', fontSize: '0.97em', fontStyle: 'italic' }}>{filename}</span>
        </label>
      </div>
    );
  }

  const profileKey = Object.keys(jsonData)[0];
  const profileArr = jsonData[profileKey];
  // Filter records based on visibility
  const allowedFlags = visibility === "secret" ? ["secret", "private", "public"] : visibility === "private" ? ["private", "public"] : ["public"];
  const filteredProfileArr = profileArr.filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
      {saveStatus && <div style={{ color: saveStatus.startsWith("Saved") ? "green" : "#b00", marginBottom: 8 }}>{saveStatus}</div>}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ margin: 0 }}>
          <input type="file" accept=".json,application/json" onChange={handleOpen} style={{ marginRight: 8 }} />
          <span style={{ color: '#555', fontSize: '0.97em', fontStyle: 'italic' }}>{filename}</span>
        </label>
        <label style={{ marginLeft: 16 }}>
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
        {filteredProfileArr.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={entry.label}
              onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
              style={{ width: 100 }}
              placeholder="label"
            />
            <input
              type="text"
              value={entry.value}
              onChange={(e) => handleFieldChange(idx, "value", e.target.value)}
              style={{ width: 100 }}
              placeholder="value"
            />
            <input
              type="text"
              value={entry.flag || ""}
              onChange={(e) => handleFieldChange(idx, "flag", e.target.value)}
              style={{ width: 70 }}
              placeholder="flag"
            />
            <input
              type="text"
              value={entry.todo || ""}
              onChange={(e) => handleFieldChange(idx, "todo", e.target.value)}
              style={{ width: 120 }}
              placeholder="todo"
            />
            <input
              type="text"
              value={entry.comment || ""}
              onChange={(e) => handleFieldChange(idx, "comment", e.target.value)}
              style={{ width: 120 }}
              placeholder="comment"
            />
          </div>
        ))}
        <button type="button" onClick={handleAddItem} style={{ marginTop: 8, marginRight: 8 }}>
          Add Item
        </button>
        <button type="submit" style={{ marginTop: 8, marginLeft: 8 }}>
          Save As
        </button>
      </form>
    </div>
  );
}
