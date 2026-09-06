import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, Send, ShieldCheck, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/GlassCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { ALL_SERVICES } from "@/lib/clinic-data";
import { supabase } from "@/lib/supabase";
import { getDeviceId } from "@/lib/bookings";
import {
  attemptsLeft,
  blockedUntilLabel,
  isAdminEmail,
  isBlocked,
  registerFailedAttempt,
  resetAttempts,
  verifyPin,
} from "@/lib/admin-credentials";


export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Book an Appointment — Central Medium Clinic" },
      {
        name: "description",
        content: "Book an appointment with Dr. Gebeyehu at Central Medium Clinic.",
      },
    ],
  }),
  component: Booking,
});

const MAX_DAYS_AHEAD = 60;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function maxDateISO() {
  const d = new Date();
  d.setDate(d.getDate() + MAX_DAYS_AHEAD);
  return d.toISOString().split("T")[0];
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name (at least 2 characters)")
    .max(80, "Name is too long (max 80 characters)")
    .regex(/^[\p{L}\p{M}\s.'-]+$/u, "Name can only contain letters, spaces, . ' -"),
  email: z
    .string()
    .trim()
    .max(120, "Email is too long")
    .email("Enter a valid email address (e.g. name@example.com)")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(
      /^\+251[0-9]{9}$/,
      "Phone must start with +251 followed by 9 digits (e.g. +251912224971)",
    ),
  date: z
    .string()
    .min(1, "Please choose a preferred date")
    .refine((v) => v >= todayISO(), { message: "Date cannot be in the past" })
    .refine((v) => v <= maxDateISO(), {
      message: `Date must be within the next ${MAX_DAYS_AHEAD} days`,
    }),
  service: z
    .string()
    .min(1, "Please select a service")
    .refine((v) => ALL_SERVICES.includes(v), { message: "Please select a valid service" }),
  notes: z.string().trim().max(500, "Notes are too long (max 500 characters)").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export type { StoredBooking } from "@/lib/bookings";
export { loadBookings, saveBookings } from "@/lib/bookings";

function Booking() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { error } = await supabase.from("appointments").select("id").limit(1);
        setIsOnline(!error);
      } catch {
        setIsOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: { name: "", email: "", phone: "", date: "", service: "", notes: "" },
  });


  const onSubmit = async (values: FormValues) => {
    try {
      const booking: StoredBooking = {
        deviceId: getDeviceId(),
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: values.name,
        phone: values.phone,
        date: values.date,
        service: values.service,
        email: values.email || undefined,
        notes: values.notes || undefined,
        submittedAt: new Date().toISOString(),
        done: false,
      };

      const { error } = await supabase
        .from("appointments")
        .insert({
          id: booking.id,
          name: booking.name,
          phone: booking.phone,
          email: booking.email,
          date: booking.date,
          service: booking.service,
          notes: booking.notes,
          submittedAt: booking.submittedAt,
          done: false,
        });

      if (error) throw error;

      navigate({ to: "/booking-success" });
    } catch (err) {
      console.error(err);
      toast.error(
        isOnline
          ? "We couldn't submit your request. Please try again."
          : "You're offline. Your booking will be saved locally and synced when back online."
      );
      navigate({ to: "/booking/error" });
    }
  };

  const [pinOpen, setPinOpen] = useState(false);
  const [noAppt, setNoAppt] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cmc_no_appointment") === "1") {
        setNoAppt(true);
        sessionStorage.removeItem("cmc_no_appointment");
      }
    } catch {
      /* ignore */
    }
  }, []);
  const selectedService = watch("service");