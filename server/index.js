import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedData } from './data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dbPath = path.join(__dirname, 'db.json');

function loadDB() {
  if (fs.existsSync(dbPath)) {
    try {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch {
      return structuredClone(seedData);
    }
  }
  return structuredClone(seedData);
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(root, 'public')));

const db = loadDB();
if (!fs.existsSync(dbPath)) saveDB(db);

// GET /api/yearbook -> full data for the SPA
app.get('/api/yearbook', (req, res) => {
  res.json(loadDB());
});

// PATCH /api/yearbook/meta -> update cover / preface
app.patch('/api/yearbook/meta', (req, res) => {
  const current = loadDB();
  Object.assign(current.meta, req.body || {});
  saveDB(current);
  res.json(current.meta);
});

// POST /api/messages -> add a blessing message
app.post('/api/messages', (req, res) => {
  const { name, to, content } = req.body || {};
  if (!name?.trim() || !content?.trim()) {
    return res.status(400).json({ error: '姓名和祝福内容不能为空' });
  }
  const current = loadDB();
  const message = {
    id: 'msg' + Date.now().toString(36),
    name: String(name).trim().slice(0, 40),
    to: String(to || '全班同学').trim().slice(0, 40),
    content: String(content).trim().slice(0, 500),
    createdAt: new Date().toISOString()
  };
  current.messages.unshift(message);
  saveDB(current);
  res.status(201).json(message);
});

// DELETE /api/messages/:id
app.delete('/api/messages/:id', (req, res) => {
  const current = loadDB();
  const before = current.messages.length;
  current.messages = current.messages.filter((m) => m.id !== req.params.id);
  if (current.messages.length === before) {
    return res.status(404).json({ error: '留言不存在' });
  }
  saveDB(current);
  res.status(204).end();
});

// PATCH /api/students/:id -> edit own profile page
app.patch('/api/students/:id', (req, res) => {
  const current = loadDB();
  const student = current.students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ error: '学生不存在' });
  const allowed = ['message', 'plan', 'hobbies', 'email', 'phone'];
  for (const key of allowed) {
    if (typeof req.body?.[key] === 'string') student[key] = req.body[key].slice(0, 300);
  }
  saveDB(current);
  res.json(student);
});

// SPA fallback
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(root, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Yearbook server running at http://localhost:${PORT}`);
});
