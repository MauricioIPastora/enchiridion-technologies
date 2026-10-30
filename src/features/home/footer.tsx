"use client";

import AppLink from "@/components/ui/link";
import { EMAIL, MAILTO, site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

export default function Footer() {
  const copy = site.footer;
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  return (
    <footer
      data-dissolve="in"
      data-dissolve-start="top bottom"
      data-dissolve-end="top top"
      className="relative p-c-32 flex flex-col justify-between max-h-[calc(100vh-48px)] tablet-portrait:max-h-hero-screen-height h-screen overflow-hidden"
    >
      <div className="relative z-10 flex justify-between flex-col tablet-portrait:flex-row max-tablet-portrait:gap-c-32">
        <div className="js-s-lines flex flex-col">
          <p className="heading-6 font-instrument-serif text-brand-05/60">{copy.dropALine}</p>
          <AppLink isExternalLink href={MAILTO} className="heading-3 font-instrument-serif text-brand-05 italic leading-[0.8em]">
            {EMAIL}
          </AppLink>
        </div>
        <div className="grid grid-cols-2 gap-c-48 tablet-landscape:gap-c-160">
          <div className="flex flex-col gap-4">
            <p className="js-s-lines heading-6 font-instrument-serif text-brand-05/60">{copy.pages}</p>
            <div className="js-s-lines flex flex-col gap-1">
              {site.nav.pages.map((page) => (
                <AppLink key={page.href} hasProximityHover href={page.href} className="leading-[0.9em]">
                  {page.label}
                </AppLink>
              ))}
              <AppLink isTextLink className="inherit leading-[0.9em]" onClick={() => setShowContactForm(true)}>
                {site.nav.contact}
              </AppLink>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <p className="js-s-lines heading-6 font-instrument-serif text-brand-05/60">{copy.location}</p>
            <div className="js-s-lines flex flex-col gap-1">
              <p className="leading-[1.1em]">Remote &amp; On-site</p>
              <p className="leading-[1.1em]">{site.location}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-10 flex flex-col gap-c-16">
        <div className="flex justify-between flex-col mobile-landscape:flex-row max-mobile-landscape:items-center gap-2">
          <p className="body-md text-brand-05">{copy.copyright}</p>
          <p className="body-md text-brand-05">{site.location}</p>
        </div>
      </div>
    </footer>
  );
}
