// ส่วนเสริมเรียลไทม์: ทำงานต่อจากสคริปต์หลักใน index.html (ใช้ parse, mk, S, setData เดิม)
(() => {
  let KEY = localStorage.getItem('editKey') || '', canEdit = false, online = 0, live = false, msg = '', tm;
  const $$ = id => document.getElementById(id);

  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:10000;display:flex;gap:10px;align-items:center;background:var(--card);color:var(--tx);border:1px solid var(--bd);border-radius:99px;padding:6px 8px 6px 14px;font:12px system-ui,"Noto Sans Thai",sans-serif;box-shadow:var(--sh);max-width:94vw';
  bar.innerHTML = '<span id="lvT"></span><button id="lvK" style="border:0;background:var(--ac);color:#fff;border-radius:99px;padding:4px 12px;cursor:pointer;font:inherit"></button>';
  document.body.appendChild(bar);
  const ui = () => {
    $$('lvT').textContent = (live ? '🟢 Live' : '🔴 ขาดการเชื่อมต่อ') + ' · ' + online + ' คนออนไลน์ · ' + (canEdit ? 'โหมดแก้ไข' : 'ดูอย่างเดียว') + (msg ? ' · ' + msg : '');
    $$('lvK').textContent = canEdit ? 'ออกจากโหมดแก้ไข' : '🔑 โหมดแก้ไข';
  };
  const flash = t => { msg = t; ui(); clearTimeout(tm); tm = setTimeout(() => { msg = ''; ui(); }, 5000); };
  const hdr = () => ({ 'x-edit-key': KEY });

  async function checkKey() {
    try { canEdit = !!KEY && (await fetch('/api/auth', { headers: hdr() })).ok; } catch { canEdit = false; }
    if (!canEdit) { KEY = ''; localStorage.removeItem('editKey'); }
    ui();
  }
  $$('lvK').onclick = async () => {
    if (canEdit) { KEY = ''; localStorage.removeItem('editKey'); canEdit = false; return ui(); }
    const k = prompt('ใส่รหัสโหมดแก้ไข (EDIT_KEY)'); if (!k) return;
    KEY = k; await checkKey();
    if (canEdit) localStorage.setItem('editKey', KEY); else alert('รหัสไม่ถูกต้อง');
  };

  // ซิงก์: เทียบรายการไฟล์บนเซิร์ฟเวอร์กับที่แสดงอยู่ แล้วเพิ่ม/ลบเฉพาะที่ต่าง
  let busy = false, again = false;
  async function sync() {
    if (busy) { again = true; return; } busy = true;
    try {
      const { files } = await (await fetch('/api/files')).json();
      const ids = new Set(files.map(f => f.id)), n0 = S.length;
      S = S.filter(s => !s.sv || ids.has(s.sv));
      let changed = S.length !== n0;
      for (const f of files) {
        if (S.some(s => s.sv === f.id)) continue;
        const arr = parse(await (await fetch('/api/files/' + f.id)).json());
        arr.forEach(mk); S.push({ id: ++sid, name: f.name, f: arr, sv: f.id }); changed = true;
      }
      if (changed) setData();
    } catch (e) { console.warn('sync', e); }
    busy = false; if (again) { again = false; sync(); }
  }

  // อัปโหลด GeoJSON: ผู้แก้ไข → ส่งขึ้นเซิร์ฟเวอร์ (ทุกเครื่องเห็น) / ผู้ชม → เปิดดูในเครื่องตัวเองตามเดิม
  const orig = $$('file').onchange;
  $$('file').onchange = async function (e) {
    if (!canEdit) return orig.call(this, e);
    for (const fl of e.target.files) {
      try {
        const t = await fl.text(); parse(JSON.parse(t));
        const r = await fetch('/api/files?name=' + encodeURIComponent(fl.name), { method: 'POST', headers: { ...hdr(), 'content-type': 'application/json' }, body: t });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
      } catch (err) { alert('อัปโหลด ' + fl.name + ' ไม่สำเร็จ: ' + err.message); }
    }
    e.target.value = '';
  };

  // ปุ่ม ✕ ของไฟล์ที่แชร์: ลบบนเซิร์ฟเวอร์ (ทุกเครื่องหาย) — ดักก่อนตัวจัดการเดิม
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const s = S.find(x => x.id == b.dataset.s); if (!s || !s.sv) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (!canEdit) return alert('ไฟล์นี้แชร์ร่วมกัน — ต้องเข้า "โหมดแก้ไข" ก่อนจึงจะลบได้');
    if (!confirm('ลบ "' + s.name + '" ออกจากทุกเครื่อง?')) return;
    fetch('/api/files/' + s.sv, { method: 'DELETE', headers: hdr() }).then(r => { if (!r.ok) alert('ลบไม่สำเร็จ'); });
  }, true);

  const es = new EventSource('/api/events');   // เชื่อมต่อใหม่อัตโนมัติเมื่อหลุด
  es.onopen = () => { live = true; ui(); sync(); };
  es.onerror = () => { live = false; ui(); };
  es.onmessage = m => {
    const d = JSON.parse(m.data);
    if (d.type === 'online') { online = d.n; ui(); }
    else if (d.type === 'changed') { flash((d.action === 'add' ? 'เพิ่ม ' : 'ลบ ') + d.name); sync(); }
  };
  ui(); checkKey();
})();
