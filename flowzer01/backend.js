/* eslint-env node */
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());

const PUBLIC_DIR = path.join(__dirname, 'public');
const NEWSTATE_DIR = path.join(PUBLIC_DIR, 'NewState');
const FILENAME = 'text_text.txt';

// Endpoint to save (stage) a file to NewState with timestamp and custom filename
app.post('/api/save-text', (req, res) => {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  const content = req.body.content || '';
  let filename = req.body.filename;
  // Basic validation: only allow .json or .txt files, no path traversal
  if (!filename || !/^[\w\d_-]+(\.json|\.txt)$/.test(filename)) {
    return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
  }
  const filePath = path.join(NEWSTATE_DIR, filename);
  fs.writeFileSync(filePath, content, 'utf8');
  res.json({ status: 'ok', message: `File ${filename} saved to NewState`, timestamp });
});

// Endpoint to refresh (publish) a file from NewState to public
app.post('/api/refresh-text', (req, res) => {
  let filename = req.body.filename;
  // Basic validation: only allow .json or .txt files, no path traversal
  if (!filename || !/^[\w\d_-]+(\.json|\.txt)$/.test(filename)) {
    return res.status(400).json({ status: 'error', message: 'Invalid filename.' });
  }
  const src = path.join(NEWSTATE_DIR, filename);
  const dest = path.join(PUBLIC_DIR, filename);
  if (!fs.existsSync(src)) {
    return res.status(404).json({ status: 'error', message: 'No staged file found.' });
  }
  fs.copyFileSync(src, dest);
  res.json({ status: 'ok', message: `File ${filename} refreshed to public.` });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
