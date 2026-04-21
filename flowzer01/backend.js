const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, 'public');
const NEWSTATE_DIR = path.join(PUBLIC_DIR, 'NewState');
// No longer use a fixed filename; accept from client

// Endpoint to save (stage) the file to NewState with timestamp
app.post('/api/save-text', (req, res) => {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  const content = req.body.content || '';
  let filename = req.body.filename;
  if (!filename || typeof filename !== 'string' || !filename.endsWith('.txt')) {
    return res.status(400).json({ status: 'error', message: 'Invalid filename' });
  }
  const filePath = path.join(NEWSTATE_DIR, filename);
  const backupPath = filePath + '.bck';
  // If file exists, back it up
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  res.json({ status: 'ok', message: `File ${filename} saved to NewState (backup created if existed)`, timestamp });
});

// Endpoint to refresh (publish) the file from NewState to public
// Also update refresh to accept filename
app.post('/api/refresh-text', (req, res) => {
  let filename = req.body && req.body.filename;
  if (!filename || typeof filename !== 'string' || !filename.endsWith('.txt')) {
    filename = 'text_text.txt'; // fallback for legacy calls
  }
  const src = path.join(NEWSTATE_DIR, filename);
  const dest = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(src)) {
    return res.status(404).json({ status: 'error', message: `No staged file found for ${filename}.` });
  }
  fs.copyFileSync(src, dest);
  res.json({ status: 'ok', message: `File ${filename} refreshed to public.` });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
