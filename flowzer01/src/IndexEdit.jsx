import React, { useState, useEffect } from "react";
import { createProfileFiles } from "./profileFileUtil";
// Publish utility
async function publishGroupFiles(profileNum) {
  const files = [
    `fz${profileNum}.json`,
    `fz${profileNum}_token.json`,
    `fz${profileNum}_sticky.json`
  ];
  for (const filename of files) {
    await fetch('/api/refresh-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
  }
}

// Utility to fetch and parse fz_profile_index.json
async function fetchProfileIndex() {
  const res = await fetch("/fz_profile_index.json");
  if (!res.ok) throw new Error("Failed to load profile index");
  return await res.json();
}

export default function IndexEdit() {
  const [indexData, setIndexData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    fetchProfileIndex()
      .then((data) => {
        setIndexData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setIndexData([]);
        setLoading(false);
        setError("Failed to load fz_profile_index.json");
      });
  }, []);

  // Handle field change
  const handleFieldChange = (idx, key, value) => {
    setIndexData((prev) => {
      const newData = [...prev];
      newData[idx] = { ...newData[idx], [key]: value };
      return newData;
    });
  };



  // Find next available profile number (e.g., 0004 if fz0003.json exists)
  const getNextProfileNum = () => {
    const nums = indexData
      .map(e => e.fileName)
      .filter(Boolean)
      .map(fn => {
        const m = fn.match(/fz(\d{4})\.json/);
        return m ? parseInt(m[1], 10) : null;
      })
      .filter(n => n !== null);
    return (nums.length ? Math.max(...nums) + 1 : 0).toString().padStart(4, '0');
  };

  // Save changes to fz_profile_index.json
  const handleSaveChanges = () => {
    const blob = new Blob([JSON.stringify(indexData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "fz_profile_index.json";
    a.click();
    URL.revokeObjectURL(a.href);
    setSaveStatus("Saved changes to fz_profile_index.json.");
  };
  const [lastCreatedNum, setLastCreatedNum] = useState(null);
  const handleCreateGroup = async () => {
    const nextNum = getNextProfileNum();
    const profileId = `P${nextNum}`;
    const fileName = `fz${nextNum}.json`;
    const tokenFile = `fz${nextNum}_token.json`;
    const stickyFile = `fz${nextNum}_sticky.json`;
    // Minimal blank profile, token, sticky
    const profileData = { profile: [] };
    const tokenData = { FZ_Tokens: [] };
    const stickyData = { sticky: [] };
    setSaveStatus("Creating group files...");
    try {
      await createProfileFiles(nextNum, profileData, tokenData, stickyData);
      setIndexData(prev => [
        ...prev,
        {
          profileId,
          fileName,
          description: "New group profile",
          realName: "",
          type: "group",
          subtype: "",
          extra: ""
        }
      ]);
      setLastCreatedNum(nextNum);
      setSaveStatus(`Created group: ${fileName}, ${tokenFile}, ${stickyFile}`);
    } catch {
      setSaveStatus("Error creating group files");
    }
  };

  // Handler for publishing the most recently created group files
  const handlePublishGroup = async () => {
    if (!lastCreatedNum) {
      setSaveStatus("No group to publish. Create a group first.");
      return;
    }
    setSaveStatus("Publishing group files...");
    try {
      await publishGroupFiles(lastCreatedNum);
      setSaveStatus("Group files published to public.");
    } catch {
      setSaveStatus("Error publishing group files");
    }
  };

  if (loading) return <div>Loading index...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, maxWidth: 700 }}>
      <h3>Edit fz_profile_index.json</h3>
      {saveStatus && <div style={{ color: "green", marginBottom: 8 }}>{saveStatus}</div>}
      <button type="button" onClick={handleCreateGroup} style={{ marginBottom: 8, background: '#e0e0ff', padding: '6px 18px', borderRadius: 6 }}>
        [Create Group]
      </button>
      <button type="button" onClick={handlePublishGroup} style={{ marginBottom: 16, background: '#d0ffd0', padding: '6px 18px', borderRadius: 6, marginLeft: 12 }}>
        [Publish Group Files]
      </button>
      <form onSubmit={e => e.preventDefault()}>
        {indexData.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              value={entry.profileId || ""}
              readOnly
              style={{ width: 120, background: '#f5f5f5', color: '#888' }}
              placeholder="profileId"
              title="Profile ID is read-only."
            />
            <input
              type="text"
              value={entry.fileName || ""}
              readOnly
              style={{ width: 180, background: '#f5f5f5', color: '#888' }}
              placeholder="fileName"
              title="File name is read-only."
            />
            <input
              type="text"
              value={entry.description || ""}
              onChange={e => handleFieldChange(idx, "description", e.target.value)}
              style={{ width: 200 }}
              placeholder="description"
            />
            <input
              type="text"
              value={entry.extra || ""}
              onChange={e => handleFieldChange(idx, "extra", e.target.value)}
              style={{ width: 120 }}
              placeholder="extra"
            />
          </div>
        ))}
        {/* Add Entry button removed: new entries must be created via Create Group and Publish Group */}
        <button type="button" onClick={handleSaveChanges} style={{ marginTop: 8, marginRight: 8, background: '#ffe0b2', borderRadius: 6 }}>
          Save Changes
        </button>
      </form>
    </div>
  );
}
