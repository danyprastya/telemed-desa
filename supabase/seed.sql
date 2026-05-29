-- ============================================================
-- TeleMed Desa — Seed Data (Demo/Testing)
-- ============================================================
-- Run this AFTER the initial migration.
-- Creates demo puskesmas, hospitals, and an admin user.
-- NOTE: You must create the admin auth user first via Supabase Dashboard
-- or via the admin API. This just creates the profile row.
-- ============================================================

-- Demo Puskesmas
INSERT INTO public.puskesmas (id, name, location) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Puskesmas Desa Sejahtera', 'Kec. Merdeka, Kab. Nusantara Barat'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Puskesmas Pulau Harapan', 'Kec. Bahari, Kab. Kepulauan Timur'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Puskesmas Rimba Sakti', 'Kec. Pedalaman, Kab. Kalimantan Utara');

-- Demo Hospitals
INSERT INTO public.hospitals (id, name, location) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'RSUD Kota Harapan', 'Kota Harapan, Provinsi Nusantara'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'RS Pendidikan Universitas Medika', 'Kota Metro, Provinsi Jawa Tengah');

-- ============================================================
-- To create the initial admin user:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" with email: admin@telemed-desa.go.id, password: your-secure-password
-- 3. Copy the user's UUID
-- 4. Run: INSERT INTO public.profiles (id, full_name, role) VALUES ('<UUID>', 'Administrator', 'admin');
-- ============================================================
