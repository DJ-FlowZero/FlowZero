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

// Utility to fetch and parse fz_profile_index.json
export async function fetchUserIndex() {
  const FZ_GPATH = await getFZ_GPATH();
  const gestaltPath = `${FZ_GPATH.replace(/^[.\\/]+/, '')}/fz_profile_index.json`.replace(/\\/g, '/');
  const res = await fetch(`/${gestaltPath}`);
  if (!res.ok) throw new Error("Failed to load user index");
  return await res.json();
}
