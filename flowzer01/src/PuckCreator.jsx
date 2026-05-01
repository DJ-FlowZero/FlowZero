import React, { useState, useEffect } from "react";
import { fetchUserIndex, getGestaltFileUrl } from "./userIndexUtil";

export default function PuckCreator() {
  const [userIndex, setUserIndex] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [visibility, setVisibility] = useState("secret");
  const [includeFlowConfig, setIncludeFlowConfig] = useState(false);
  const [flowConfig, setFlowConfig] = useState(null);
  const [exportStatus, setExportStatus] = useState("");
  const [puckState, setPuckState] = useState({
    profileData: [],
    tokenData: [],
    stickyData: [],
    selectedProfileRows: [],
    selectedTokenRows: [],
    selectedStickyRows: []
  });

  useEffect(() => {
    fetchUserIndex().then(setUserIndex);
    // Load Flow Calibration config
    getGestaltFileUrl('FZ_Flow_Config.json').then(url =>
      fetch(url + '?_=' + Date.now()).then(r => r.json()).then(setFlowConfig).catch(() => {})
    );
  }, []);

  // Filter profile, tokens, and stickies by visibility and add _originalIdx for selection
  const allowedFlags = visibility === "secret" ? ["secret", "private", "public"] : visibility === "private" ? ["private", "public"] : ["public"];
  const filteredProfileData = puckState.profileData
    .map((entry, idx) => ({ ...entry, _originalIdx: idx }))
    .filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));
  const filteredTokenData = puckState.tokenData
    .map((entry, idx) => ({ ...entry, _originalIdx: idx }))
    .filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));
  const filteredStickyData = puckState.stickyData
    .map((entry, idx) => ({ ...entry, _originalIdx: idx }))
    .filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));

  useEffect(() => {
    if (!selectedProfile) return;
    const fetchData = async () => {
      const base = selectedProfile.replace('.json', '');
      const [profileUrl, tokenUrl, stickyUrl] = await Promise.all([
        getGestaltFileUrl(`${base}.json`),
        getGestaltFileUrl(`${base}_token.json`),
        getGestaltFileUrl(`${base}_sticky.json`),
      ]);      const [profile, token, sticky] = await Promise.all([
        fetch(profileUrl).then(r => r.json()).catch(() => null),
        fetch(tokenUrl).then(r => r.json()).catch(() => null),
        fetch(stickyUrl).then(r => r.json()).catch(() => null)
      ]);
      const profileArr = Array.isArray(profile?.profile) ? profile.profile : [];
      const tokenArr = Array.isArray(token?.FZ_Tokens) ? token.FZ_Tokens : [];
      const stickyArr = Array.isArray(sticky?.sticky) ? sticky.sticky : [];
      setPuckState({
        profileData: profileArr,
        tokenData: tokenArr,
        stickyData: stickyArr,
        selectedProfileRows: profileArr.length > 0 ? profileArr.map((_, idx) => idx) : [],
        selectedTokenRows: tokenArr.length > 0 ? tokenArr.map((_, idx) => idx) : [],
        selectedStickyRows: stickyArr.length > 0 ? stickyArr.map((_, idx) => idx) : []
      });
    };
    fetchData();
  }, [selectedProfile]);





  // Derived: which visible rows are selected?
  const visibleSelectedProfileRows = filteredProfileData
    .map(entry => entry._originalIdx)
    .filter(idx => puckState.selectedProfileRows.includes(idx));
  const visibleSelectedTokenRows = filteredTokenData
    .map(entry => entry._originalIdx)
    .filter(idx => puckState.selectedTokenRows.includes(idx));
  const visibleSelectedStickyRows = filteredStickyData
    .map(entry => entry._originalIdx)
    .filter(idx => puckState.selectedStickyRows.includes(idx));

  // When visibility changes, reselect all visible rows
  // Filter profile, tokens, and stickies by visibility
  // allowedFlags already declared above
  // filteredProfileData, filteredTokenData, filteredStickyData already declared above if needed


  // Select All / Deselect All handlers
  const handleSelectAllProfile = () => {
    const visibleIdxs = filteredProfileData.map(entry => entry._originalIdx);
    setPuckState(prev => ({
      ...prev,
      selectedProfileRows:
        visibleSelectedProfileRows.length === visibleIdxs.length
          ? prev.selectedProfileRows.filter(idx => !visibleIdxs.includes(idx))
          : Array.from(new Set([...prev.selectedProfileRows, ...visibleIdxs]))
    }));
  };
  const handleSelectAllToken = () => {
    const visibleIdxs = filteredTokenData.map(entry => entry._originalIdx);
    setPuckState(prev => ({
      ...prev,
      selectedTokenRows:
        visibleSelectedTokenRows.length === visibleIdxs.length
          ? prev.selectedTokenRows.filter(idx => !visibleIdxs.includes(idx))
          : Array.from(new Set([...prev.selectedTokenRows, ...visibleIdxs]))
    }));
  };
  const handleSelectAllSticky = () => {
    const visibleIdxs = filteredStickyData.map(entry => entry._originalIdx);
    setPuckState(prev => ({
      ...prev,
      selectedStickyRows:
        visibleSelectedStickyRows.length === visibleIdxs.length
          ? prev.selectedStickyRows.filter(idx => !visibleIdxs.includes(idx))
          : Array.from(new Set([...prev.selectedStickyRows, ...visibleIdxs]))
    }));
  };

  const handleProfileChange = (e) => {
    const value = e.target.value;
    setSelectedProfile(value);
    if (!value) {
      setPuckState(prev => ({
        ...prev,
        profileData: [],
        tokenData: [],
        stickyData: [],
        selectedProfileRows: [],
        selectedTokenRows: [],
        selectedStickyRows: []
      }));
    }
  };

  const handleProfileCheckbox = (idx) => {
    setPuckState(prev => ({
      ...prev,
      selectedProfileRows: prev.selectedProfileRows.includes(idx)
        ? prev.selectedProfileRows.filter(i => i !== idx)
        : [...prev.selectedProfileRows, idx]
    }));
  };
  const handleTokenCheckbox = (idx) => {
    setPuckState(prev => ({
      ...prev,
      selectedTokenRows: prev.selectedTokenRows.includes(idx)
        ? prev.selectedTokenRows.filter(i => i !== idx)
        : [...prev.selectedTokenRows, idx]
    }));
  };
  const handleStickyCheckbox = (idx) => {
    setPuckState(prev => ({
      ...prev,
      selectedStickyRows: prev.selectedStickyRows.includes(idx)
        ? prev.selectedStickyRows.filter(i => i !== idx)
        : [...prev.selectedStickyRows, idx]
    }));
  };

  const handleExport = async () => {
    // Fetch the loader readme text
    let loaderText = '';
    try {
      const loaderUrl = await getGestaltFileUrl('FZ_PUCK_loader_readme.txt');
      const res = await fetch(loaderUrl);
      loaderText = await res.text();
    } catch {
      loaderText = 'FZ_PUCK_loader_readme.txt missing or failed to load.';
    }
    const exportObj = {};
    if (puckState.selectedProfileRows.length > 0) {
      exportObj.profile = puckState.profileData.filter((_, idx) => puckState.selectedProfileRows.includes(idx));
    }
    if (puckState.selectedTokenRows.length > 0) {
      exportObj.FZ_Tokens = puckState.tokenData.filter((_, idx) => puckState.selectedTokenRows.includes(idx));
    }
    if (puckState.selectedStickyRows.length > 0) {
      exportObj.sticky = puckState.stickyData.filter((_, idx) => puckState.selectedStickyRows.includes(idx));
    }
    // Build flow calibration block if requested
    let flowBlock = '';
    if (includeFlowConfig && flowConfig && Array.isArray(flowConfig.params)) {
      flowBlock = '\n---\nFLOW CALIBRATION\n';
      flowBlock += `(v${flowConfig.version} · ${flowConfig.date})\n`;
      for (const p of flowConfig.params) {
        flowBlock += `${p.label}: ${p.value}\n`;
      }
      if (flowConfig.notes && flowConfig.notes.trim()) {
        flowBlock += `Notes: ${flowConfig.notes.trim()}\n`;
      }
      flowBlock += '---\n';
    }
    // Combine loader text, flow calibration, and PUCK JSON
    const combined = loaderText + flowBlock + '\n---\n' + JSON.stringify(exportObj, null, 2);
    const filename = `PUCK_export_${selectedProfile}.txt`;

    // Save PUCK to server so JobPackageComposer can find it
    const profileEntry = userIndex.find(u => u.fileName === selectedProfile);
    const realName = profileEntry?.realName || selectedProfile.replace('.json', '');
    const visLabel = visibility.charAt(0).toUpperCase() + visibility.slice(1);
    const date = new Date().toISOString().slice(0, 10);
    const indexEntry = {
      name: `${realName} — ${visLabel}`,
      filename,
      sourceProfiles: `${realName} (${selectedProfile.replace('.json', '')})`,
      visibility,
      date,
      description: ""
    };
    try {
      const saveRes = await fetch('/api/save-puck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: combined, indexEntry })
      });
      const data = await saveRes.json().catch(() => ({}));
      if (saveRes.ok) {
        setExportStatus('✓ Saved to PUCK Library');
      } else {
        setExportStatus(`⚠ Save failed: ${data.message || saveRes.status}`);
      }
    } catch (err) {
      setExportStatus(`⚠ ${err.message || 'Backend offline'}`);
    }
    setTimeout(() => setExportStatus(''), 12000);

    // Also trigger browser download as local copy
    const blob = new Blob([combined], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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
              {puckState.selectedProfileRows.length === filteredProfileData.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {/* Column headers */}
          <div style={{ display: 'flex', gap: 8, fontWeight: 'bold', marginBottom: 4, fontSize: '0.85em', color: '#444' }}>
            <span style={{ width: 24 }}></span>
            <span style={{ width: 100 }}>Label</span>
            <span style={{ width: 100 }}>Value</span>
            <span style={{ width: 80 }}>Flag</span>
            <span style={{ width: 120 }}>Todo</span>
            <span style={{ width: 120 }}>Comment</span>
          </div>
          {filteredProfileData.map((entry) => (
            <div key={entry._originalIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <input
                type="checkbox"
                checked={puckState.selectedProfileRows.includes(entry._originalIdx)}
                onChange={() => handleProfileCheckbox(entry._originalIdx)}
                style={{ width: 18, height: 18, marginRight: 2 }}
              />
              <span style={{ width: 100, fontFamily: 'monospace', fontSize: '0.75em', color: '#444', fontWeight: 700 }}>{entry.label}</span>
              <span style={{ width: 100, fontFamily: 'monospace', fontSize: '0.75em', color: '#444' }}>{entry.value}</span>
              <span style={{ width: 80, fontFamily: 'monospace', fontSize: '0.75em', color: '#444' }}>{entry.flag}</span>
              <span style={{ width: 120, fontFamily: 'monospace', fontSize: '0.75em', color: '#444' }}>{entry.todo}</span>
              <span style={{ width: 120, fontFamily: 'monospace', fontSize: '0.75em', color: '#444' }}>{entry.comment}</span>
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
              {puckState.selectedTokenRows.length === filteredTokenData.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {filteredTokenData.map((entry) => (
            <div key={entry._originalIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={puckState.selectedTokenRows.includes(entry._originalIdx)}
                onChange={() => handleTokenCheckbox(entry._originalIdx)}
                style={{ width: 18, height: 18, marginRight: 2 }}
              />
              <span style={{ fontWeight: 500, fontSize: '0.75em' }}>{entry.Token || entry.label}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75em", color: '#444' }}>{entry.Meaning || entry.value}</span>
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
              {puckState.selectedStickyRows.length === filteredStickyData.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          {filteredStickyData.map((entry) => (
            <div key={entry._originalIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <input
                type="checkbox"
                checked={puckState.selectedStickyRows.includes(entry._originalIdx)}
                onChange={() => handleStickyCheckbox(entry._originalIdx)}
                style={{ width: 18, height: 18, marginRight: 2 }}
              />
              <span style={{ fontWeight: 500, fontSize: '0.75em' }}>{entry.stickytype}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75em", color: '#444' }}>{entry.note}</span>
            </div>
          ))}
        </div>
      )}
      {/* Flow Calibration toggle */}
      <div style={{ border: '1px solid #ccd6e8', borderRadius: 8, padding: '10px 16px', marginBottom: 16, background: '#f8faff', display: 'flex', alignItems: 'center', gap: 14 }}>
        <input
          type="checkbox"
          id="includeFlowConfig"
          checked={includeFlowConfig}
          onChange={e => setIncludeFlowConfig(e.target.checked)}
          disabled={!flowConfig}
          style={{ width: 18, height: 18, cursor: flowConfig ? 'pointer' : 'not-allowed' }}
        />
        <label htmlFor="includeFlowConfig" style={{ fontWeight: 'bold', color: '#15396a', cursor: flowConfig ? 'pointer' : 'not-allowed', userSelect: 'none' }}>
          Include Flow Calibration
        </label>
        {!flowConfig && <span style={{ fontSize: '0.85em', color: '#aaa' }}>FZ_Flow_Config.json not found</span>}
        {flowConfig && includeFlowConfig && (
          <span style={{ fontSize: '0.82em', color: '#666' }}>
            {flowConfig.params.length} parameters · v{flowConfig.version}
          </span>
        )}
      </div>
      {exportStatus && (
        <span style={{ fontSize: '0.9em', marginRight: 12, color: exportStatus.startsWith('✓') ? 'green' : '#b45309', fontWeight: 'bold' }}>
          {exportStatus}
        </span>
      )}
      <button
        onClick={handleExport}
        disabled={puckState.selectedProfileRows.length + puckState.selectedTokenRows.length + puckState.selectedStickyRows.length === 0}
        style={{
          padding: "8px 18px",
          fontSize: "1em",
          border: "3px solid #15396a",
          background: (puckState.selectedProfileRows.length + puckState.selectedTokenRows.length + puckState.selectedStickyRows.length) ? "#15396a" : "#b0b8c9",
          color: "#fff",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: (puckState.selectedProfileRows.length + puckState.selectedTokenRows.length + puckState.selectedStickyRows.length) ? "pointer" : "not-allowed"
        }}
      >
        Export
      </button>
    </div>
  );
}
