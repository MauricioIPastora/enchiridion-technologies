"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import AppLink from "@/components/ui/link";
import Select from "@/components/ui/select";
import { EMAIL, MAILTO, site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Fields = { name: string; email: string; projectType: string; message: string };
const EMPTY: Fields = { name: "", email: "", projectType: "", message: "" };

/**
 * Slide-in contact panel. The site is statically hosted, so submitting
 * composes a prefilled email in the visitor's mail client.
 */
export default function ContactDrawer() {
  const show = useGlobalStore((s) => s.showContactForm);
  const setShow = useGlobalStore((s) => s.setShowContactForm);
  const pathname = usePathname();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const copy = site.contact;

  useEffect(() => {
    setShow(false);
  }, [pathname, setShow]);

  const update = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof Fields, boolean>> = {};
    if (!fields.name.trim()) next.name = true;
    if (!fields.email.trim() || !EMAIL_RE.test(fields.email.trim())) next.email = true;
    if (!fields.projectType.trim()) next.projectType = true;
    if (!fields.message.trim()) next.message = true;
    if (Object.keys(next).length) {
      setErrors(next);
      setFeedback({
        type: "error",
        message: next.email && Object.keys(next).length === 1 ? copy.form.feedback.invalidEmail : copy.form.feedback.missingFields,
      });
      return;
    }
    setErrors({});
    const subject = encodeURIComponent(`${fields.projectType} — ${fields.name}`);
    const body = encodeURIComponent(
      `Name: ${fields.name}\nEmail: ${fields.email}\nProject type: ${fields.projectType}\n\n${fields.message}`,
    );
    window.location.href = `${MAILTO}?subject=${subject}&body=${body}`;
    setFeedback({ type: "success", message: copy.form.feedback.success });
    setFields(EMPTY);
  };

  const options = copy.form.projectType.options.map((o) => ({ value: o, label: o }));

  return (
    <div
      className={clsx(
        "fixed top-0 right-0 z-1000000 h-screen w-105 max-w-full transition-transform duration-700",
        { "translate-x-full": !show, "translate-x-0": show },
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 border-l border-r border-brand-10/10 bg-brand-100/40 backdrop-blur-3xl" />
      <section data-lenis-prevent className="relative flex h-full flex-col justify-between overflow-y-auto">
        <div className="flex flex-1 flex-col gap-3 justify-between pt-c-16 px-c-16 pb-3">
          <div>
            <div className="flex items-center justify-between gap-c-16">
              <h2 className="heading-3 font-instrument-serif text-brand-05 italic">{copy.title}</h2>
              <button
                type="button"
                data-event="hover"
                aria-label="Close contact form"
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-05/4 border border-brand-05/6"
                onClick={() => setShow(false)}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12.0205 0.707031L6.7168 6.01074L12.0205 11.3145L11.3135 12.0215L6.00977 6.71777L0.707031 12.0205L0 11.3135L5.30273 6.01074L0 0.708008L0.707031 0.000976562L6.00977 5.30371L11.3135 0L12.0205 0.707031Z"
                    fill="white"
                  />
                </svg>
              </button>
            </div>
            <p className="body-md" dangerouslySetInnerHTML={{ __html: copy.description }} />
          </div>
          <div className="flex flex-col gap-1">
            <AppLink isExternalLink href={MAILTO} className="body-md w-fit">
              {EMAIL}
            </AppLink>
            <p className="body-xs text-brand-05/60">{site.locationDetail}</p>
          </div>
        </div>
        <form className="flex flex-col" onSubmit={onSubmit} noValidate>
          <label data-event="hide" htmlFor="contact-name" className="contact-field relative h-20 max-h-[10vh] border-t border-brand-10/10 py-3 px-c-16">
            <span className="body-xs pointer-events-none flex items-center gap-1.5">
              {copy.form.name.label}
              {errors.name && <span aria-hidden="true" className="block w-1 h-1 rounded-full bg-red-500" />}
            </span>
            <input
              className="cursor-text! absolute inset-0 px-c-16 pt-6"
              id="contact-name"
              type="text"
              value={fields.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={copy.form.name.placeholder}
            />
          </label>
          <label data-event="hide" htmlFor="contact-email" className="contact-field relative h-20 max-h-[10vh] border-t border-brand-10/10 py-3 px-c-16">
            <span className="body-xs pointer-events-none flex items-center gap-1.5">
              {copy.form.email.label}
              {errors.email && <span aria-hidden="true" className="block w-1 h-1 rounded-full bg-red-500" />}
            </span>
            <input
              className="cursor-text! absolute inset-0 px-c-16 pt-6"
              id="contact-email"
              type="email"
              value={fields.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={copy.form.email.placeholder}
            />
          </label>
          <Select
            id="contact-project-type"
            label={copy.form.projectType.label}
            placeholder={copy.form.projectType.placeholder}
            value={fields.projectType}
            options={options}
            error={errors.projectType}
            active={show}
            portalTarget={portal}
            onChange={(v) => update("projectType", v)}
          />
          <label data-event="hide" htmlFor="contact-message" className="contact-field relative h-40 max-h-[20vh] border-t border-brand-10/10 py-3 px-c-16">
            <span className="body-xs pointer-events-none flex items-center gap-1.5">
              {copy.form.message.label}
              {errors.message && <span aria-hidden="true" className="block w-1 h-1 rounded-full bg-red-500" />}
            </span>
            <textarea
              className="cursor-text! absolute inset-0 px-c-16 pt-9"
              id="contact-message"
              value={fields.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder={copy.form.message.placeholder}
            />
          </label>
          {feedback && (
            <p
              aria-live="polite"
              className={clsx("body-xs px-c-16 py-3 border-t border-brand-10/10", {
                "text-brand-05": feedback.type === "success",
                "text-red-400": feedback.type === "error",
              })}
            >
              {feedback.message}
            </p>
          )}
          <button
            type="submit"
            data-event="hover"
            className="h-20 max-h-[10vh] border-t border-brand-10/10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copy.form.submit}
          </button>
        </form>
      </section>
      <div ref={setPortal} className="pointer-events-none absolute inset-0 z-20" />
    </div>
  );
}
