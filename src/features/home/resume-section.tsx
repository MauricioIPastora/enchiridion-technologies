"use client";

import Button from "@/components/ui/button";
import AppLink from "@/components/ui/link";
import { site } from "@/content/site";

export default function ResumeSection() {
  const copy = site.resume;
  return (
    <section
      data-dissolve="out"
      data-dissolve-start="top bottom"
      data-dissolve-end="bottom center"
      className="mt-c-480 relative px-8 mobile-landscape:px-0"
    >
      <div className="tablet-landscape:max-w-50vw tablet-landscape:w-1/2 mobile-landscape:flex justify-end tablet-portrait:justify-start tablet-landscape:justify-end pt-c-320">
        <div className="w-fit tablet-portrait:w-auto relative z-1 flex flex-col gap-c-16 desktop-sm:gap-c-24 desktop:gap-c-48 tablet-landscape:items-end mobile-landscape:px-c-48 tablet-landscape:px-0">
          <h2 className="heading-2 font-instrument-serif mobile-landscape:ml-auto tablet-landscape:ml-0 w-fit tablet-portrait:w-full">
            <span
              data-start-from-zero="true"
              className="js-s-print-opacity block mobile-landscape:w-fit"
              dangerouslySetInnerHTML={{ __html: copy.title }}
            />
          </h2>
          <div className="flex flex-col items-start gap-c-16 desktop-sm:gap-5 desktop:gap-c-32 w-fit">
            <p className="js-s-lines body-md mobile-landscape:max-w-105">{copy.description}</p>
            <AppLink href={copy.href}>
              <Button>
                {copy.cta}
                <span className="sr-only">{copy.ctaSuffix}</span>
              </Button>
            </AppLink>
          </div>
        </div>
      </div>
    </section>
  );
}
