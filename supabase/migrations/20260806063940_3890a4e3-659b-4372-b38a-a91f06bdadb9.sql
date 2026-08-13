CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Server-side (service role) only: no anon/authenticated grants on purpose,
-- so saved credentials are unreachable through the public Data API.
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No policies: every non-service-role request is denied.