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
import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil";

export default function GestaltViewer() {
  const [userIndex, setUserIndex] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [tokenData, setTokenData] = useState([]);
  const [stickyData, setStickyData] = useState([]);
  const [visibility, setVisibility] = useState("secret");

  useEffect(() => {
    fetchUserIndex().then(setUserIndex);
  }, []);

  useEffect(() => {
    if (!selectedProfile) {
      setTimeout(() => {
        setTokenData([]);
        setStickyData([]);
      }, 0);
      return;
    }
    const fetchData = async () => {
      const base = selectedProfile.replace('.json', '');
      const FZ_GPATH = await getFZ_GPATH();
      const gestaltDir = FZ_GPATH.replace(/^[.\\/]+/, '');
      const tokenUrl = `/${gestaltDir}/${base}_token.json`.replace(/\\/g, '/');
      const stickyUrl = `/${gestaltDir}/${base}_sticky.json`.replace(/\\/g, '/');
      const [token, sticky] = await Promise.all([
        fetch(tokenUrl).then(r => r.json()).catch(() => null),
        fetch(stickyUrl).then(r => r.json()).catch(() => null)
      ]);
      setTokenData(Array.isArray(token?.FZ_Tokens) ? token.FZ_Tokens : []);
      setStickyData(Array.isArray(sticky?.sticky) ? sticky.sticky : []);
    };
    fetchData();
    // No direct setState in effect body after async
  }, [selectedProfile]);

  const allowedFlags = visibility === "secret" ? ["secret", "private", "public"] : visibility === "private" ? ["private", "public"] : ["public"];
  const filteredTokenData = tokenData.filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));
  const filteredStickyData = stickyData.filter(entry => allowedFlags.includes((entry.flag || "public").toLowerCase()));

  return (
    <div style={{ border: "2px solid #15396a", borderRadius: 10, padding: 24, background: "#f8faff", maxWidth: 900, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
        <div>
          <label htmlFor="profileSelect" style={{ fontWeight: "bold", marginRight: 8 }}>Profile:</label>
          <select id="profileSelect" value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)} style={{ fontSize: "1em", padding: "4px 12px" }}>
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
      {filteredTokenData.length > 0 && (
        <div style={{ border: "1px solid #ccc", borderRadius: 6, marginBottom: 16, padding: 12, background: '#fff' }}>
          <div style={{fontWeight: 'bold', color: '#15396a', marginBottom: 6}}>Tokens</div>
          {filteredTokenData.map((entry, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{entry.Token || entry.label}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.98em", color: '#444' }}>{entry.Meaning || entry.value}</span>
            </div>
          ))}
        </div>
      )}
      {filteredStickyData.length > 0 && (
        <div style={{ border: "1px solid #ccc", borderRadius: 6, marginBottom: 16, padding: 12, background: '#fff' }}>
          <div style={{fontWeight: 'bold', color: '#15396a', marginBottom: 6}}>Sticky</div>
          {filteredStickyData.map((entry, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{entry.stickytype}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.98em", color: '#444' }}>{entry.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
