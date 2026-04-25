import React, { useState } from "react";
import PuckCreator from "./PuckCreator";

export default function PuckCreatorWrapper() {
  const [showPuck, setShowPuck] = useState(false);
  return (
    <div style={{marginTop: 40, marginBottom: 32}}>
      {!showPuck ? (
        <button
          onClick={() => setShowPuck(true)}
          style={{
            padding: "8px 18px",
            fontSize: "1em",
            border: "3px solid #15396a",
            background: "#e3eefd",
            color: "#15396a",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Create PUCK
        </button>
      ) : (
        <div style={{ border: "2px solid #15396a", borderRadius: 10, padding: 24, background: "#f8faff", maxWidth: 900 }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
            <span style={{fontWeight: 'bold', fontSize: '1.1em', color: '#15396a'}}>Create PUCK</span>
            <button onClick={() => setShowPuck(false)} style={{fontSize: '1em', background: 'none', border: 'none', cursor: 'pointer', color: '#15396a'}}>✕</button>
          </div>
          <PuckCreator />
        </div>
      )}
    </div>
  );
}