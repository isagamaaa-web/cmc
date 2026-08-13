CREATE TABLE public.service_prices (
  title text PRIMARY KEY,
  price text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_prices TO anon;
GRANT SELECT ON public.service_prices TO authenticated;
GRANT ALL ON public.service_prices TO service_role;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service prices are publicly readable" ON public.service_prices FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.admin_config (
  id smallint PRIMARY KEY DEFAULT 1,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_config_single_row CHECK (id = 1)
);
GRANT ALL ON public.admin_config TO service_role;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_config (id, pin_hash) VALUES (1, '9725b5bd63160f901688cb2e80f3a9ed13bf8b818e23aa31b849a199fc1f4b1b');

INSERT INTO public.service_prices (title, price) VALUES
('Normal Check-up', '300 – 800 ETB'),
('Internal Medicine Consultations', '800 – 3,000 ETB'),
('Heart Diagnostics & ECG', '500 – 2,000 ETB'),
('Vitamin D Services & Treatment', '1,000 – 2,000 ETB'),
('Ultrasound / Sonography', '525 – 17,100 ETB'),
('Infertility Work-ups', '2,500 – 12,000 ETB'),
('Complete Blood Count (CBC)', '200 – 800 ETB'),
('Kidney Function Test (RFT)', '600 – 2,200 ETB'),
('Liver Function Test (LFT)', '800 – 2,500 ETB'),
('Uric Acid Test', '350 – 1,000 ETB'),
('Lipid Panel', '700 – 2,200 ETB'),
('Malaria Testing (BF & RDT)', '150 – 500 ETB'),
('Stool & Urine Analysis', '200 – 600 ETB'),
('Stomach Bacteria Test (H.Pylori Ag)', '400 – 1,200 ETB'),
('Diabetes Screening (FBS & HGA1C)', '500 – 1,800 ETB'),
('Tuberculosis Screening', '300 – 1,500 ETB'),
('Hormone Panels — incl. Thyroid', '1,500 – 4,500 ETB');