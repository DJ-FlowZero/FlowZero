import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil";

// Utility to load config.json
async function getFZ_GPATH() {
  try {
    const res = await fetch('/config.json');
    if (!res.ok) throw new Error();
    const cfg = await res.json();
    return cfg.FZ_GPATH || '.\\Gestalt';
  } catch {
    return '.\\Gestalt';
  }
}

// Jedit: JSON Editor Component
export default function Jedit() {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [saveStatus] = useState("");
  const [visibility, setVisibility] = useState("secret"); // visibility filter
  const [selectedProfile, setSelectedProfile] = useState(null); // {profileId, description}

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
      const FZ_GPATH = await getFZ_GPATH();
      const gestaltPath = `${FZ_GPATH.replace(/^[.\\/]+/, '')}/${fileName}`.replace(/\\/g, '/');
      const res = await fetch(`/${gestaltPath}`);
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveAs();
        }}
      >
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
        <button type="button" onClick={handleSaveAs} style={{ marginTop: 8, marginLeft: 8 }}>
          Save As
        </button>
      </form>
    </div>
  );
}
