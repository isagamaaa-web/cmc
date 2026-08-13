import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sparkles } from "@/components/Sparkles";
import { Chatbot } from "@/components/Chatbot";
import { PageBackground } from "@/components/PageBackground";
import { OfflineCache } from "@/components/OfflineCache";
import { OfflineSync } from "@/components/OfflineSync";


import { Toaster } from "@/components/ui/sonner";
import { CLINIC } from "@/lib/clinic-data";

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["MedicalClinic", "MedicalOrganization", "LocalBusiness"],
      "@id": "#clinic",
      name: CLINIC.name,
      medicalSpecialty: "InternalMedicine",
      telephone: CLINIC.phones,
      openingHours: "Mo-Su 00:00-23:59",
      address: {
        "@type": "PostalAddress",
        streetAddress: CLINIC.address,
        addressLocality: "Addis Ababa",
        addressCountry: "ET",
      },
      employee: {
        "@type": "Physician",
        name: CLINIC.doctor,
        jobTitle: CLINIC.role,
        medicalSpecialty: "InternalMedicine",
      },
      areaServed: "Addis Ababa",
      priceRange: "$$",
    },
  ],
};

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass-card max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-6xl text-primary">404</h1>
        <p className="mt-3 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="btn-royal mt-6 inline-block rounded-full px-5 py-2 font-semibold">
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="glass-card max-w-md rounded-2xl p-8 text-center">
        <h2 className="text-xl text-primary">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please try again.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn-royal mt-5 rounded-full px-5 py-2 font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Central Medium Clinic — 24/7 Medical Care by Dr. Gebeyehu" },
      {
        name: "description",
        content:
          "Central Medium Clinic offers 24/7 complete medical care led by Dr. Gebeyehu, Internal Medicine Specialist. Book appointments, labs, imaging, and consultations.",
      },
      { name: "author", content: "Central Medium Clinic" },
      { property: "og:title", content: "Central Medium Clinic — 24/7 Medical Care" },
      {
        property: "og:description",
        content:
          "Complete medical care, day and night. Led by Dr. Gebeyehu, Internal Medicine Specialist.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(ORG_JSONLD),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/jpeg" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@700&family=Roboto+Condensed:wght@300;400;500;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  pendingComponent: PendingComponent,
});

function PendingComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/doctors");
  return (
    <QueryClientProvider client={queryClient}>
      {!isAdmin && <PageBackground />}
      {!isAdmin && <Sparkles />}
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Chatbot />
      <OfflineCache />
      <OfflineSync />

      <Toaster />

    </QueryClientProvider>
  );
}
