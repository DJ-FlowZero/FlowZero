import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil";

// Jedit: JSON Editor Component
export default function Jedit({ initialFile = "/fz0000.json" }) {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(true);

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
    } catch (err) {
      setError("Invalid JSON file.");
    }
  };

  // Load JSON file by fileName (from user index)
  const handleProfileSelect = async (e) => {
    const idx = e.target.value;
    if (idx === "") return;
    const profile = userIndex[idx];
    setSelectedProfile(profile);
    setFilename(profile.fileName);
    try {
      const res = await fetch(`/${profile.fileName}`);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setJsonData(data);
      setError("");
    } catch (err) {
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

  // Save as JSON file
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

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ margin: 0 }}>
          <input type="file" accept=".json,application/json" onChange={handleOpen} style={{ marginRight: 8 }} />
          <span style={{ color: '#555', fontSize: '0.97em', fontStyle: 'italic' }}>{filename}</span>
        </label>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAs();
        }}
      >
        {profileArr.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={entry.label}
              onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
              style={{ width: 120 }}
              placeholder="label"
            />
            <input
              type="text"
              value={entry.value}
              onChange={(e) => handleFieldChange(idx, "value", e.target.value)}
              style={{ width: 180 }}
              placeholder="value"
            />
            <input
              type="text"
              value={entry.flag || ""}
              onChange={(e) => handleFieldChange(idx, "flag", e.target.value)}
              style={{ width: 80 }}
              placeholder="flag"
            />
          </div>
        ))}
        <button type="button" onClick={handleSaveAs} style={{ marginTop: 8 }}>
          Save As
        </button>
      </form>
    </div>
  );
}
