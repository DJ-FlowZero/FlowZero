import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil";

export default function PuckCreator() {
  const [userIndex, setUserIndex] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [profileData, setProfileData] = useState([]);
  const [tokenData, setTokenData] = useState([]);
  const [stickyData, setStickyData] = useState([]);
  // Selection state: store selected indices for all data, not just visible
  const [selectedProfileRows, setSelectedProfileRows] = useState([]); // indices in profileData
  const [selectedTokenRows, setSelectedTokenRows] = useState([]); // indices in tokenData
  const [selectedStickyRows, setSelectedStickyRows] = useState([]); // indices in stickyData
  const [visibility, setVisibility] = useState("secret");

  useEffect(() => {
    fetchUserIndex().then(setUserIndex);
  }, []);

  // Filter profile, tokens, and stickies by visibility and add _originalIdx for selection
  const allowedFlags = visibility === "secret" ? ["secret", "private", "public"] : visibility === "private" ? ["private", "public"] : ["public"];
  const filteredProfileData = profileData
    .map((entry, idx) => ({ ...entry, _originalIdx: idx }))
    .filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));
  const filteredTokenData = tokenData
    .map((entry, idx) => ({ ...entry, _originalIdx: idx }))
    .filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));
  const filteredStickyData = stickyData
    .map((entry, idx) => ({ ...entry, _originalIdx: idx }))
    .filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));

  useEffect(() => {
    if (!selectedProfile) {
      setProfileData([]);
      setTokenData([]);
      setStickyData([]);
      setSelectedProfileRows([]);
      setSelectedTokenRows([]);
      setSelectedStickyRows([]);
      return;
    }
    const base = selectedProfile.replace('.json', '');
    Promise.all([
      fetch(`/${base}.json`).then(r => r.json()).catch(() => null),
      fetch(`/${base}_token.json`).then(r => r.json()).catch(() => null),
      fetch(`/${base}_sticky.json`).then(r => r.json()).catch(() => null)
    ]).then(([profile, token, sticky]) => {
      const profileArr = Array.isArray(profile?.profile) ? profile.profile : [];
      const tokenArr = Array.isArray(token?.FZ_Tokens) ? token.FZ_Tokens : [];
      const stickyArr = Array.isArray(sticky?.sticky) ? sticky.sticky : [];
      setProfileData(profileArr);
      setTokenData(tokenArr);
      setStickyData(stickyArr);
      // Select all by default only if data is not empty
      setSelectedProfileRows(profileArr.length > 0 ? profileArr.map((_, idx) => idx) : []);
      setSelectedTokenRows(tokenArr.length > 0 ? tokenArr.map((_, idx) => idx) : []);
      setSelectedStickyRows(stickyArr.length > 0 ? stickyArr.map((_, idx) => idx) : []);
    });
  }, [selectedProfile]);



  // Derived: which visible rows are selected?
  const visibleSelectedProfileRows = filteredProfileData
    .map(entry => entry._originalIdx)
    .filter(idx => selectedProfileRows.includes(idx));
  const visibleSelectedTokenRows = filteredTokenData
    .map(entry => entry._originalIdx)
    .filter(idx => selectedTokenRows.includes(idx));
  const visibleSelectedStickyRows = filteredStickyData
    .map(entry => entry._originalIdx)
    .filter(idx => selectedStickyRows.includes(idx));

  // When visibility changes, reselect all visible rows
  // Filter profile, tokens, and stickies by visibility
  // allowedFlags already declared above
  // filteredProfileData, filteredTokenData, filteredStickyData already declared above if needed


  // Select All / Deselect All handlers
  const handleSelectAllProfile = () => {
    const visibleIdxs = filteredProfileData.map(entry => entry._originalIdx);
    if (visibleSelectedProfileRows.length === visibleIdxs.length) {
      setSelectedProfileRows(selectedProfileRows.filter(idx => !visibleIdxs.includes(idx)));
    } else {
      setSelectedProfileRows(Array.from(new Set([...selectedProfileRows, ...visibleIdxs])));
    }
  };
  const handleSelectAllToken = () => {
    const visibleIdxs = filteredTokenData.map(entry => entry._originalIdx);
    if (visibleSelectedTokenRows.length === visibleIdxs.length) {
      setSelectedTokenRows(selectedTokenRows.filter(idx => !visibleIdxs.includes(idx)));
    } else {
      setSelectedTokenRows(Array.from(new Set([...selectedTokenRows, ...visibleIdxs])));
    }
  };
  const handleSelectAllSticky = () => {
    const visibleIdxs = filteredStickyData.map(entry => entry._originalIdx);
    if (visibleSelectedStickyRows.length === visibleIdxs.length) {
      setSelectedStickyRows(selectedStickyRows.filter(idx => !visibleIdxs.includes(idx)));
    } else {
      setSelectedStickyRows(Array.from(new Set([...selectedStickyRows, ...visibleIdxs])));
    }
  };

  const handleProfileChange = (e) => {
    setSelectedProfile(e.target.value);
  };

  const handleProfileCheckbox = (idx) => {
    setSelectedProfileRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };
  const handleTokenCheckbox = (idx) => {
    setSelectedTokenRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };
  const handleStickyCheckbox = (idx) => {
    setSelectedStickyRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleExport = () => {
    const exportObj = {};
    if (selectedProfileRows.length > 0) {
      exportObj.profile = profileData.filter((_, idx) => selectedProfileRows.includes(idx));
    }
    if (selectedTokenRows.length > 0) {
      exportObj.FZ_Tokens = tokenData.filter((_, idx) => selectedTokenRows.includes(idx));
    }
    if (selectedStickyRows.length > 0) {
      exportObj.sticky = stickyData.filter((_, idx) => selectedStickyRows.includes(idx));
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PUCK_export_${selectedProfile}`;
    a.click();
    URL.revokeObjectURL(url);
  };



  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <label htmlFor="profileSelect" style={{ fontWeight: "bold", marginRight: 8 }}>Profile:</label>
          <select id="profileSelect" value={selectedProfile} onChange={handleProfileChange} style={{ fontSize: "1em", padding: "4px 12px" }}>
            <option value="">-- Select Profile --</option>
            {userIndex.map((opt) => (
              <option key={opt.fileName} value={opt.fileName}>{opt.realName || opt.fileName}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: "bold", marginRight: 8, color: '#15396a', fontSize: '1.1em' }}>Show Gestalt:</label>
          <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ fontSize: "1em", padding: "4px 12px", fontWeight: 'bold', color: '#15396a' }}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="secret">Secret</option>
          </select>
        </div>
      </div>
      {/* Profile block */}
      {filteredProfileData.length > 0 && (
        <div style={{ border: "1px solid #ccc", borderRadius: 6, marginBottom: 16, padding: 12, background: '#fff' }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6}}>
            <span style={{fontWeight: 'bold', color: '#15396a'}}>Profile</span>
            <button type="button" onClick={handleSelectAllProfile} style={{fontSize: '0.95em', padding: '2px 10px', borderRadius: 5, border: '1px solid #15396a', background: '#eaf1fa', color: '#15396a', fontWeight: 500, cursor: 'pointer'}}>
              {selectedProfileRows.length === filteredProfileData.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {filteredProfileData.map((entry) => (
            <div key={entry._originalIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <input
                type="checkbox"
                checked={selectedProfileRows.includes(entry._originalIdx)}
                onChange={() => handleProfileCheckbox(entry._originalIdx)}
              />
              {Object.entries(entry).map(([key, val]) => (
                <span key={key} style={{ minWidth: 80, fontFamily: 'monospace', fontSize: '0.98em', color: '#444', background: '#f3f6fa', borderRadius: 4, padding: '2px 6px', marginRight: 4 }}>
                  <span style={{ color: '#15396a', fontWeight: 500 }}>{key}:</span> {String(val)}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {/* Token block */}
      {filteredTokenData.length > 0 && (
        <div style={{ border: "1px solid #ccc", borderRadius: 6, marginBottom: 16, padding: 12, background: '#fff' }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6}}>
            <span style={{fontWeight: 'bold', color: '#15396a'}}>Tokens</span>
            <button type="button" onClick={handleSelectAllToken} style={{fontSize: '0.95em', padding: '2px 10px', borderRadius: 5, border: '1px solid #15396a', background: '#eaf1fa', color: '#15396a', fontWeight: 500, cursor: 'pointer'}}>
              {selectedTokenRows.length === filteredTokenData.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {filteredTokenData.map((entry) => (
            <div key={entry._originalIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={selectedTokenRows.includes(entry._originalIdx)}
                onChange={() => handleTokenCheckbox(entry._originalIdx)}
              />
              <span style={{ fontWeight: 500 }}>{entry.Token || entry.label}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.98em", color: '#444' }}>{entry.Meaning || entry.value}</span>
            </div>
          ))}
        </div>
      )}
      {/* Sticky block */}
      {filteredStickyData.length > 0 && (
        <div style={{ border: "1px solid #ccc", borderRadius: 6, marginBottom: 16, padding: 12, background: '#fff' }}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6}}>
            <span style={{fontWeight: 'bold', color: '#15396a'}}>Sticky</span>
            <button type="button" onClick={handleSelectAllSticky} style={{fontSize: '0.95em', padding: '2px 10px', borderRadius: 5, border: '1px solid #15396a', background: '#eaf1fa', color: '#15396a', fontWeight: 500, cursor: 'pointer'}}>
              {selectedStickyRows.length === filteredStickyData.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {filteredStickyData.map((entry) => (
            <div key={entry._originalIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={selectedStickyRows.includes(entry._originalIdx)}
                onChange={() => handleStickyCheckbox(entry._originalIdx)}
              />
              <span style={{ fontWeight: 500 }}>{entry.stickytype}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.98em", color: '#444' }}>{entry.note}</span>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleExport}
        disabled={selectedProfileRows.length + selectedTokenRows.length + selectedStickyRows.length === 0}
        style={{
          padding: "8px 18px",
          fontSize: "1em",
          border: "3px solid #15396a",
          background: (selectedProfileRows.length + selectedTokenRows.length + selectedStickyRows.length) ? "#15396a" : "#b0b8c9",
          color: "#fff",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: (selectedProfileRows.length + selectedTokenRows.length + selectedStickyRows.length) ? "pointer" : "not-allowed"
        }}
      >
        Export
      </button>
    </div>
  );
}
