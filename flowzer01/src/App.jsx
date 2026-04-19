// ===============================
// CONFIG / CONSTANTS
// ===============================

import { useState, useEffect } from "react"

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
  const [FZ_cfg_obj, FZ_set_cfg_obj] = useState({})

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

  const FZ_title = FZ_ConfigLoadFault(
    FZ_cfg_obj,
    "XS_01_Title",
    "Loading..." + FZ_ConfLoadFail
  )

  return (
    <div>
      <h1>{FZ_title}</h1>
    </div>
  )
}

export default App