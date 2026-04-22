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
// ===============================
// CONFIG / CONSTANTS
// ===============================

import { useState, useEffect } from "react"
// fz_UI: renders UI strings from App_UI_ext.json
function FzUI({ label, as = 'div', style = {}, className = '', fallback = null }) {
  // Enforce fz_ prefix and allow only numbered labels
  const normalizedLabel = label.startsWith('fz_') ? label : `fz_${label}`;
  const [uiObj, setUiObj] = useState(undefined);
  useEffect(() => {
    fetch('/App_UI_ext.json')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.appUIext)) {
          // Only allow fz_ prefix and numbered labels
          const found = data.appUIext.find(item => item.label === normalizedLabel);
          setUiObj(found);
        } else {
          setUiObj(null);
        }
      })
      .catch(() => setUiObj(null));
  }, [normalizedLabel]);
  if (uiObj === undefined) return null; // loading
  const Tag = as;
  if (!uiObj) {
    return fallback || <Tag style={{color:'red'}}>UI label not found: {normalizedLabel}</Tag>;
  }
  if (!uiObj.value || typeof uiObj.value !== 'string' || !uiObj.value.trim()) {
    return fallback || <Tag style={{color:'orange'}}>No value for {normalizedLabel}</Tag>;
  }
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
  const [FZ_cfg_obj, FZ_set_cfg_obj] = useState({})
  const [FZ_profile_ary, FZ_set_profile_ary] = useState([])
  const [showJedit, setShowJedit] = useState(false)
  const [showTokenEdit, setShowTokenEdit] = useState(false)
  const [showStickyEdit, setShowStickyEdit] = useState(false)
  const [showTextFileBackandSave, setShowTextFileBackandSave] = useState(false)
  const [showIndexEdit, setShowIndexEdit] = useState(false)

  // Restore the original title logic
  const FZ_title = FZ_ConfigLoadFault(
    FZ_cfg_obj,
    "XS_01_Title",
    "Loading..." + FZ_ConfLoadFail
  );

  return (
    <div>
      {/* Header/title section */}
      <div className="fz_container">
        <h1>{FZ_title}</h1>
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
      </div>
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
      {/* Footer using FzUI for FlowZero Systematik headline */}
      <FzUI label="fz_01_footer_headline" as="footer" style={{marginTop: 48, textAlign: 'center', fontWeight: 'bold', fontSize: '1.1em', color: '#444'}} />
      <footer style={{marginTop: 4, textAlign: 'center', fontSize: '1em', color: '#888'}}>
        <FzUI label="fz_02_footer_date" as="span" style={{marginRight: 8}} />
        <FzDisplayDate style={{fontWeight: 'bold'}} />
      </footer>
    </div>
  )
}

export default App