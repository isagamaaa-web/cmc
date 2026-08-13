export const CLINIC = {
  name: "Central Medium Clinic",
  brand: "Central Health Services",
  doctor: "Dr. Gebeyehu",
  role: "Internal Medicine Specialist",
  phones: ["0912-22-49-71", "0911-48-72-49"],
  hours: "24/7 Everyday Service",
  address:
    "Ashawa Meda, near Gabriel Church, on the road that leads to Kusaye, right next to the Salaam Mosque.",
};

export const ADMIN_EMAIL = "yeroneee133@gmail.com";

export type ServiceItem = {
  code?: string;
  title: string;
  description: string;
  price: string;
};

export const CLINICAL_SERVICE_ITEMS: ServiceItem[] = [
  {
    title: "Normal Check-up",
    description: "General health check: vitals, physical exam and doctor's advice.",
    price: "300 – 800 ETB",
  },
  {
    title: "Internal Medicine Consultations",
    description: "One-on-one specialist care with Dr. Gebeyehu.",
    price: "800 – 3,000 ETB",
  },

  {
    title: "Heart Diagnostics & ECG",
    description: "12-lead electrocardiogram tracking and cardiac review.",
    price: "500 – 2,000 ETB",
  },
  {
    title: "Vitamin D Services & Treatment",
    description: "Testing, supplementation planning and follow-up.",
    price: "1,000 – 2,000 ETB",
  },
  {
    title: "Ultrasound / Sonography",
    description: "Abdominal, pelvic and general imaging on-site.",
    price: "525 – 17,100 ETB",
  },
  {
    title: "Infertility Work-ups",
    description: "Comprehensive assessment for couples.",
    price: "2,500 – 12,000 ETB",
  },
];

export const LAB_PANEL_ITEMS: ServiceItem[] = [
  { code: "CBC", title: "Complete Blood Count (CBC)", description: "Full hematology profile — red cells, white cells, platelets.", price: "200 – 800 ETB" },
  { code: "RFT", title: "Kidney Function Test (RFT)", description: "Creatinine, urea and electrolytes to assess renal health.", price: "600 – 2,200 ETB" },
  { code: "LFT", title: "Liver Function Test (LFT)", description: "ALT, AST, bilirubin and albumin liver enzyme panel.", price: "800 – 2,500 ETB" },
  { code: "Uric Acid", title: "Uric Acid Test", description: "Screens for gout, arthritis and metabolic imbalance.", price: "350 – 1,000 ETB" },
  { code: "Lipid", title: "Lipid Panel", description: "Cholesterol, triglycerides, HDL and LDL cardiac risk profile.", price: "700 – 2,200 ETB" },
  { code: "Malaria", title: "Malaria Testing (BF & RDT)", description: "Blood film microscopy plus rapid diagnostic testing.", price: "150 – 500 ETB" },
  { code: "U/A & S/E", title: "Stool & Urine Analysis", description: "Comprehensive urinalysis and stool examination.", price: "200 – 600 ETB" },
  { code: "H.Pylori", title: "Stomach Bacteria Test (H.Pylori Ag)", description: "Detects ulcer-causing bacterial antigens.", price: "400 – 1,200 ETB" },
  { code: "Diabetes", title: "Diabetes Screening (FBS & HGA1C)", description: "Fasting glucose and 3-month average blood sugar.", price: "500 – 1,800 ETB" },
  { code: "TB", title: "Tuberculosis Screening", description: "Early detection screening for pulmonary tuberculosis.", price: "300 – 1,500 ETB" },
  { code: "Hormones", title: "Hormone Panels — incl. Thyroid", description: "TSH, T3, T4 and reproductive hormone assays.", price: "1,500 – 4,500 ETB" },
];

export const ALL_SERVICE_ITEMS: ServiceItem[] = [
  ...LAB_PANEL_ITEMS,
  ...CLINICAL_SERVICE_ITEMS,
];

export const LAB_PANELS = LAB_PANEL_ITEMS.map((i) => i.title);
export const CLINICAL_SERVICES = CLINICAL_SERVICE_ITEMS.map((i) => i.title);
export const ALL_SERVICES = ALL_SERVICE_ITEMS.map((i) => i.title);

export const SERVICE_PRICES: Record<string, string> = Object.fromEntries(
  ALL_SERVICE_ITEMS.map((i) => [i.title, i.price]),
);

export function priceFor(service: string): string | undefined {
  return SERVICE_PRICES[service];
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
