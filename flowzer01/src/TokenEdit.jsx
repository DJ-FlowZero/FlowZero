import React, { useState, useEffect } from "react";
import { fetchUserIndex, getGestaltFileUrl } from "./userIndexUtil";

// Use a constant for the profile description field
const PROFILE_DESCRIPTION_LABEL = "description";

// TokenEdit: JSON Token Editor Component
export default function TokenEdit() {
  const [jsonData, setJsonData] = useState(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [userIndex, setUserIndex] = useState([]);
  const [profileLabels, setProfileLabels] = useState([]); // [{label, idx, tokenFile, description}]
  const [loadingIndex, setLoadingIndex] = useState(true);

    // Load user index on mount
    useEffect(() => {
      fetchUserIndex()
        .then(async (data) => {
          setUserIndex(data);
          // Fetch each profile file and extract a display label
          const labels = await Promise.all(
            data.map(async (profile, idx) => {
              const tokenFile = profile.fileName.replace(/\.json$/, "_token.json");
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
                  tokenFile,
                  description: profile.description
                };
              } catch {
                return {
                  label: profile.profileId,
                  idx,
                  tokenFile,
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
  const [visibility, setVisibility] = useState("secret"); // visibility filter
  const [selectedProfile, setSelectedProfile] = useState(null); // {label, description, tokenFile}


  // Load JSON file from file picker
  // Removed unused handleOpen function

  // Load JSON file by fileName (from user index)
  const handleProfileSelect = async (e) => {
    const idx = Number(e.target.value);
    if (isNaN(idx)) return;
    const profile = userIndex[idx];
    // Guess token file name
    const tokenFile = profile.fileName.replace(/\.json$/, "_token.json");
    setFilename(tokenFile);
    // Find the label/description from profileLabels
    const labelObj = profileLabels.find(l => l.idx == idx);
    setSelectedProfile(labelObj || null);
    try {
      const gestaltPath = await getGestaltFileUrl(tokenFile);
      const res = await fetch(gestaltPath);
      if (!res.ok) throw new Error("Failed to load file");
      const data = await res.json();
      setJsonData(data);
      setError("");
    } catch {
      setError("Failed to load or parse token file.");
      setJsonData(null);
    }
  };

  // Handle field change
  const handleFieldChange = (tokenIdx, key, value) => {
    setJsonData((prev) => {
      const newData = { ...prev };
      newData[tokenKey][tokenIdx][key] = value;
      return newData;
    });
  };

  // Add new token
  const handleAddToken = () => {
    setJsonData((prev) => {
      const newData = { ...prev };
      const tokenKey = Object.keys(newData)[0];
      if (!newData[tokenKey]) newData[tokenKey] = [];
      newData[tokenKey].push({
        Token: "[new_token]",
        Meaning: "",
        Usage: ""
      });
      return newData;
    });
  };

  // Save as JSON file
  const handleSaveAs = () => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || "edited_token.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };


  if (error) return <div style={{ color: "red" }}>{error}</div>;

  if (!jsonData) {
    return (
      <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
        <div style={{ marginBottom: 16 }}>
          <b>Choose a Profile to Load Tokens:</b>
        </div>
        {loadingIndex ? (
          <div>Loading profiles...</div>
        ) : profileLabels.length === 0 ? (
          <div>No profiles found in fz_user_index.json.</div>
        ) : (
          <select onChange={handleProfileSelect} defaultValue="">
            <option value="">-- Select Profile --</option>
            {profileLabels.map(({label, idx, tokenFile, description}) => (
              <option key={tokenFile} value={idx}>
                {label} ({tokenFile}) - {description}
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
            <b>Loaded file:</b> {filename} {filename.endsWith('_token.json') && <span style={{color:'#090', marginLeft:8}}>[Token File]</span>}
          </div>
        )}
      </div>
    );
  }

  const tokenKey = Object.keys(jsonData)[0];
  const tokenArr = jsonData[tokenKey];
  // Filter records based on visibility
  // No allowedFlags needed; render tokenArr directly
  // No filteredTokenArr needed; render tokenArr directly
  // Sort by label
  // No sort/delete UI. Just render the array as before.
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
          <span style={{ width: 120 }}>Token</span>
          <span style={{ width: 180 }}>Meaning</span>
          <span style={{ width: 220 }}>Usage</span>
          <span style={{ width: 90 }}>Flag</span>
        </div>
        {tokenArr && tokenArr.filter(entry => visibility === "secret" || (entry.flag || "secret") === visibility).map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={entry.Token}
              onChange={(e) => handleFieldChange(idx, "Token", e.target.value)}
              style={{ width: 120 }}
              placeholder="Token (e.g. [token])"
            />
            <input
              type="text"
              value={entry.Meaning}
              onChange={(e) => handleFieldChange(idx, "Meaning", e.target.value)}
              style={{ width: 180 }}
              placeholder="Meaning"
            />
            <input
              type="text"
              value={entry.Usage}
              onChange={(e) => handleFieldChange(idx, "Usage", e.target.value)}
              style={{ width: 220 }}
              placeholder="Usage"
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
        <button type="button" onClick={handleAddToken} style={{ marginTop: 8, marginRight: 8 }}>
          Add Record
        </button>
        <button type="button" onClick={handleSaveAs} style={{ marginTop: 8, marginLeft: 8 }}>
          Save As
        </button>
      </form>
    </div>
  );
}
