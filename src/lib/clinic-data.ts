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
};

export const CLINICAL_SERVICE_ITEMS: ServiceItem[] = [
  {
    title: "Normal Check-up",
    description: "General health check: vitals, physical exam and doctor's advice.",
  },
  {
    title: "Internal Medicine Consultations",
    description: "One-on-one specialist care with Dr. Gebeyehu.",
  },
  {
    title: "Heart Diagnostics & ECG",
    description: "12-lead electrocardiogram tracking and cardiac review.",
  },
  {
    title: "Vitamin D Services & Treatment",
    description: "Testing, supplementation planning and follow-up.",
  },
  {
    title: "Ultrasound / Sonography",
    description: "Abdominal, pelvic and general imaging on-site.",
  },
  {
    title: "Infertility Work-ups",
    description: "Comprehensive assessment for couples.",
  },
];

export const LAB_PANEL_ITEMS: ServiceItem[] = [
  {
    code: "CBC",
    title: "Complete Blood Count (CBC)",
    description: "Full hematology profile — red cells, white cells, platelets.",
  },
  {
    code: "RFT",
    title: "Kidney Function Test (RFT)",
    description: "Creatinine, urea and electrolytes to assess renal health.",
  },
  {
    code: "LFT",
    title: "Liver Function Test (LFT)",
    description: "ALT, AST, bilirubin and albumin liver enzyme panel.",
  },
  {
    code: "Uric Acid",
    title: "Uric Acid Test",
    description: "Screens for gout, arthritis and metabolic imbalance.",
  },
  {
    code: "Lipid",
    title: "Lipid Panel",
    description: "Cholesterol, triglycerides, HDL and LDL cardiac risk profile.",
  },
  {
    code: "Malaria",
    title: "Malaria Testing (BF & RDT)",
    description: "Blood film microscopy plus rapid diagnostic testing.",
  },
  {
    code: "U/A & S/E",
    title: "Stool & Urine Analysis",
    description: "Comprehensive urinalysis and stool examination.",
  },
  {
    code: "H.Pylori",
    title: "Stomach Bacteria Test (H.Pylori Ag)",
    description: "Detects ulcer-causing bacterial antigens.",
  },
  {
    code: "Diabetes",
    title: "Diabetes Screening (FBS & HGA1C)",
    description: "Fasting glucose and 3-month average blood sugar.",
  },
  {
    code: "TB",
    title: "Tuberculosis Screening",
    description: "Early detection screening for pulmonary tuberculosis.",
  },
  {
    code: "Hormones",
    title: "Hormone Panels — incl. Thyroid",
    description: "TSH, T3, T4 and reproductive hormone assays.",
  },
];

export const ALL_SERVICE_ITEMS: ServiceItem[] = [...LAB_PANEL_ITEMS, ...CLINICAL_SERVICE_ITEMS];

export const LAB_PANELS = LAB_PANEL_ITEMS.map((i) => i.title);
export const CLINICAL_SERVICES = CLINICAL_SERVICE_ITEMS.map((i) => i.title);
export const ALL_SERVICES = ALL_SERVICE_ITEMS.map((i) => i.title);

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}
