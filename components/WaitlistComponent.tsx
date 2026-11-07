"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackWaitlistSignup } from "@/lib/meta-pixel";

/**
 * Waitlist signup — posts to the Hook API's public waitlist endpoint.
 *
 * Contract (verified against production 2026-09-29):
 *   POST {NEXT_PUBLIC_API_URL}/api/v1/public/waitlist
 *   body: { name, email, phone, city, consent }  — strict schema, no extra keys
 *   200:  { success: true, data: { publicId, alreadyJoined } }
 *   400:  { success: false, error: { code, message, details } }
 *
 * Note: `items` is NOT accepted by the API (rejected as an unrecognized key).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://hook-api.onrender.com";

const WAITLIST_URL = `${API_BASE}/api/v1/public/waitlist`;

/** Minimum time the "Submitting…" state stays up, so it never just flashes. */
const SUBMIT_DELAY_MS = 1000;

/**
 * Client-side mirror of the API's own rules, so Submit only enables on a
 * payload the server will actually accept. The server stays authoritative —
 * these are deliberately no stricter than its schema.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]{7,20}$/;
const NAME_MIN = 2;
const CITY_MIN = 2;

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  city: "",
  itemInterest: "",
};

type WaitlistError = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: {
      formErrors?: string[];
      fieldErrors?: Record<string, string[]>;
    };
  };
};

/** Pull the most useful human-readable line out of a 400 response body. */
function readApiError(body: WaitlistError | null): string {
  const details = body?.error?.details;
  if (details?.fieldErrors) {
    const first = Object.values(details.fieldErrors).flat()[0];
    if (first) return first;
  }
  const formError = details?.formErrors?.[0];
  if (formError) return formError;
  return body?.error?.message ?? "Something went wrong. Please try again.";
}

export default function WaitlistComponent({
  showHeading = true,
  onDone,
}: {
  showHeading?: boolean;
  /** Supplied when hosted in the modal: closes it instead of linking home. */
  onDone?: () => void;
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  // null = form visible; { alreadyJoined } = success modal visible.
  const [result, setResult] = useState<{ alreadyJoined: boolean } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit stays disabled until every field is filled in *validly* and the
  // consent box is ticked.
  const nameOk = formData.name.trim().length >= NAME_MIN;
  const phoneOk = PHONE_RE.test(formData.phone.trim());
  const emailOk = EMAIL_RE.test(formData.email.trim());
  const cityOk = formData.city.trim().length >= CITY_MIN;
  const isComplete = nameOk && phoneOk && emailOk && cityOk && consent;

  // Only start nagging once they've actually begun filling the form.
  const hasStarted = Boolean(
    formData.name || formData.phone || formData.email || formData.city || consent
  );
  const stillNeeded = [
    !nameOk && "your name",
    !emailOk && "a valid email",
    !phoneOk && "a valid phone number",
    !cityOk && "your city",
    !consent && "your consent",
  ].filter(Boolean) as string[];

  const handleClose = useCallback(() => {
    setResult(null);
    setFormData(EMPTY_FORM);
    setConsent(false);
    setError("");
  }, []);

  // Escape closes the success dialog.
  useEffect(() => {
    if (!result) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [result, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // The button is disabled unless this holds, so it's belt-and-braces.
    if (!isComplete) return;

    setError("");
    setIsSubmitting(true);

    try {
      // The request fires immediately; the delay runs alongside it so the
      // result can't appear before SUBMIT_DELAY_MS has passed.
      const [res] = await Promise.all([
        fetch(WAITLIST_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            // Optional on the API; `undefined` is dropped by JSON.stringify,
            // so a blank answer is omitted rather than sent as "".
            itemInterest: formData.itemInterest.trim() || undefined,
            consent: true,
          }),
        }),
        new Promise((resolve) => setTimeout(resolve, SUBMIT_DELAY_MS)),
      ]);

      const body = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        setError(readApiError(body as WaitlistError | null));
        return;
      }

      const alreadyJoined = Boolean(body.data?.alreadyJoined);

      // Only first-time signups count as new leads.
      if (!alreadyJoined) trackWaitlistSignup();

      setResult({ alreadyJoined });
    } catch {
      // Network failure / offline / CORS.
      setError("Couldn't reach the server. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-xl bg-brand-soft rounded-[32px] p-6 sm:p-8 md:p-10 font-sans">
        {showHeading && (
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink text-center mb-6 sm:mb-8 tracking-tight">
            Join Waitlist
          </h2>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-ember-soft text-ink text-sm rounded-xl font-medium text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              autoComplete="name"
              required
              className="w-full px-5 py-4 bg-white rounded-full text-ink placeholder-ink-faint outline-none focus:ring-2 focus:ring-brand transition"
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              autoComplete="tel"
              required
              pattern="\+?[0-9\s\-]{7,20}"
              title="Enter a valid phone number"
              className="w-full px-5 py-4 bg-white rounded-full text-ink placeholder-ink-faint outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              autoComplete="email"
              required
              className="w-full px-5 py-4 bg-white rounded-full text-ink placeholder-ink-faint outline-none focus:ring-2 focus:ring-brand transition"
            />
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City / Location"
              autoComplete="address-level2"
              required
              className="w-full px-5 py-4 bg-white rounded-full text-ink placeholder-ink-faint outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>

          {/* Optional — the API stores this as `itemInterest` (max 1000). */}
          <input
            type="text"
            name="itemInterest"
            value={formData.itemInterest}
            onChange={handleChange}
            placeholder="What item would you likely shop?"
            maxLength={1000}
            className="w-full px-5 py-4 bg-white rounded-full text-ink placeholder-ink-faint outline-none focus:ring-2 focus:ring-brand transition text-sm sm:text-base"
          />

          {/* The API requires consent; it is sent as `true` only when ticked. */}
          <label className="flex items-start gap-3 px-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-ink-faint accent-ink cursor-pointer"
            />
            <span className="text-[14px] leading-snug text-ink-muted">
              I agree to be contacted by Hook about my waitlist spot and product
              updates.
            </span>
          </label>

          {/* Explains the disabled button rather than leaving it a mystery. */}
          {hasStarted && stillNeeded.length > 0 && (
            <p className="px-1 text-[13px] leading-snug text-ink-muted text-center">
              Still needed: {stillNeeded.join(", ")}.
            </p>
          )}

          <button
            type="submit"
            disabled={!isComplete || isSubmitting}
            className="w-full mt-1 py-4 bg-brand hover:bg-brand-strong text-ink font-bold text-lg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={handleClose}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-success-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-cream rounded-[32px] p-8 md:p-12 text-center shadow-2xl animate-scale-up outline-none"
          >
            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center mx-auto text-2xl mb-6">
              🎉
            </div>

            <h3
              id="waitlist-success-title"
              className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight mb-3"
            >
              {result.alreadyJoined ? "You're already in" : "Congratulation"}
            </h3>

            <p className="text-ink-muted text-base md:text-lg leading-relaxed max-w-md mx-auto mb-8">
              {result.alreadyJoined
                ? "You're already on the Hook waitlist — we'll be in touch when we launch."
                : "You are now part of our waitlist. You'll receive an email when Hook launches."}
            </p>

            {onDone ? (
              <button
                type="button"
                onClick={onDone}
                className="inline-flex items-center justify-center px-8 py-3 bg-brand hover:bg-brand-strong text-ink font-bold rounded-full transition-colors"
              >
                Done
              </button>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-3 bg-brand hover:bg-brand-strong text-ink font-bold rounded-full transition-colors"
              >
                Back to home
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
