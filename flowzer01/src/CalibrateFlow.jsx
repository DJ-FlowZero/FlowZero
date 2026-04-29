import React, { useState, useEffect } from "react";
import { getGestaltFileUrl } from "./userIndexUtil";

const CONFIG_FILENAME = "FZ_Flow_Config.json";

export default function CalibrateFlow() {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Load config on mount
  useEffect(() => {
    const load = async () => {
      try {
        const url = await getGestaltFileUrl(CONFIG_FILENAME);
        const res = await fetch(url + "?_=" + Date.now());
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setConfig(data);
      } catch {
        setStatus("Could not load FZ_Flow_Config.json from Gestalt.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOptionChange = (paramId, value) => {
    setConfig(prev => ({
      ...prev,
      params: prev.params.map(p => p.id === paramId ? { ...p, value } : p)
    }));
    setStatus("");
  };

  const handleNotesChange = (e) => {
    setConfig(prev => ({ ...prev, notes: e.target.value }));
    setStatus("");
  };

  // Save to Gestalt via backend
  const handleSave = async () => {
    setStatus("Saving...");
    try {
      const res = await fetch("/api/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: CONFIG_FILENAME,
          content: JSON.stringify(config, null, 2)
        })
      });
      const result = await res.json();
      setStatus(result.message || "Saved.");
    } catch {
      setStatus("Save failed.");
    }
  };

  // Download as JSON
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = CONFIG_FILENAME;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Downloaded.");
  };

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (!config) return <div style={{ padding: 16, color: "red" }}>{status}</div>;

  return (
    <div style={{ fontFamily: "inherit" }}>
      <div style={{ marginBottom: 20, color: "#555", fontSize: "0.95em" }}>
        Set default collaboration parameters. These are compiled into the ServCon on export.
      </div>

      {/* Parameter grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {config.params.map(param => (
          <div
            key={param.id}
            style={{
              border: "1px solid #ccd6e8",
              borderRadius: 8,
              padding: "12px 16px",
              background: "#f8faff"
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: "bold", color: "#15396a", minWidth: 220 }}>{param.label}</span>
              <span style={{ fontSize: "0.85em", color: "#888" }}>{param.description}</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {param.options.map(opt => (
                <label
                  key={opt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    padding: "5px 14px",
                    borderRadius: 6,
                    border: param.value === opt ? "2px solid #15396a" : "1px solid #bbb",
                    background: param.value === opt ? "#15396a" : "#fff",
                    color: param.value === opt ? "#fff" : "#333",
                    fontWeight: param.value === opt ? "bold" : "normal",
                    fontSize: "0.95em",
                    transition: "all 0.15s"
                  }}
                >
                  <input
                    type="radio"
                    name={param.id}
                    value={opt}
                    checked={param.value === opt}
                    onChange={() => handleOptionChange(param.id, opt)}
                    style={{ display: "none" }}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Free text notes */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: "bold", color: "#15396a", marginBottom: 6 }}>
          Additional notes / free-text overrides
        </div>
        <textarea
          value={config.notes || ""}
          onChange={handleNotesChange}
          rows={5}
          placeholder="Any interaction preferences not covered above..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            fontSize: "0.95em",
            lineHeight: "1.5",
            border: "1px solid #ccd6e8",
            borderRadius: 8,
            padding: "10px 12px",
            background: "#f8faff",
            resize: "vertical"
          }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "8px 20px",
            fontSize: "1em",
            border: "3px solid #15396a",
            background: "#15396a",
            color: "#fff",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Save to Gestalt
        </button>
        <button
          onClick={handleDownload}
          style={{
            padding: "8px 20px",
            fontSize: "1em",
            border: "3px solid #15396a",
            background: "#ffe0b2",
            color: "#15396a",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Download JSON
        </button>
        <span style={{ color: "#007", fontSize: "0.95em" }}>{status}</span>
      </div>

      {/* Metadata footer */}
      <div style={{ marginTop: 16, fontSize: "0.8em", color: "#aaa" }}>
        v{config.version} · last edited {config.date} · {CONFIG_FILENAME}
      </div>
    </div>
  );
}
