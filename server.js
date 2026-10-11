// เซิร์ฟเวอร์: เสิร์ฟหน้าเว็บ + เก็บไฟล์ GeoJSON + แจ้งทุกเครื่องแบบเรียลไทม์ (SSE)
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const KEY = process.env.EDIT_KEY || '';                 // รหัสสำหรับผู้แก้ไข (ตั้งใน .env / Environment)
const DIR = process.env.DATA_DIR || path.join(__dirname, 'storage');
const MAX_MB = +process.env.MAX_MB || 60;               // ขนาดไฟล์สูงสุดต่อไฟล์

const IDX = path.join(DIR, 'index.json');
let index = [];                                         // [{id,name,size,at,features}]
const clients = new Set();
let q = Promise.resolve();
const save = () => (q = q.then(() => fs.writeFile(IDX, JSON.stringify(index))));

const push = ev => { const m = `data: ${JSON.stringify(ev)}\n\n`; clients.forEach(r => r.write(m)); };
const authed = req => {
  if (!KEY) return false;
  const a = Buffer.from(req.get('x-edit-key') || ''), b = Buffer.from(KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const need = (req, res, next) => authed(req) ? next() : res.status(401).json({ error: 'รหัสแก้ไขไม่ถูกต้อง' });

const app = express();
app.disable('x-powered-by');

app.get('/api/files', (req, res) => res.json({ files: index, online: clients.size }));
app.get('/api/auth', need, (req, res) => res.json({ ok: true }));

app.get('/api/files/:id', (req, res) => {
  const f = index.find(x => x.id === req.params.id);
  if (!f) return res.status(404).json({ error: 'ไม่พบไฟล์' });
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.type('application/json').sendFile(path.join(DIR, 'files', f.id + '.geojson'));
});

app.post('/api/files', need, express.json({ limit: MAX_MB + 'mb' }), async (req, res) => {
  const j = req.body;
  if (!j || j.type !== 'FeatureCollection' || !Array.isArray(j.features))
    return res.status(400).json({ error: 'ต้องเป็น GeoJSON แบบ FeatureCollection' });
  const name = String(req.query.name || 'upload.geojson').replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 120);
  const id = crypto.randomUUID();
  await fs.writeFile(path.join(DIR, 'files', id + '.geojson'), JSON.stringify(j));
  const meta = { id, name, features: j.features.length, at: new Date().toISOString() };
  index.push(meta); await save();
  push({ type: 'changed', action: 'add', name });
  res.json(meta);
});

app.delete('/api/files/:id', need, async (req, res) => {
  const i = index.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'ไม่พบไฟล์' });
  const [f] = index.splice(i, 1); await save();
  fs.unlink(path.join(DIR, 'files', f.id + '.geojson')).catch(() => {});
  push({ type: 'changed', action: 'remove', name: f.name });
  res.json({ ok: true });
});

app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  clients.add(res); push({ type: 'online', n: clients.size });
  const hb = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(hb); clients.delete(res); push({ type: 'online', n: clients.size }); });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.type === 'entity.too.large' ? `ไฟล์ใหญ่เกิน ${MAX_MB} MB` : err.message }));

(async () => {
  await fs.mkdir(path.join(DIR, 'files'), { recursive: true });
  try { index = JSON.parse(await fs.readFile(IDX, 'utf8')); } catch { index = []; }
  app.listen(PORT, () => {
    console.log(`THEOS-2 Live Dashboard: http://localhost:${PORT}  (ไฟล์ที่แชร์อยู่: ${index.length})`);
    if (!KEY) console.warn('⚠ ยังไม่ได้ตั้ง EDIT_KEY — จะอัปโหลด/ลบไฟล์ไม่ได้ (ดู .env.example)');
  });
})();
