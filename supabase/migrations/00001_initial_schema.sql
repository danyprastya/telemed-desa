-- ============================================================
-- TeleMed Desa — Initial Database Schema
-- ============================================================
-- Run this migration in the Supabase SQL editor to set up all
-- tables, enums, RLS policies, and triggers.
-- ============================================================

-- 1. CUSTOM ENUMS
DO $ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'doctor', 'nurse');
EXCEPTION
  WHEN duplicate_object THEN null;
END $;
DO $ BEGIN
  CREATE TYPE public.patient_gender AS ENUM ('male', 'female');
EXCEPTION
  WHEN duplicate_object THEN null;
END $;
DO $ BEGIN
  CREATE TYPE public.consultation_status AS ENUM ('open', 'in_progress', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $;
DO $ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
  'new_consultation', 'new_message', 'consultation_claimed', 'consultation_closed'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $;

-- 2. PUSKESMAS TABLE
CREATE TABLE IF NOT EXISTS public.puskesmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'nurse',
  puskesmas_id UUID REFERENCES public.puskesmas(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nik TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  gender public.patient_gender NOT NULL,
  address TEXT NOT NULL,
  medical_record_no TEXT NOT NULL UNIQUE,
  puskesmas_id UUID NOT NULL REFERENCES public.puskesmas(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. VITAL SIGNS TABLE
CREATE TABLE IF NOT EXISTS public.vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  temperature NUMERIC(4,1) NOT NULL,
  heart_rate INTEGER NOT NULL,
  spo2 INTEGER NOT NULL,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reasons TEXT[],
  recorded_by UUID NOT NULL REFERENCES public.profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CONSULTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  nurse_id UUID NOT NULL REFERENCES public.profiles(id),
  doctor_id UUID REFERENCES public.profiles(id),
  vital_sign_id UUID REFERENCES public.vital_signs(id),
  status public.consultation_status NOT NULL DEFAULT 'open',
  closing_notes TEXT,
  referral_needed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 8. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_patients_puskesmas ON public.patients(puskesmas_id) WHERE NOT is_deleted;
CREATE INDEX IF NOT EXISTS idx_patients_nik ON public.patients(nik);
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient ON public.vital_signs(patient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_nurse ON public.consultations(nurse_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_messages_consultation ON public.messages(consultation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_patients_updated_at ON public.patients;
CREATE TRIGGER set_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.puskesmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PUSKESMAS: all authenticated users can read
DROP POLICY IF EXISTS "Puskesmas: read for authenticated" ON public.puskesmas;
CREATE POLICY "Puskesmas: read for authenticated" ON public.puskesmas
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Puskesmas: admin insert" ON public.puskesmas;
CREATE POLICY "Puskesmas: admin insert" ON public.puskesmas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );
DROP POLICY IF EXISTS "Puskesmas: admin update" ON public.puskesmas;
CREATE POLICY "Puskesmas: admin update" ON public.puskesmas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );
DROP POLICY IF EXISTS "Puskesmas: admin delete" ON public.puskesmas;
CREATE POLICY "Puskesmas: admin delete" ON public.puskesmas
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );

-- HOSPITALS: all authenticated can read
DROP POLICY IF EXISTS "Hospitals: read for authenticated" ON public.hospitals;
CREATE POLICY "Hospitals: read for authenticated" ON public.hospitals
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Hospitals: admin insert" ON public.hospitals;
CREATE POLICY "Hospitals: admin insert" ON public.hospitals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );
DROP POLICY IF EXISTS "Hospitals: admin update" ON public.hospitals;
CREATE POLICY "Hospitals: admin update" ON public.hospitals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );
DROP POLICY IF EXISTS "Hospitals: admin delete" ON public.hospitals;
CREATE POLICY "Hospitals: admin delete" ON public.hospitals
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );

-- PROFILES: users can read all profiles, admin can update
DROP POLICY IF EXISTS "Profiles: read for authenticated" ON public.profiles;
CREATE POLICY "Profiles: read for authenticated" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Profiles: admin update" ON public.profiles;
CREATE POLICY "Profiles: admin update" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );

-- PATIENTS: nurses see own puskesmas, doctors see all, admin sees all
DROP POLICY IF EXISTS "Patients: nurse read own puskesmas" ON public.patients;
CREATE POLICY "Patients: nurse read own puskesmas" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.is_active
      AND (
        p.role = 'admin'
        OR p.role = 'doctor'
        OR (p.role = 'nurse' AND p.puskesmas_id = patients.puskesmas_id)
      )
    )
  );
DROP POLICY IF EXISTS "Patients: nurse insert" ON public.patients;
CREATE POLICY "Patients: nurse insert" ON public.patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'nurse' AND p.is_active
      AND p.puskesmas_id = patients.puskesmas_id
    )
  );
DROP POLICY IF EXISTS "Patients: nurse/admin update" ON public.patients;
CREATE POLICY "Patients: nurse/admin update" ON public.patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND (p.role = 'admin' OR (p.role = 'nurse' AND p.puskesmas_id = patients.puskesmas_id))
    )
  );

-- VITAL SIGNS: same as patients + nurse can insert
DROP POLICY IF EXISTS "Vitals: read for participants" ON public.vital_signs;
CREATE POLICY "Vitals: read for participants" ON public.vital_signs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients pt
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE pt.id = vital_signs.patient_id
      AND p.is_active
      AND (
        p.role IN ('admin', 'doctor')
        OR (p.role = 'nurse' AND p.puskesmas_id = pt.puskesmas_id)
      )
    )
  );
DROP POLICY IF EXISTS "Vitals: nurse insert" ON public.vital_signs;
CREATE POLICY "Vitals: nurse insert" ON public.vital_signs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'nurse' AND is_active
    )
  );

-- CONSULTATIONS: nurse sees own, doctor sees all, admin sees all
DROP POLICY IF EXISTS "Consultations: read for authenticated" ON public.consultations;
CREATE POLICY "Consultations: read for authenticated" ON public.consultations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND (
        p.role IN ('admin', 'doctor')
        OR (p.role = 'nurse' AND p.id = consultations.nurse_id)
      )
    )
  );
DROP POLICY IF EXISTS "Consultations: nurse insert" ON public.consultations;
CREATE POLICY "Consultations: nurse insert" ON public.consultations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'nurse' AND is_active
    )
  );
DROP POLICY IF EXISTS "Consultations: doctor/admin update" ON public.consultations;
CREATE POLICY "Consultations: doctor/admin update" ON public.consultations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_active
      AND (p.role IN ('admin', 'doctor'))
    )
  );

-- MESSAGES: only consultation participants
DROP POLICY IF EXISTS "Messages: read for participants" ON public.messages;
CREATE POLICY "Messages: read for participants" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = messages.consultation_id
      AND (c.nurse_id = auth.uid() OR c.doctor_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
DROP POLICY IF EXISTS "Messages: participant insert" ON public.messages;
CREATE POLICY "Messages: participant insert" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = messages.consultation_id
      AND (c.nurse_id = auth.uid() OR c.doctor_id = auth.uid())
      AND c.status != 'closed'
    )
  );

-- NOTIFICATIONS: users can only read/update their own
DROP POLICY IF EXISTS "Notifications: read own" ON public.notifications;
CREATE POLICY "Notifications: read own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Notifications: update own" ON public.notifications;
CREATE POLICY "Notifications: update own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

-- AUDIT LOGS: admin only
DROP POLICY IF EXISTS "Audit: admin read" ON public.audit_logs;
CREATE POLICY "Audit: admin read" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active)
  );

-- ============================================================
-- REALTIME PUBLICATIONS
-- ============================================================
-- Enable Realtime for messages, vital_signs, notifications, and consultations
DO $ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $;
DO $ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vital_signs;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $;
DO $ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $;
DO $ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $;
