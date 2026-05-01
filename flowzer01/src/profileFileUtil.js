// Utility to POST new profile/token/sticky files directly to Gestalt via /api/save-profile
export async function createProfileFiles(profileNum, profileData, tokenData, stickyData) {
  const files = [
    { filename: `fz${profileNum}.json`,        content: JSON.stringify(profileData, null, 2) },
    { filename: `fz${profileNum}_token.json`,  content: JSON.stringify(tokenData,   null, 2) },
    { filename: `fz${profileNum}_sticky.json`, content: JSON.stringify(stickyData,  null, 2) }
  ];
  for (const file of files) {
    const res = await fetch('/api/save-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file)
    });
    if (!res.ok) throw new Error(`Failed to create ${file.filename}`);
  }
}
