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
  const [FZ_profile_ary, FZ_set_profile_ary] = useState([])

  useEffect(() => {
    fetch("/config.json")
      .then((res) => res.json())
      .then((data) => {
        FZ_set_cfg_obj(data)
      })
      .catch(() => {
        console.warn("CONFIG LOAD FAILED")
      })

    fetch("/fz0000.json")
      .then((res) => res.json())
      .then((data) => {
        const FZ_key = Object.keys(data)[0]
        const FZ_profile = data[FZ_key] || []
        FZ_set_profile_ary(FZ_profile)
      })
      .catch(() => {
        console.warn("PROFILE LOAD FAILED")
      })
  }, [])

  const FZ_title = FZ_ConfigLoadFault(
    FZ_cfg_obj,
    "XS_01_Title",
    "Loading..." + FZ_ConfLoadFail
  )

  return (
    <div>
      <div className="fz_container">
        <h1>{FZ_title}</h1>
        <div style={{width: '100%', textAlign: 'left', display: 'block', alignSelf: 'flex-start'}}>
          <ul className="fz_profile_list">
            {FZ_profile_ary.map((FZ_line, FZ_index) => (
              <li key={FZ_index}>
                <strong>{FZ_line.label}:</strong> {FZ_line.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App