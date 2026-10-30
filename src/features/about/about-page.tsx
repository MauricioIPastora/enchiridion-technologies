"use client";

import { useEffect, useState } from "react";
import { bp, minWidth } from "@/lib/breakpoints";
import Button from "@/components/ui/button";
import { site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";
import Footer from "@/features/home/footer";

function AboutHero() {
  const [tabletUp, setTabletUp] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia(minWidth(bp.tabletPortrait));
    const update = () => setTabletUp(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return (
    <section
      data-about-hero
      data-geometry-scroll-rotation-end-degrees={-720}
      data-geometry={tabletUp ? "logo" : undefined}
      data-geometry-scale={tabletUp ? "1.25 1.25 1.25" : undefined}
      data-geometry-position={tabletUp ? "0.55 0.08 0" : undefined}
      data-geometry-entry-animation={tabletUp ? undefined : "false"}
      className="mt-navbar-height relative isolate z-10 pt-4 px-8 pb-8 mobile-landscape:px-12 mobile-landscape:pb-12 tablet-portrait:px-20 tablet-portrait:pb-20 desktop:px-24 desktop:pb-20 desktop-lg:px-30 desktop-lg:pb-30 min-h-hero-screen-height flex flex-col justify-end"
    >
      <h1 data-about-hero-title className="relative z-1 heading-1 leading-[1em]! font-instrument-serif max-w-190 opacity-0">
        {site.about.heroTitle}
      </h1>
    </section>
  );
}

export default function AboutPage() {
  const copy = site.about;
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  return (
    <main data-page-content className="container relative z-10">
      <AboutHero />

      <section className="tablet-portrait:mt-c-320! pt-c-320! flex flex-col gap-40 safearea-md tablet-portrait:safearea-lg">
        <div className="ml-auto desktop-sm:ml-0 desktop-sm:grid grid-cols-2 desktop-sm:pr-c-32">
          <div />
          <div className="flex flex-col gap-c-16 tablet-portrait:gap-c-32 tablet-landscape:gap-c-48">
            <h2 className="js-s-print-opacity heading-2 font-instrument-serif">{copy.title}</h2>
            <div className="body-lg leading-[1.6em]! flex flex-col gap-c-32 max-w-140">
              {copy.paragraphs.map((p) => (
                <p key={p} className="js-s-lines">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        data-dissolve="out"
        data-dissolve-start="top bottom"
        data-dissolve-end="bottom center"
        className="relative py-c-320 mt-c-160 safearea-sm tablet-portrait:safearea-md desktop-sm:safearea-lg"
      >
        <div className="flex flex-col gap-c-32">
          <div className="flex flex-col gap-c-16 max-w-140">
            <h2 data-start-from-zero="true" className="js-s-print-opacity heading-2 font-instrument-serif">
              {copy.focusTitle}
            </h2>
            <p className="js-s-lines body-md text-brand-05/80">{copy.focusDescription}</p>
          </div>
          <div className="grid grid-cols-1 tablet-portrait:grid-cols-3 gap-c-16">
            {copy.focus.map((area, i) => (
              <div
                key={area.title}
                data-delay={String(i * 0.15)}
                className="js-s-fade-in flex flex-col gap-3 p-5 desktop:p-c-32 border border-white/10 bg-brand-100/10 backdrop-blur-xl"
              >
                <h3 className="js-s-lines heading-6 uppercase font-black">{area.title}</h3>
                <ul className="body-sm flex flex-col gap-1">
                  {area.items.map((item) => (
                    <li key={item} className="js-s-lines opacity-80">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mobile-landscape:safearea-lg px-c-32! mobile-landscape:px-c-48! desktop-sm:px-c-80! desktop:px-c-160! mt-c-160! tablet-portrait:mt-c-320!">
        <div className="grid tablet-portrait:grid-cols-2">
          <div />
          <div className="flex justify-center">
            <div className="flex flex-col gap-c-16 max-w-100">
              <h2 data-start-from-zero="true" className="js-s-print-opacity heading-2 font-instrument-serif">
                {copy.approachTitle}
              </h2>
              <p className="js-s-lines body-sm">{copy.approach}</p>
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-c-16 max-w-100 mt-c-48 tablet-portrait:mt-c-160">
            <h2 data-start-from-zero="true" className="js-s-print-opacity heading-2 font-instrument-serif">
              {copy.expectTitle}
            </h2>
            <p className="js-s-lines body-sm">{copy.expect}</p>
          </div>
        </div>
        <div className="flex justify-center my-c-48 tablet-portrait:my-c-160">
          <Button onClick={() => setShowContactForm(true)} className="whitespace-nowrap">
            {copy.cta}
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
