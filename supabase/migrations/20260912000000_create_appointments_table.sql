CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  date date NOT NULL,
  service text NOT NULL,
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.appointments TO anon;
GRANT SELECT ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Appointments are insertable by anyone" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Appointments are viewable by service role only" ON public.appointments
  FOR SELECT TO service_role
  USING (true);