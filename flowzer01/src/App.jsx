import React, { useState, useEffect } from "react";
import { fetchUserIndex } from "./userIndexUtil"
// Styled button for Gestalt (white on blue)
function GestaltButton({ children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px',
        fontSize: '1em',
        border: '3px solid #15396a',
        background: '#15396a',
        color: '#fff',
        borderRadius: 8,
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(21,57,106,0.08)',
        transition: 'background 0.2s, color 0.2s',
        cursor: 'pointer',
        marginLeft: 8
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// Gestalt Viewer Modal
function GestaltModal({ open, onClose, gestaltText, profileOptions, selectedProfile, onProfileChange, visibility, setVisibility }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 32,
        minWidth: 340,
        width: 'min(90vw, 1100px)',
        maxWidth: '98vw',
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
          <span style={{fontWeight: 'bold', fontSize: '1.2em'}}>Gestalt Viewer</span>
          <button onClick={onClose} style={{fontSize: '1.2em', background: 'none', border: 'none', cursor: 'pointer'}}>✕</button>
        </div>
        <div style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16}}>
          <label htmlFor="profileSelect" style={{fontWeight: 'bold', marginRight: 8}}>Profile:</label>
          <select id="profileSelect" value={selectedProfile} onChange={onProfileChange} style={{fontSize: '1em', padding: '4px 12px'}}>
            {profileOptions.map(opt => (
              <option key={opt.fileName} value={opt.fileName}>{opt.realName}</option>
            ))}
          </select>
          <label style={{ fontWeight: "bold", marginLeft: 24, marginRight: 8, color: '#15396a', fontSize: '1.1em' }}>Visibility:</label>
          <select value={visibility} onChange={e => setVisibility(e.target.value)} style={{ fontSize: "1em", padding: "4px 12px", fontWeight: 'bold', color: '#15396a' }}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="secret">Secret</option>
          </select>
        </div>
        <textarea
          value={gestaltText}
          readOnly
          style={{
            width: '100%',
            minHeight: 320,
            fontSize: '0.92em',
            lineHeight: 1.35,
            background: '#f4f8ff',
            color: '#222',
            border: '1px solid #15396a',
            borderRadius: 8,
            padding: 12,
            resize: 'vertical',
            fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", monospace'
          }}
        />
      </div>
    </div>
  );
}
// TrafficLightIndicator: shows a colored circle for UI mode
function TrafficLightIndicator({ mode }) {
  let emoji = '🟢';
  let title = 'Public mode';
  if (mode === 'private') {
    emoji = '🟡';
    title = 'Private mode';
  } else if (mode === 'secret') {
    emoji = '🔴';
    title = 'Secret mode';
  }
  return (
    <div title={title} className="fz_traffic_light" style={{
      fontSize: '2em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      width: 36,
      height: 36,
      top: 12,
      right: 18
    }}>
      <span>{emoji}</span>
    </div>
  );
}
// Reusable button with FZ style
function FzButton({ children, onClick, style = {}, ...props }) {
  const baseStyle = {
    padding: '8px 18px',
    fontSize: '1em',
    border: '3px solid #15396a',
    background: '#ffe0b2',
    color: '#15396a',
    borderRadius: 8,
    fontWeight: 'bold',
    boxShadow: '0 2px 8px rgba(21,57,106,0.08)',
    transition: 'background 0.2s, color 0.2s',
    cursor: 'pointer',
    ...style,
  };
  return (
    <button onClick={onClick} style={baseStyle} {...props}>
      {children}
    </button>
  );
}
// Displays the current date in a friendly format
function FzDisplayDate({ style = {}, className = '' }) {
  const now = new Date();
  const dateString = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return <span style={style} className={className}>{dateString}</span>;
}
import Jedit from "./Jedit";
import TokenEdit from "./TokenEdit";
import StickyEdit from "./StickyEdit";
import TextFileBackandSave from "./TextFileBackandSave";
import IndexEdit from "./IndexEdit";
import PuckCreator from "./PuckCreator";
import PuckCreatorWrapper from "./PuckCreatorWrapper";
import GestaltViewer from "./GestaltViewer";
// ===============================
// CONFIG / CONSTANTS
// ===============================

// ...existing code...
// fz_UI: renders UI strings from App_UI_ext.json
// FzUI now respects the current UI mode (public/private/secret)
function FzUI({ label, as = 'div', style = {}, className = '', mode = 'public' }) {
  // Enforce fz_ prefix and allow only numbered labels
  const normalizedLabel = label.startsWith('fz_') ? label : `fz_${label}`;
  const [uiObj, setUiObj] = useState(undefined);
  useEffect(() => {
    fetch('/App_UI_ext.json')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          const found = data[normalizedLabel];
          setUiObj(found || null);
        } else {
          setUiObj(null);
        }
      })
      .catch(() => setUiObj(null));
  }, [normalizedLabel]);
  if (uiObj === undefined) return null; // loading
  const Tag = as;
  if (!uiObj) {
    return <Tag style={{color:'red', fontWeight:'bold'}}>[LoadError: UI label not found: {normalizedLabel}]</Tag>;
  }
  if (!uiObj.value || typeof uiObj.value !== 'string' || !uiObj.value.trim()) {
    return <Tag style={{color:'orange', fontWeight:'bold'}}>[LoadError: No value for {normalizedLabel}]</Tag>;
  }
  // Only show if flag is public, or matches/exceeds the current mode
  // Hierarchy: public < private < secret
  const flag = (uiObj.flag || '').toLowerCase();
  const modeRank = { public: 1, private: 2, secret: 3 };
  const flagRank = modeRank[flag] || 1;
  const currentModeRank = modeRank[mode] || 1;
  if (flagRank > currentModeRank) return null;
  return <Tag style={style} className={className}>{uiObj.value}</Tag>;
}

const FZ_ConfLoadFail = " CLF"

// ===============================
// DEFINITIONS
// ===============================


function FZ_ConfigLoadFault(FZ_cfg, FZ_key, FZ_default_text) {
  const FZ_value = FZ_cfg[FZ_key]
  if (FZ_value === undefined || FZ_value === null || FZ_value === "") {
    console.warn("CONFIG LOAD FAULT:", FZ_key)
    return FZ_default_text
  }
  return FZ_value
}




// ===============================
// MAIN PROGRAM
// ===============================


function App() {
  // Config state (move above useEffect)
  const [FZ_cfg_obj, FZ_set_cfg_obj] = useState({})
  const [FZ_profile_ary, FZ_set_profile_ary] = useState([])
  const [showJedit, setShowJedit] = useState(false)
  const [showTokenEdit, setShowTokenEdit] = useState(false)
  const [showStickyEdit, setShowStickyEdit] = useState(false)
  const [showTextFileBackandSave, setShowTextFileBackandSave] = useState(false)
  const [showIndexEdit, setShowIndexEdit] = useState(false)
  const [uiMode, setUiMode] = useState('public');

  // Gestalt state
  const [showGestalt, setShowGestalt] = useState(false);
  const [gestaltText, setGestaltText] = useState('');
  const [profileOptions, setProfileOptions] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [gestaltVisibility, setGestaltVisibility] = useState('secret');

  // Load profile options for Gestalt
  useEffect(() => {
    fetchUserIndex().then(data => {
      setProfileOptions(data);
      if (data.length > 0) setSelectedProfile(data[0].fileName);
    }).catch(() => setProfileOptions([]));
  }, []);

  // Load gestalt when profile or visibility changes
  useEffect(() => {
    if (!selectedProfile) return;
    // Fetch profile, token, sticky
    const base = selectedProfile.replace('.json', '');
    Promise.all([
      fetch(`/${base}.json`).then(r => r.json()).catch(() => null),
      fetch(`/${base}_token.json`).then(r => r.json()).catch(() => null),
      fetch(`/${base}_sticky.json`).then(r => r.json()).catch(() => null)
    ]).then(([profile, token, sticky]) => {
      let gestalt = '';
      // Visibility filter logic
      const allowedFlags = gestaltVisibility === "secret" ? ["secret", "private", "public"] : gestaltVisibility === "private" ? ["private", "public"] : ["public"];
      if (profile && Array.isArray(profile.profile)) {
        gestalt += 'PROFILE\n';
        for (const item of profile.profile) {
          const flag = (item.flag || "public").toLowerCase();
          if (allowedFlags.includes(flag)) {
            gestalt += `- ${item.label || ''}: ${item.value || ''}\n`;
          }
        }
        gestalt += '\n';
      }
      if (token && Array.isArray(token.FZ_Tokens)) {
        gestalt += 'TOKENS\n';
        for (const t of token.FZ_Tokens) {
          const flag = (t.flag || "public").toLowerCase();
          if (allowedFlags.includes(flag)) {
            gestalt += `- ${t.Token || t.label || ''}: ${t.Meaning || t.value || ''}\n`;
          }
        }
        gestalt += '\n';
      }
      if (sticky && Array.isArray(sticky.sticky)) {
        gestalt += 'STICKY\n';
        for (const s of sticky.sticky) {
          const flag = (s.flag || "public").toLowerCase();
          if (allowedFlags.includes(flag)) {
            gestalt += `- ${s.stickytype || ''}: ${s.note || ''}\n`;
          }
        }
      }
      setGestaltText(gestalt.trim());
    });
  }, [selectedProfile, showGestalt, gestaltVisibility]);

  useEffect(() => {
    fetch("/config.json")
      .then((res) => res.json())
      .then((data) => {
        FZ_set_cfg_obj(data)
      })
      .catch(() => {
        console.warn("CONFIG LOAD FAILED")
      })
  }, [])

  return (
    <div style={{position: 'relative', minHeight: 80}}>
      {/* Traffic light indicator fixed in top right of viewport */}
      <div style={{position: 'fixed', top: 16, right: 24, zIndex: 2000}}>
        <TrafficLightIndicator mode={uiMode} />
      </div>
      {/* Header/title section */}
      <div className="fz_container">
        <FzUI label="fz_00_headline" as="h1" mode={uiMode} style={{margin: 0}} />
      </div>
      {/* UI Mode Selector */}
      <div style={{marginTop: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{fontWeight: 'bold'}}>UI Mode:</span>
        <select value={uiMode} onChange={e => setUiMode(e.target.value)} style={{fontSize: '1em', padding: '4px 12px'}}>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="secret">Secret</option>
        </select>
      </div>
      <div style={{marginTop: 40, display: 'flex', gap: 16, flexWrap: 'wrap'}}>
        {!showJedit && (
          <FzButton onClick={() => setShowJedit(true)}>Profile Edit</FzButton>
        )}
        {!showTokenEdit && (
          <FzButton onClick={() => setShowTokenEdit(true)}>Token Edit</FzButton>
        )}
        {!showStickyEdit && (
          <FzButton onClick={() => setShowStickyEdit(true)}>Sticky Edit</FzButton>
        )}
        {!showTextFileBackandSave && (
          <FzButton onClick={() => setShowTextFileBackandSave(true)}>Text File Edit</FzButton>
        )}
        {!showIndexEdit && (
          <FzButton onClick={() => setShowIndexEdit(true)}>Index Edit</FzButton>
        )}
        <GestaltButton onClick={() => setShowGestalt(true)}>Show Gestalt</GestaltButton>
      </div>
      <GestaltModal
        open={showGestalt}
        onClose={() => setShowGestalt(false)}
        gestaltText={gestaltText}
        profileOptions={profileOptions}
        selectedProfile={selectedProfile}
        setSelectedProfile={setSelectedProfile}
        onProfileChange={e => setSelectedProfile(e.target.value)}
        visibility={gestaltVisibility}
        setVisibility={setGestaltVisibility}
      />
      {/* Toggleable IndexEdit (now below buttons) */}
      {showIndexEdit && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Index Edit</span>
            <button onClick={() => setShowIndexEdit(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <IndexEdit />
        </div>
      )}
      {showJedit && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Profile Edit</span>
            <button onClick={() => setShowJedit(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <Jedit />
        </div>
      )}
      {showTokenEdit && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Token Edit</span>
            <button onClick={() => setShowTokenEdit(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <TokenEdit />
        </div>
      )}
      {showStickyEdit && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Sticky Edit</span>
            <button onClick={() => setShowStickyEdit(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <StickyEdit />
        </div>
      )}
      {/* Toggleable TextFileBackandSave */}
      {showTextFileBackandSave && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Text File Edit</span>
            <button onClick={() => setShowTextFileBackandSave(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <TextFileBackandSave />
        </div>
      )}
      {/* PUCK Creator toggleable section */}
      <PuckCreatorWrapper />
      {/* Demo: Show all three messages for current mode */}
      <div style={{marginTop: 32, textAlign: 'center'}}>
        <FzUI label="fz_05_public_message" as="div" mode={uiMode} style={{fontSize: '1.1em', margin: 8}} />
        <FzUI label="fz_04_private_message" as="div" mode={uiMode} style={{fontSize: '1.1em', margin: 8}} />
        <FzUI label="fz_03_secret_message" as="div" mode={uiMode} style={{fontSize: '1.1em', margin: 8}} />
      </div>
      {/* Footer using FzUI for FlowZero Systematik headline */}
      <FzUI label="fz_01_footer_headline" as="footer" style={{marginTop: 48, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', color: '#444'}} mode={uiMode} />
      <footer style={{marginTop: 4, textAlign: 'center', fontSize: '1em', color: '#888'}}>
        <FzUI label="fz_02_footer_date" as="span" style={{marginRight: 8}} mode={uiMode} />
        <FzDisplayDate style={{fontWeight: 'bold'}} />
      </footer>
    </div>
  )
}

export default App