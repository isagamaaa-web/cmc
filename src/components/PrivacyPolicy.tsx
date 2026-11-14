"use client";

import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Cookie,
  Database,
  FileText,
  LockKeyhole,
  Phone,
  RefreshCw,
  Scale,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { CLINIC, telHref } from "@/lib/clinic-data";
import { PRIVACY_LAST_UPDATED, PrivacyPolicyContext, usePrivacyPolicy } from "@/lib/privacy-policy";
import { cn } from "@/lib/utils";

type PolicySectionProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
};

function PolicySection({ icon: Icon, title, children }: PolicySectionProps) {
  return (
    <section className="scroll-mt-24">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#097d86]/10 text-[#097D86]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#097D86]">{title}</h2>
          <div className="mt-2 space-y-3 text-sm leading-relaxed text-foreground/80">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0ED5C0]/20 text-[#097D86]">
            <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PrivacyPolicyContent({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      <PolicySection icon={ShieldCheck} title="Introduction">
        <p>
          {CLINIC.name} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy
          and is committed to protecting the personal information you share with us through our
          medical booking web application.
        </p>
        <p>
          This policy explains what we collect, how we use it, how we protect it, and the choices
          you have. It also explains how cookies and browser storage are used on this website.
        </p>
      </PolicySection>

      <PolicySection icon={UserRound} title="Information we collect">
        <p>When you book an appointment, we collect the following personal information:</p>
        <CheckList
          items={[
            "Full name",
            "Phone number",
            "Email address (optional)",
            "Preferred appointment date and requested service",
            "Additional notes or information provided during booking",
          ]}
        />
        <p>
          We may also store a device identifier and your cookie preference in your browser so the
          booking and reschedule features work correctly. These are described in the cookies section
          below.
        </p>
      </PolicySection>

      <PolicySection icon={ClipboardList} title="How we use your information">
        <p>We use your information solely for the following purposes:</p>
        <CheckList
          items={[
            "Processing, confirming, and managing your medical appointments.",
            `Contacting you via phone or email regarding your visit with ${CLINIC.doctor}.`,
            "Keeping your appointment available on your device so you can reschedule.",
            "Improving clinic operations and customer service.",
            "Protecting the security and integrity of our booking system.",
          ]}
        />
      </PolicySection>

      <PolicySection icon={Database} title="Data storage & third-party services">
        <p>Your data is securely transmitted and stored using reliable cloud infrastructure:</p>
        <CheckList
          items={[
            "Database: Supabase (encrypted database storage).",
            "Hosting & infrastructure: Vercel.",
          ]}
        />
        <p>
          We do not sell, rent, or trade your personal information to third parties for marketing
          purposes. Our service providers process data only on our behalf and under appropriate
          confidentiality and security obligations.
        </p>
      </PolicySection>

      <PolicySection icon={Cookie} title="Cookies & similar technologies">
        <p>
          We use a small amount of browser storage and, with your permission, first-party cookies to
          keep the booking experience working and to remember your device. By accepting our Privacy
          Policy through the consent banner, you also consent to the use of cookies as described in
          this section.
        </p>
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#097d86]/10 bg-white/70 p-3.5">
            <p className="font-semibold text-foreground">Consent preference cookie</p>
            <p className="mt-1 text-xs leading-relaxed">
              <code className="rounded bg-[#097d86]/10 px-1.5 py-0.5 text-[11px] text-[#097D86]">
                cmc_cookie_consent
              </code>{" "}
              remembers whether you chose &quot;Accept all cookies&quot; or &quot;Essential
              only&quot;. It is a strictly necessary preference cookie, stays for up to one year,
              and is set with <code className="text-[11px]">path=/</code> and{" "}
              <code className="text-[11px]">SameSite=Lax</code>.
            </p>
          </div>
          <div className="rounded-2xl border border-[#097d86]/10 bg-white/70 p-3.5">
            <p className="font-semibold text-foreground">Optional device cookie</p>
            <p className="mt-1 text-xs leading-relaxed">
              <code className="rounded bg-[#097d86]/10 px-1.5 py-0.5 text-[11px] text-[#097D86]">
                cmc_did
              </code>{" "}
              is a first-party device identifier created only after you choose &quot;Accept all
              cookies.&quot; It helps us recognise this device if your local browser storage is
              cleared, so you can still reschedule your appointment. It is not used for advertising
              or cross-site tracking, and it is removed when you choose &quot;Essential only.&quot;
            </p>
          </div>
          <div className="rounded-2xl border border-[#097d86]/10 bg-white/70 p-3.5">
            <p className="font-semibold text-foreground">Browser storage used for booking</p>
            <p className="mt-1 text-xs leading-relaxed">
              We use <code className="text-[11px]">localStorage</code> for your device identifier,
              your booking details on this device, your language preference, and your consent
              choice. This storage supports core booking, rescheduling, and offline sync. You can
              book or reschedule even if you choose &quot;Essential only.&quot;
            </p>
          </div>
        </div>
        <p>
          We do not use advertising cookies, cross-site tracking pixels, or sell cookie data. You
          can withdraw consent at any time by clearing cookies and site data in your browser; the
          consent banner will appear again on your next visit.
        </p>
      </PolicySection>

      <PolicySection icon={LockKeyhole} title="Data retention & security">
        <p>
          We maintain reasonable administrative and technical security measures to protect your
          personal data from unauthorized access, disclosure, or loss. Appointment records are
          retained only as long as necessary for clinical and administrative management, or as
          required by applicable law.
        </p>
        <p>
          No method of transmission or storage is completely secure, but we work continuously to
          protect the information you entrust to us.
        </p>
      </PolicySection>

      <PolicySection icon={Scale} title="Your rights">
        <p>
          You have the right to request access to, correction of, or deletion of your personal data
          stored in our system. You may also withdraw cookie consent at any time.
        </p>
        <p>
          To exercise these rights, please contact our clinic administration directly using the
          details below. We may need to verify your identity before fulfilling a request.
        </p>
      </PolicySection>

      <PolicySection icon={RefreshCw} title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at
          the top of this policy will change when we do. Continued use of the booking service after
          an update means you accept the revised policy.
        </p>
      </PolicySection>

      <PolicySection icon={Phone} title="Contact us">
        <p>
          If you have questions regarding this Privacy Policy or your personal data, please contact{" "}
          {CLINIC.name} via phone or visit our clinic in person.
        </p>
        <div className="rounded-2xl border border-[#097d86]/10 bg-white/70 p-4">
          <p className="font-semibold text-foreground">{CLINIC.name}</p>
          <p className="mt-1 text-sm">{CLINIC.address}</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {CLINIC.phones.map((phone) => (
              <a
                key={phone}
                href={telHref(phone)}
                className="font-semibold text-[#097D86] hover:underline"
              >
                {phone}
              </a>
            ))}
          </p>
          <p className="mt-1 text-sm">{CLINIC.hours}</p>
        </div>
      </PolicySection>
    </div>
  );
}

export function PrivacyPolicyProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openPrivacyPolicy = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ openPrivacyPolicy }), [openPrivacyPolicy]);

  return (
    <PrivacyPolicyContext.Provider value={value}>
      {children}
      <PrivacyPolicyDialog open={open} onOpenChange={setOpen} />
    </PrivacyPolicyContext.Provider>
  );
}

export function PrivacyPolicyLink({
  children = "Privacy Policy",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  const { openPrivacyPolicy } = usePrivacyPolicy();
  return (
    <button
      type="button"
      onClick={openPrivacyPolicy}
      className={cn(
        "inline cursor-pointer font-semibold text-[#097D86] underline decoration-[#097d86]/40 underline-offset-2 transition-colors hover:text-[#0AA0AB]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PrivacyPolicyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-[#062A30]/70 backdrop-blur-md data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="privacy-dialog fixed left-1/2 top-1/2 z-[81] flex max-h-[min(92vh,840px)] w-[calc(100%-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-white/30 bg-[#F7FEFF] shadow-[0_45px_140px_-30px_rgba(6,42,48,0.8)] outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby="privacy-dialog-description"
        >
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-[#0ED5C0] via-[#0AA0AB] to-[#097D86] px-5 py-6 text-white sm:px-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#062A30]/20 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                <ShieldCheck className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 pr-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
                  Your privacy matters
                </p>
                <DialogPrimitive.Title className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Privacy Policy
                </DialogPrimitive.Title>
                <DialogPrimitive.Description
                  id="privacy-dialog-description"
                  className="mt-1 text-sm text-white/80"
                >
                  Last updated: {PRIVACY_LAST_UPDATED}
                </DialogPrimitive.Description>
              </div>
            </div>
            <DialogPrimitive.Close
              className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Close privacy policy"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="privacy-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            <PrivacyPolicyContent />
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-[#097d86]/10 bg-white/75 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link
              to="/privacy"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#097D86] transition-colors hover:text-[#0AA0AB]"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Open full page
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-royal inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              I understand
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
