import { CLINIC, ALL_SERVICE_ITEMS, LAB_PANEL_ITEMS, CLINICAL_SERVICE_ITEMS } from "@/lib/clinic-data";

/**
 * Offline knowledge base. Answers the most common questions (prices, hours,
 * services, location, doctor, booking) with zero network access so the
 * assistant keeps working with no connection.
 * Returns null when the question needs the online model.
 */
export function offlineAnswer(question: string): string | null {
  const q = question.toLowerCase().trim();
  if (!q) return null;

  const has = (...words: string[]) => words.some((w) => q.includes(w));

  // Direct service price match
  const matched = ALL_SERVICE_ITEMS.find((s) => {
    const t = s.title.toLowerCase();
    const short = t.replace(/\(.*?\)/g, "").trim();
    return q.includes(short) || (s.code ? q.includes(s.code.toLowerCase()) : false);
  });
  if (matched && has("price", "cost", "how much", "birr", "etb", "fee", "charge")) {
    return `${matched.title} costs ${matched.price}. ${matched.description} You can book it online or call ${CLINIC.phones[0]}.`;
  }
  if (matched) {
    return `${matched.title} — ${matched.description} Price: ${matched.price}. Open 24/7; call ${CLINIC.phones[0]} to arrange it.`;
  }

  if (has("price", "prices", "cost", "how much", "price list", "etb", "birr", "tariff")) {
    return [
      "Here are our current prices (ETB):",
      ...CLINICAL_SERVICE_ITEMS.map((s) => `• ${s.title}: ${s.price}`),
      ...LAB_PANEL_ITEMS.map((s) => `• ${s.title}: ${s.price}`),
      `Final price depends on the exact test scope. Call ${CLINIC.phones[0]} for a precise quote.`,
    ].join("\n");
  }

  if (has("open", "hour", "hours", "time", "closing", "closed", "24/7", "when")) {
    return `${CLINIC.name} is open ${CLINIC.hours} — 24 hours a day, 7 days a week, including emergencies. Call ${CLINIC.phones[0]} or ${CLINIC.phones[1]} any time.`;
  }

  if (has("where", "location", "address", "find you", "direction", "map", "located")) {
    return `We're at ${CLINIC.address} You can see the map on our Contact page.`;
  }

  if (has("phone", "call", "contact", "number", "telephone")) {
    return `You can reach us on ${CLINIC.phones[0]} or ${CLINIC.phones[1]}, 24/7.`;
  }

  if (has("doctor", "gebeyehu", "specialist", "who is")) {
    return `${CLINIC.doctor} is our ${CLINIC.role}, leading care at ${CLINIC.name}. Consultations cost 800 – 3,000 ETB and are available 24/7.`;
  }

  if (has("lab", "test", "tests", "panel", "panels")) {
    return [
      "Our laboratory panels:",
      ...LAB_PANEL_ITEMS.map((s) => `• ${s.title} — ${s.price}`),
    ].join("\n");
  }

  if (has("service", "services", "offer", "provide", "do you have")) {
    return [
      "Clinical & imaging services:",
      ...CLINICAL_SERVICE_ITEMS.map((s) => `• ${s.title} — ${s.price}`),
      "",
      "Laboratory panels:",
      ...LAB_PANEL_ITEMS.map((s) => `• ${s.title} — ${s.price}`),
    ].join("\n");
  }

  if (has("book", "appointment", "schedule", "reserve")) {
    return `You can book from the "Book Appointment" page — choose a date, service and phone number, and we'll call you to confirm. Already booked? Use the "Reschedule" page to change your date, phone or service.`;
  }

  if (has("reschedule", "change my appointment", "postpone")) {
    return `Open the "Reschedule" page. We recognise your device automatically and let you change your preferred date, phone number and service.`;
  }

  return null;
}
