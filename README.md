# THEOS-2 Dashboard — GitHub Pages

เว็บไซต์นี้จัดเตรียมจาก `index.html` และไฟล์ GeoJSON ปี 2024–2026

## วิธีเผยแพร่บน GitHub Pages
1. สร้าง Repository ใหม่บน https://github.com/new (แนะนำชื่อ `from-mgs`)
2. แตกไฟล์ ZIP นี้ แล้วอัปโหลด **เนื้อหาทั้งหมดภายในโฟลเดอร์** เข้า repository โดยให้ `index.html` อยู่ที่ root
3. กด **Commit changes**
4. ไปที่ **Settings → Pages**
5. ที่ **Build and deployment** เลือก **Deploy from a branch**
6. เลือก branch `main` และ folder `/(root)` แล้วกด **Save**
7. รอสักครู่ แล้วเปิด URL ที่ GitHub Pages แสดง เช่น `https://USERNAME.github.io/from-mgs/`

## โครงสร้างไฟล์
- `index.html` — หน้า Dashboard
- `geojson/manifest.json` — รายการข้อมูลที่เว็บไซต์โหลด
- `geojson/CUF2024.geojson`
- `geojson/CUF2025.geojson`
- `geojson/CUF2026.geojson`

## หมายเหตุ
- เว็บไซต์โหลด Leaflet CSS/JS จาก CDN และแผนที่พื้นหลังจากผู้ให้บริการแผนที่ออนไลน์ จึงต้องเชื่อมต่ออินเทอร์เน็ต
- หากแก้ไขข้อมูล GeoJSON ให้เปลี่ยนค่า `v` ของไฟล์นั้นใน `geojson/manifest.json` เพื่อให้เบราว์เซอร์โหลดข้อมูลใหม่
- GitHub Pages เป็นโฮสต์ไฟล์แบบ static ไม่รองรับ backend/server-side code
