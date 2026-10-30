"use client";

import AppLink from "@/components/ui/link";
import { MAILTO, site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

export default function GetInTouchSection() {
  const copy = site.getInTouch;
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  return (
    <section id="contact" className="relative pt-c-160 pb-c-320">
      <p className="flex flex-col items-center display-140">
        <span className="js-s-lines w-full text-center">
          <span className="w-fit mobile-landscape:-ml-c-80">{copy.line1}</span>
        </span>
        <span className="js-s-lines w-full text-center">
          <span>{copy.line2}</span>
        </span>
        <span className="js-s-lines w-full text-center">
          <AppLink isExternalLink href={MAILTO} className="w-fit mobile-landscape:ml-c-80 underline">
            {copy.line3}
          </AppLink>
        </span>
        <span className="js-s-lines w-full text-center">
          <span className="w-fit mobile-landscape:-ml-c-320">{copy.line4}</span>
        </span>
        <span className="js-s-lines w-full text-center">
          <span
            data-event="hover"
            onClick={() => setShowContactForm(true)}
            className="w-fit mobile-landscape:-ml-c-360 underline cursor-pointer"
          >
            {copy.line5}
          </span>
        </span>
      </p>
    </section>
  );
}
