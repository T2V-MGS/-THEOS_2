/*
 * ตั้งค่าการเชื่อมต่อ Supabase สำหรับ GitHub Pages
 * ค่านี้ใช้ได้ใน frontend เฉพาะ Project URL และ publishable/anon key เท่านั้น
 * ห้ามใส่ service_role key หรือ secret key ในไฟล์นี้เด็ดขาด
 */
window.THEOS2_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
