// Utility to fetch and parse fz_profile_index.json
export async function fetchUserIndex() {
  const res = await fetch("/Gestalt/fz_profile_index.json");
  if (!res.ok) throw new Error("Failed to load user index");
  return await res.json();
}
