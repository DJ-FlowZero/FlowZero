// Utility to POST new files to the backend using /api/save-text
export async function createProfileFiles(profileNum, profileData, tokenData, stickyData) {
  const files = [
    { filename: `fz${profileNum}.json`, content: JSON.stringify(profileData, null, 2) },
    { filename: `fz${profileNum}_token.json`, content: JSON.stringify(tokenData, null, 2) },
    { filename: `fz${profileNum}_sticky.json`, content: JSON.stringify(stickyData, null, 2) }
  ];
  for (const file of files) {
    await fetch('/api/save-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file)
    });
  }
}
