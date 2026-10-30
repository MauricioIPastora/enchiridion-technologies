"use client";

import { site } from "@/content/site";

/** Stacked services layout for phones (uses the global js-s-* scroll reveals). */
export default function ServicesSectionMobile() {
  const copy = site.services;
  return (
    <section className="relative z-10 block tablet-portrait:hidden">
      <div className="pt-c-160 pb-c-320 flex flex-col justify-between gap-c-120">
        <div className="max-tablet-portrait:px-8">
          <div className="flex flex-col gap-c-24 w-fit! mx-auto">
            <h2
              data-start-from-zero="true"
              className="js-s-print-opacity overflow-hidden heading-2 font-instrument-serif w-full max-w-110 indent-20"
            >
              {copy.title}
            </h2>
            <p className="body-sm mobile-landscape:max-w-105 js-s-lines ml-20">{copy.description}</p>
          </div>
        </div>
        <div className="relative flex flex-col gap-8 max-w-120 ml-auto">
          {copy.groups.map((group) => (
            <div key={group.title} className="max-mobile-landscape:flex max-mobile-landscape:flex-col max-mobile-landscape:gap-2">
              <p data-service-title className="js-s-lines heading-3 mobile-landscape:heading-4 font-instrument-serif px-c-32 pb-2">
                {group.title}
              </p>
              <div className="overflow-hidden max-mobile-landscape:px-4 safearea-sm">
                {group.services.map((service) => (
                  <div
                    key={service.title}
                    data-service-card
                    data-scrub="true"
                    className="js-s-fade-in h-full relative p-5 flex flex-col gap-2 border-t border-l border-r last:border-b border-white/10 bg-brand-100/10 backdrop-blur-xl"
                  >
                    <p data-s-lines className="js-s-lines heading-6 uppercase font-black">
                      {service.title}
                    </p>
                    <p data-s-lines className="js-s-lines body-sm font-semibold">
                      {service.highlight}
                    </p>
                    <p data-s-lines className="js-s-lines body-sm">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
