import React, { useState, useEffect } from "react";
import { fetchUserIndex, getGestaltFileUrl } from "./userIndexUtil"
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
// BackendStatusIndicator: polls /api/health every 15s, shows green/red dot
function BackendStatusIndicator({ live }) {
  const color = live === true ? '#22c55e' : live === false ? '#ef4444' : '#aaa';
  const label = live === true ? 'Backend live' : live === false ? 'Backend offline' : 'Checking backend…';
  return (
    <div title={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        boxShadow: live === true ? '0 0 5px #22c55e88' : 'none',
        flexShrink: 0
      }} />
      <span style={{ fontSize: '0.78em', fontWeight: 600, color, letterSpacing: 0.2 }}>
        {live === true ? 'Live' : live === false ? 'Offline' : '…'}
      </span>
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
// Minimal markdown renderer (subset — headings, bold, lists, tables, blockquote, hr)
const C_MD = { primary: '#15396a', border: '#c8d8ef', bg: '#f4f8ff' };
function renderMd(md) {
  const lines = md.split('\n');
  let html = '', inList = false, inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let line = raw
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,`<code style="background:#f3f4f6;padding:1px 5px;border-radius:3px;font-size:0.88em">$1</code>`);
    if (inList  && !/^\s*[-*]\s/.test(raw)) { html += '</ul>'; inList  = false; }
    if (inTable && !/^\|/.test(raw))         { html += '</table>'; inTable = false; }
    if      (/^### /.test(raw)) { html += `<h3 style="margin:10px 0 4px;color:${C_MD.primary}">${line.replace(/^### /,'')}</h3>`; }
    else if (/^## /.test(raw))  { html += `<h2 style="margin:16px 0 6px;color:${C_MD.primary};border-bottom:1px solid ${C_MD.border};padding-bottom:4px">${line.replace(/^## /,'')}</h2>`; }
    else if (/^# /.test(raw))   { html += `<h1 style="margin:0 0 12px;color:${C_MD.primary};font-size:1.4em">${line.replace(/^# /,'')}</h1>`; }
    else if (/^---$/.test(raw)) { html += `<hr style="border:none;border-top:1px solid ${C_MD.border};margin:12px 0">`; }
    else if (/^> /.test(raw))   { html += `<blockquote style="border-left:4px solid ${C_MD.primary};padding:6px 14px;margin:10px 0;color:#374151;background:${C_MD.bg};border-radius:0 6px 6px 0">${line.replace(/^&gt; /,'')}</blockquote>`; }
    else if (/^\s*[-*]\s/.test(raw)) {
      if (!inList) { html += '<ul style="margin:6px 0;padding-left:22px">'; inList = true; }
      html += `<li style="margin:3px 0">${line.replace(/^\s*[-*]\s/,'')}</li>`;
    }
    else if (/^\|/.test(raw)) {
      if (!inTable) { html += `<table style="border-collapse:collapse;margin:10px 0;font-size:0.9em;width:100%">`; inTable = true; }
      if (/^\|[-| :]+\|/.test(raw)) continue;
      const cells = raw.split('|').filter((_,j,a)=>j>0&&j<a.length-1);
      html += `<tr>${cells.map((c,ci)=>`<td style="border:1px solid ${C_MD.border};padding:6px 12px;${ci===0?`font-weight:600;background:${C_MD.bg}`:''}">${c.trim()}</td>`).join('')}</tr>`;
    }
    else if (raw.trim()==='') { html += '<div style="height:6px"></div>'; }
    else { html += `<p style="margin:3px 0;line-height:1.7">${line}</p>`; }
  }
  if (inList)  html += '</ul>';
  if (inTable) html += '</table>';
  return html;
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
// Reusable ? help button
function HelpBtn({ onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #15396a',
        background: '#eaf1fa', color: '#15396a', fontWeight: 700, fontSize: '0.82em',
        cursor: 'pointer', padding: 0, lineHeight: '22px', textAlign: 'center', flexShrink: 0,
      }}
    >?</button>
  );
}
import Jedit from "./Jedit";
import TokenEdit from "./TokenEdit";
import StickyEdit from "./StickyEdit";
import TextFileBackandSave from "./TextFileBackandSave";
import IndexEdit from "./IndexEdit";
import PuckCreator from "./PuckCreator";
import GestaltViewer from "./GestaltViewer";
import CalibrateFlow from "./CalibrateFlow";
import PuckLibrary from "./PuckLibrary";
import JobPackageComposer from "./JobPackageComposer";
import MdFileEditor from "./MdFileEditor";
import HelpModal from "./HelpModal";
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
  const [showMdEditor, setShowMdEditor] = useState(false)
  const [showIndexEdit, setShowIndexEdit] = useState(false)
  const [showPuckLibrary, setShowPuckLibrary] = useState(false)
  const [showJobPackage, setShowJobPackage] = useState(false)
  const [showCalibrateFlow, setShowCalibrateFlow] = useState(false)
  const [showPuck, setShowPuck] = useState(false)
  const [uiMode, setUiMode] = useState('public');
  const [backendLive, setBackendLive] = useState(null);
  const [helpPath, setHelpPath] = useState(null);
  const [showTopHelp, setShowTopHelp] = useState(false);
  const [topHelpMd, setTopHelpMd] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false);

  // Poll backend health
  useEffect(() => {
    const check = () => {
      fetch('/api/health', { signal: AbortSignal.timeout(2000) })
        .then(r => r.ok ? setBackendLive(true) : setBackendLive(false))
        .catch(() => setBackendLive(false));
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  // Gestalt state
  const [showGestalt, setShowGestalt] = useState(false);
  const [gestaltText, setGestaltText] = useState('');
  const [profileOptions, setProfileOptions] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [gestaltVisibility, setGestaltVisibility] = useState('secret');
  const [uiStrings, setUiStrings] = useState(null);

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
    const fetchData = async () => {
      const base = selectedProfile.replace('.json', '');
      const [profileUrl, tokenUrl, stickyUrl] = await Promise.all([
        getGestaltFileUrl(`${base}.json`),
        getGestaltFileUrl(`${base}_token.json`),
        getGestaltFileUrl(`${base}_sticky.json`),
      ]);
      const [profile, token, sticky] = await Promise.all([
        fetch(profileUrl).then(r => r.json()).catch(() => null),
        fetch(tokenUrl).then(r => r.json()).catch(() => null),
        fetch(stickyUrl).then(r => r.json()).catch(() => null)
      ]);
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
    };
    fetchData();
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

  useEffect(() => {
    fetch('/App_UI_ext.json')
      .then(r => r.json())
      .then(data => setUiStrings(typeof data === 'object' && data !== null ? data : {}))
      .catch(() => setUiStrings({}));
  }, []);

  useEffect(() => {
    fetch('/api/txt/load?fetchPath=' + encodeURIComponent('fz_md/FZ_help_AppOverview.md'))
      .then(r => r.json())
      .then(d => setTopHelpMd(d.status === 'ok' ? d.content : null))
      .catch(() => setTopHelpMd(null));
  }, []);

  const uiStr = key => {
    if (!uiStrings) return '\u2026';
    const e = uiStrings[key];
    return (e && typeof e.value === 'string' && e.value.trim()) ? e.value : '\u26a0 Load Error';
  };

  return (
    <div style={{position: 'relative', minHeight: 80}}>
      {/* Status indicators fixed in top right of viewport */}
      <div style={{position: 'fixed', top: 16, right: 24, zIndex: 2000, display: 'flex', alignItems: 'center', gap: 10}}>
        <BackendStatusIndicator live={backendLive} />
        <TrafficLightIndicator mode={uiMode} />
      </div>
      {/* Header/title section */}
      <div className="fz_container">
        <FzUI label="fz_00_headline" as="h1" mode={uiMode} style={{margin: 0}} />
      </div>
      {/* ── Top controls: UI Mode · Application Overview · Onscreen Help ── */}
      <div style={{marginTop: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap'}}>
        <span style={{fontWeight: 'bold'}}>UI Mode:</span>
        <select value={uiMode} onChange={e => setUiMode(e.target.value)} style={{fontSize: '1em', padding: '4px 12px'}}>
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="secret">Secret</option>
        </select>
        <div style={{width: 1, height: 22, background: '#c8d8ef'}} />
        <button
          onClick={() => setShowTopHelp(prev => !prev)}
          title="Application workflow overview"
          style={{
            padding: '4px 14px', fontSize: '0.88em',
            border: '1.5px solid #15396a', borderRadius: 14,
            background: showTopHelp ? '#15396a' : '#eaf1fa',
            color: showTopHelp ? '#fff' : '#15396a',
            fontWeight: 600, cursor: 'pointer',
          }}
        >Application Overview</button>
        <div style={{width: 1, height: 22, background: '#c8d8ef'}} />
        <span style={{fontWeight: 'bold', fontSize: '0.9em'}}>Onscreen Help</span>
        <button
          onClick={() => setHelpVisible(true)}
          style={{
            padding: '3px 12px', fontSize: '0.85em',
            border: `1.5px solid #15396a`, borderRadius: '14px 0 0 14px',
            background: helpVisible ? '#15396a' : '#eaf1fa',
            color: helpVisible ? '#fff' : '#15396a',
            fontWeight: 600, cursor: 'pointer',
          }}
        >On</button>
        <button
          onClick={() => setHelpVisible(false)}
          style={{
            padding: '3px 12px', fontSize: '0.85em',
            border: '1.5px solid #15396a', borderLeft: 'none', borderRadius: '0 14px 14px 0',
            background: !helpVisible ? '#15396a' : '#eaf1fa',
            color: !helpVisible ? '#fff' : '#15396a',
            fontWeight: 600, cursor: 'pointer',
          }}
        >Off</button>
      </div>
      {/* Inline workflow overview — toggles with Show Help */}
      {showTopHelp && (
        <div style={{
          margin: '0 0 18px 0', padding: '18px 24px',
          background: '#f4f8ff', border: '1.5px solid #c8d8ef',
          borderRadius: 10, fontSize: '0.93em', lineHeight: 1.65,
          maxWidth: 760,
        }}
          dangerouslySetInnerHTML={{ __html: topHelpMd
            ? renderMd(topHelpMd)
            : '<p style="color:#888">Help content unavailable — backend may be offline.</p>'
          }}
        />
      )}
      {/* ── Row 1: FlowSet Index (start here — creates the FlowSet) ── */}
      <div style={{marginTop: 40, display: 'flex', gap: 8, alignItems: 'center'}}>
        <FzButton onClick={() => setShowIndexEdit(prev => !prev)}>{uiStr('fz_btn_flowset_index')}</FzButton>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_IndexEdit.md')} title="About FlowSet Definition" />}
      </div>
      {/* ── Row 2: FlowSet member editors ── */}
      <div style={{marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
        <FzButton onClick={() => setShowJedit(prev => !prev)}>{uiStr('fz_btn_profile_edit')}</FzButton>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_ProfileEdit.md')} title="About Profile Editor" />}
        <FzButton onClick={() => setShowTokenEdit(prev => !prev)}>{uiStr('fz_btn_flexicon_edit')}</FzButton>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_FlexiconEdit.md')} title="About Flexicon Editor" />}
        <FzButton onClick={() => setShowStickyEdit(prev => !prev)}>{uiStr('fz_btn_sticky_edit')}</FzButton>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_StickyEdit.md')} title="About Sticky Editor" />}
      </div>
      {/* ── Row 3: View / review tools ── */}
      <div style={{marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
        <button
          onClick={() => setShowCalibrateFlow(prev => !prev)}
          style={{
            padding: '8px 18px', fontSize: '1em',
            border: '3px solid #15396a', background: '#15396a',
            color: '#fff', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer'
          }}
        >{uiStr('fz_btn_calibrate_flow')}</button>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_CalibrateFlow.md')} title="About Flow Calibration" />}
        <button
          onClick={() => setShowGestalt(true)}
          style={{
            padding: '8px 18px', fontSize: '1em',
            border: '3px solid #15396a', background: '#15396a',
            color: '#fff', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer'
          }}
        >{uiStr('fz_btn_show_gestalt')}</button>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_GestaltViewer.md')} title="About Gestalt Viewer" />}
      </div>
      {/* ── Row 4: PUCK creation / job packaging ── */}
      <div style={{marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap'}}>
        <button
          onClick={() => setShowPuck(prev => !prev)}
          style={{
            padding: '8px 18px', fontSize: '1em',
            border: '3px solid #15396a', background: '#e3eefd',
            color: '#15396a', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer'
          }}
        >{uiStr('fz_btn_create_puck')}</button>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_CreatePuck.md')} title="About Create PUCK" />}
        <button
          onClick={() => setShowPuckLibrary(prev => !prev)}
          style={{
            padding: '8px 18px', fontSize: '1em',
            border: '3px solid #15396a', background: '#e3eefd',
            color: '#15396a', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer',
            marginLeft: 8
          }}
        >{uiStr('fz_btn_puck_library')}</button>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_PuckLibrary.md')} title="About PUCK Library" />}
        <button
          onClick={() => setShowJobPackage(prev => !prev)}
          style={{
            padding: '8px 18px', fontSize: '1em',
            border: '3px solid #15396a', background: '#e3eefd',
            color: '#15396a', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer',
            marginLeft: 8
          }}
        >{uiStr('fz_btn_compose_job')}</button>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_JobPackage.md')} title="About Compose Job Package" />}
      </div>
      {/* ── Row 5: File editors ── */}
      <div style={{marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
        <FzButton onClick={() => setShowTextFileBackandSave(prev => !prev)}>{uiStr('fz_btn_text_file_edit')}</FzButton>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_TextFileEdit.md')} title="About Text File Editor" />}
        <FzButton onClick={() => setShowMdEditor(prev => !prev)}>{uiStr('fz_btn_md_edit')}</FzButton>
        {helpVisible && <HelpBtn onClick={() => setHelpPath('fz_md/FZ_help_MdEdit.md')} title="About MD Editor" />}
      </div>
      <HelpModal fetchPath={helpPath} onClose={() => setHelpPath(null)} />
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
      {/* Job Package Composer */}
      {showJobPackage && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Compose Job Package</span>
            <button onClick={() => setShowJobPackage(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <JobPackageComposer />
        </div>
      )}
      {/* PUCK Library */}
      {showPuckLibrary && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>PUCK Library</span>
            <button onClick={() => setShowPuckLibrary(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <PuckLibrary />
        </div>
      )}
      {/* Toggleable FlowSet Index */}
      {showIndexEdit && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>FlowSet Index</span>
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
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Flexicon Edit</span>
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
      {/* Toggleable MdFileEditor */}
      {showMdEditor && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>MD Edit</span>
            <button onClick={() => setShowMdEditor(false)} style={{marginBottom: 8, padding: '4px 12px'}}>Close</button>
          </div>
          <MdFileEditor />
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
      {/* Calibrate Flow */}
      {showCalibrateFlow && (
        <div style={{marginTop: 40, marginBottom: 32}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em'}}>Calibrate Flow</span>
            <button onClick={() => setShowCalibrateFlow(false)} style={{padding: '4px 12px'}}>Close</button>
          </div>
          <CalibrateFlow />
        </div>
      )}
      {/* PUCK Creator toggleable section */}
      {showPuck && (
        <div style={{marginTop: 24, marginBottom: 32, border: '2px solid #15396a', borderRadius: 10, padding: 24, background: '#f8faff', maxWidth: 900}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em', color: '#15396a'}}>Create PUCK</span>
            <button onClick={() => setShowPuck(false)} style={{fontSize: '1em', background: 'none', border: 'none', cursor: 'pointer', color: '#15396a'}}>✕</button>
          </div>
          <PuckCreator />
        </div>
      )}
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