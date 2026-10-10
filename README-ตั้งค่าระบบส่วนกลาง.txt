คู่มือติดตั้ง Dashboard THEOS-2 ให้ใช้ข้อมูลส่วนกลางบน GitHub Pages

ไฟล์ในชุดนี้
- index.html: เว็บไซต์ที่เพิ่มระบบ Supabase Login, อ่าน/ซิงก์ชุดข้อมูลส่วนกลาง และสิทธิ์ผู้ดูแล
- data.js: ข้อมูลตั้งต้นเดิมของ Dashboard (คงไว้ตามไฟล์แนบ)
- supabase-config.js: จุดใส่ Project URL และ publishable/anon key ของ Supabase
- supabase-setup.sql: สร้างตารางและนโยบายความปลอดภัย (RLS)

A. ตั้งค่า Supabase
1. เข้า https://supabase.com/ แล้วสร้าง Project ใหม่
2. ใน Project ไปที่ SQL Editor > New query
3. เปิดไฟล์ supabase-setup.sql คัดลอกเนื้อหาทั้งหมดไป Run
4. ไปที่ Project Settings > API (หรือ Connect) คัดลอก Project URL และ publishable key/anon key
5. แก้ไฟล์ supabase-config.js:
   url: "https://YOUR_PROJECT_ID.supabase.co"
   anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
   ใส่ค่าจริงแทนข้อความตัวอย่าง แล้วบันทึก
   สำคัญ: ใช้ publishable/anon key เท่านั้น ห้ามใส่ service_role/secret key ในหน้าเว็บ

B. สร้างบัญชีผู้ดูแล
1. ไปที่ Supabase Dashboard > Authentication > Users
2. เพิ่ม/สร้างบัญชีผู้ดูแล (อีเมลและรหัสผ่าน) ให้เรียบร้อย
3. คัดลอก User UID ของบัญชีดังกล่าว
4. ไปที่ SQL Editor แล้วรันคำสั่ง โดยแทน UUID ด้วย User UID จริง:
   insert into public.admin_users (user_id) values ('PASTE_AUTH_USER_UUID_HERE');
5. อย่าเพิ่ม UID ของผู้ใช้ทั่วไปลงในตาราง admin_users เพราะบัญชีในตารางนี้สามารถเพิ่ม/ลบข้อมูลส่วนกลางได้

C. เผยแพร่ GitHub Pages
1. อัปโหลด index.html, data.js, supabase-config.js ไปไว้ในโฟลเดอร์เดียวกันใน repository ที่เผยแพร่ GitHub Pages
2. ถ้าเว็บไซต์เดิมใช้รูป img/logo1.png และ img/logo2.png ให้นำโฟลเดอร์ img เดิมไปด้วย เพื่อคงโลโก้
3. Commit และ Push แล้วรอ GitHub Pages เผยแพร่เวอร์ชันใหม่
4. เปิดเว็บไซต์ผ่าน URL HTTPS ของ GitHub Pages (ไม่ควรเปิด index.html ด้วย file://)

D. วิธีใช้งาน
- ผู้ใช้ทั่วไป: เปิดเว็บไซต์แล้วดู Dashboard/Map และข้อมูลจากตาราง shared_datasets ได้เลย ไม่ต้องล็อกอิน
- ผู้ดูแล: กรอกอีเมล/รหัสผ่านในแถบด้านบน แล้วกดเข้าสู่ระบบ จากนั้นจะเห็นปุ่มเพิ่ม GeoJSON และปุ่มลบชุดข้อมูลส่วนกลาง
- เพิ่มข้อมูล: เลือกไฟล์ GeoJSON/JSON ที่มี FeatureCollection และ properties ที่ Dashboard ใช้ เช่น Date_Acqui, GLOBAL_INCIDENCE, CLOUD_NOTATION, DATASET_ID
- ลบข้อมูล: กด ✕ ข้างชุดข้อมูลส่วนกลาง แล้วตอบยืนยัน การลบมีผลกับผู้ใช้ทุกคน
- ส่งออก GeoJSON: ปุ่ม Export GeoJSON ยังคงส่งออกข้อมูลตามตัวกรองที่เลือกอยู่
- ขอบเขตประเทศไทยที่เลือกโหลดจากเครื่องยังเป็นการตั้งค่าของเบราว์เซอร์นั้น ไม่ได้ซิงก์เป็นข้อมูลส่วนกลาง

E. ตรวจสอบเมื่อใช้งานไม่ได้
- หากแถบสถานะแสดง “ยังไม่ได้ตั้งค่า Supabase” ให้ตรวจ supabase-config.js ว่าบันทึก URL และ key จริงแล้ว
- หากล็อกอินได้แต่ไม่เห็นสิทธิ์ผู้ดูแล ให้ตรวจว่า User UID ของบัญชีอยู่ใน public.admin_users
- หากเพิ่ม/ลบข้อมูลไม่ได้ ให้ตรวจ SQL/RLS และยืนยันว่าใช้ publishable/anon key ไม่ใช่ service_role key
- หากข้อมูลใหม่ไม่ขึ้นทันที ให้ตรวจว่า supabase_realtime มีตาราง public.shared_datasets และเปิด Developer Console ดูข้อผิดพลาด
- GitHub Pages ต้องเผยแพร่ทั้ง 3 ไฟล์ไว้ในตำแหน่งเดียวกัน: index.html, data.js, supabase-config.js

ข้อจำกัด/หมายเหตุ
- ชุดข้อมูลที่ฝังอยู่ใน data.js เป็นข้อมูลตั้งต้นแบบอ่านอย่างเดียวและไม่ถูกลบจากระบบส่วนกลาง
- GeoJSON ที่เพิ่มหลังตั้งค่าจะถูกเก็บใน Supabase และเห็นร่วมกันทุกคน
- ข้อมูลที่ผู้ใช้เคยนำเข้าเฉพาะเครื่องก่อนติดตั้งระบบส่วนกลางจะไม่ถูกอัปโหลดให้อัตโนมัติ ต้องล็อกอินผู้ดูแลแล้วนำเข้าไฟล์นั้นใหม่
- โค้ดนี้เตรียมไว้สำหรับตั้งค่า แต่ยังไม่สามารถทดสอบการเชื่อมต่อกับ Supabase จริงได้จนกว่าจะมี Project URL/key และบัญชีของคุณ
