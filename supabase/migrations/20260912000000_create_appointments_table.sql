-- Appointment requests shown in the staff portal.
-- Column names match the live table used by the booking and admin pages.
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  appointment_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.appointments TO anon;
GRANT SELECT, INSERT ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Appointments are insertable by anyone'
  ) THEN
    CREATE POLICY "Appointments are insertable by anyone" ON public.appointments
      FOR INSERT TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Appointments are viewable by anon'
  ) THEN
    CREATE POLICY "Appointments are viewable by anon" ON public.appointments
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;
