"use client";

import Button from "@/components/ui/button";
import AppLink from "@/components/ui/link";
import { site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

export default function HeroSection() {
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  const copy = site.hero;
  return (
    <section
      data-home-hero
      data-geometry="logo"
      data-geometry-entry-animation="false"
      className="mt-navbar-height pt-4 px-8 pb-10 tablet-portrait:pt-6 tablet-portrait:px-12 tablet-landscape:px-16 desktop-sm:px-20 tablet-portrait:pb-10 desktop:pt-10 desktop:px-24 desktop:pb-20 desktop-lg:pt-20 desktop-lg:px-30 desktop-lg:pb-30 min-h-hero-screen-height flex flex-col justify-between"
    >
      <div className="flex flex-col gap-3">
        <h1
          data-home-hero-title
          className="heading-1 font-instrument-serif italic max-w-80 tablet-portrait:max-w-140 desktop-sm:max-w-170 desktop-lg:max-w-210 opacity-0"
          dangerouslySetInnerHTML={{ __html: copy.title }}
        />
      </div>
      <div className="w-fit tablet-landscape:w-auto ml-auto tablet-landscape:ml-[initial] gap-c-16 flex flex-col-reverse tablet-landscape:flex-row items-start tablet-landscape:items-end justify-start tablet-landscape:justify-between">
        <div className="flex gap-2 tablet-landscape:gap-4">
          <Button data-home-hero-cta noAnimation className="invisible" onClick={() => setShowContactForm(true)}>
            {copy.cta1}
          </Button>
          <AppLink href="/work">
            <Button data-home-hero-cta noAnimation className="invisible">
              {copy.cta2}
            </Button>
          </AppLink>
        </div>
        <div className="w-full mobile-landscape:w-90 tablet-portrait:shrink-0">
          <p data-home-hero-description className="mobile-landscape:text-justify opacity-0 h-fit!">
            {copy.description}
          </p>
        </div>
      </div>
    </section>
  );
}
