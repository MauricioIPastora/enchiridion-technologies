"use client";

import Button from "@/components/ui/button";
import { site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";
import { SparkIcon } from "@/features/home/process-section";

/** Phone layout of the process section (global js-s-* scroll reveals). */
export default function ProcessSectionMobile() {
  const copy = site.process;
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  return (
    <section className="relative block tablet-portrait:hidden safearea-md">
      <div className="grid grid-cols-7 gap-c-48">
        <div className="col-span-full h-fit flex flex-col items-start gap-c-16 py-c-32 max-w-90">
          <h2 data-start-from-zero="true" className="js-s-print-opacity heading-2 font-instrument-serif">
            {copy.title}
          </h2>
          <p className="js-s-lines body-md">{copy.description}</p>
          <Button onClick={() => setShowContactForm(true)}>{copy.cta}</Button>
        </div>
        <div className="relative col-span-6 col-start-2 mobile-landscape:col-span-5 mobile-landscape:col-start-3 flex flex-col gap-c-48">
          <div className="absolute top-0 left-0 w-px h-full">
            <div className="w-6 h-6 sticky top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                data-start="bottom top"
                data-end="bottom top-=40px"
                data-scrub="true"
                data-scale="0"
                className="js-s-fade-out absolute top-0 left-0 -translate-x-full mobile-landscape:translate-x-[-120%]! ml-px"
              >
                <SparkIcon
                  data-start="top center+=20px"
                  data-end="bottom center-=20px"
                  data-scrub="true"
                  data-scale="0"
                  className="js-s-fade-in drop-shadow-[0_0_24px_white]"
                />
              </div>
            </div>
          </div>
          {copy.steps.map((step) => (
            <div key={step.id} className="flex flex-col mobile-landscape:pr-20">
              <p data-start="top center" data-end="bottom center" data-scrub="true" className="js-s-print-opacity body-xl text-brand-05/40">
                {step.id}
              </p>
              <p data-start="top center" data-end="bottom center" data-scrub="true" className="js-s-print-opacity heading-3 font-instrument-serif">
                {step.title}
              </p>
              <p data-start="top center" data-end="bottom center" data-scrub="true" className="js-s-print-opacity body-lg text-brand-05/80">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
