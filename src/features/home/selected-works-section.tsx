"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { bp, maxWidth, useMediaQuery } from "@/lib/breakpoints";
import { handleParticleTransitionClick } from "@/lib/page-transitions";
import Button from "@/components/ui/button";
import AppLink from "@/components/ui/link";
import { selectedWorks, site } from "@/content/site";
import { formatSlideId, useCarouselStore } from "@/stores/carousel-store";
import { useGlobalStore } from "@/stores/global-store";

const HIDDEN = { opacity: 0 };
const REVEAL = {
  keyframes: [{ opacity: 0.4 }, { opacity: 0.6 }, { opacity: 0.8 }, { opacity: 1 }],
  stagger: 0.02,
  ease: "power1.inOut",
  duration: 0.2,
};

function splitChars(el: HTMLElement) {
  return new SplitText(el, { type: "chars,words,lines", linesClass: "overflow-hidden", tag: "div" });
}

/** Chars fade in while the cover crosses the viewport centre, then fade out. */
function crossfadeWithCover(chars: Element[], cover: HTMLElement) {
  gsap.set(chars, HIDDEN);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: cover, start: "top 50%", end: "bottom 50%", scrub: true },
  });
  tl.fromTo(chars, HIDDEN, { ...REVEAL, duration: 0.2, immediateRender: false }, 0);
  tl.to({}, { duration: 0.6 });
  tl.fromTo(chars, REVEAL, { ...HIDDEN, duration: 0.2, immediateRender: false });
  return tl;
}

export default function SelectedWorksSection() {
  const copy = site.selectedWorks;
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const pathname = usePathname();
  const router = useRouter();
  const coverRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nameRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const stickyLinkRef = useRef<HTMLAnchorElement | null>(null);
  const useDomImages = useMediaQuery(maxWidth(bp.tabletLandscape));
  const isMobile = useMediaQuery(maxWidth(bp.mobileLandscape));

  /** Clicking a cover opens that project in the /work carousel. */
  const openWork = useCallback(
    async (index: number, e: React.MouseEvent) => {
      useCarouselStore.getState().requestSlideSelection(formatSlideId(index));
      const go = await handleParticleTransitionClick(e, "/work", pathname, () => router.push("/work"));
      go?.();
    },
    [pathname, router],
  );

  // Sticky name + "See live" crossfade per cover (tablet and up); the sticky
  // link follows whichever cover is in the middle of the viewport.
  useEffect(() => {
    if (!fontsLoaded || isMobile) return;
    const covers = coverRefs.current.filter((c): c is HTMLDivElement => c !== null);
    const names = nameRefs.current.filter((n): n is HTMLParagraphElement => n !== null);
    const link = stickyLinkRef.current;
    if (!covers.length || covers.length !== selectedWorks.length || names.length !== selectedWorks.length || !link) return;
    const splits: SplitText[] = [];
    const timelines: gsap.core.Timeline[] = [];
    const triggers: ScrollTrigger[] = [];
    const existingChars = Array.from(link.querySelectorAll<HTMLElement>("[data-vp-char]"));
    let linkChars: Element[];
    if (existingChars.length > 0) {
      linkChars = existingChars;
    } else {
      const s = splitChars(link);
      splits.push(s);
      linkChars = s.chars;
    }
    const setLinkTarget = (i: number) => {
      const target = selectedWorks[i].link;
      link.setAttribute("href", target ?? "#contact");
      link.dataset.workIndex = String(i);
    };
    gsap.set(linkChars, HIDDEN);
    setLinkTarget(0);
    covers.forEach((cover, i) => {
      const s = splitChars(names[i]);
      splits.push(s);
      timelines.push(crossfadeWithCover(s.chars, cover));
      timelines.push(crossfadeWithCover(linkChars, cover));
      triggers.push(
        ScrollTrigger.create({
          trigger: cover,
          start: "top 50%",
          end: "bottom 50%",
          onUpdate: (self) => {
            if (self.progress > 0 && self.progress < 1) setLinkTarget(i);
          },
        }),
      );
    });
    ScrollTrigger.refresh();
    return () => {
      timelines.forEach((tl) => {
        tl.scrollTrigger?.kill();
        tl.kill();
      });
      triggers.forEach((t) => t.kill());
      splits.forEach((s) => s.revert());
      if (existingChars.length > 0) gsap.set(existingChars, { clearProps: "opacity" });
    };
  }, [fontsLoaded, isMobile]);

  // Parallax for the DOM image fallback (below 1024px).
  useEffect(() => {
    if (!useDomImages) return;
    const images = imageRefs.current.filter((i): i is HTMLImageElement => i !== null);
    if (!images.length) return;
    const tweens = images.map((img) =>
      gsap.fromTo(
        img,
        { yPercent: -14, scale: 1.2 },
        {
          yPercent: 14,
          scale: 1.2,
          ease: "none",
          scrollTrigger: { trigger: img.parentElement ?? img, start: "top bottom", end: "bottom top", scrub: true },
        },
      ),
    );
    ScrollTrigger.refresh();
    return () => {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, [useDomImages]);

  return (
    <section
      id="work"
      data-geometry="diamond"
      data-dissolve="in"
      data-start="bottom 100%"
      data-end="bottom -50%"
      className="container px-8 tablet-portrait:safearea-lg pt-c-320 grid grid-cols-1 tablet-portrait:grid-cols-[1fr_60vw_1fr] desktop-sm:grid-cols-[1fr_600px_1fr] desktop:grid-cols-[1fr_800px_1fr] gap-c-32"
    >
      <div className="hidden tablet-portrait:block sticky top-1/2 h-fit">
        <div className="grid *:col-start-1 *:row-start-1 overflow-hidden">
          {selectedWorks.map((work, i) => (
            <p
              key={work.id}
              ref={(el) => {
                nameRefs.current[i] = el;
              }}
              className="heading-5 leading-[1.4em] font-instrument-serif s-split-lines"
              aria-hidden
            >
              {work.name}
            </p>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-12 desktop-sm:gap-20 desktop:gap-c-120">
        <div className="flex flex-col gap-c-16">
          <h2 className="js-s-lines text-center body-md uppercase">{copy.title}</h2>
          <p className="js-s-print-opacity text-center heading-2 leading-[1.1em] font-instrument-serif">{copy.description}</p>
        </div>
        <div className="flex flex-col gap-12 tablet-portrait:gap-c-32">
          {selectedWorks.map((work, i) => (
            <div key={work.id} className="flex flex-col gap-2 tablet-portrait:block">
              <div
                ref={(el) => {
                  coverRefs.current[i] = el;
                }}
                className="aspect-800/500 w-full relative"
              >
                <button
                  type="button"
                  data-event="hover"
                  aria-label={work.name}
                  className="absolute inset-0 z-10 cursor-pointer border-0 bg-transparent p-0"
                  onClick={(e) => void openWork(i, e)}
                />
                {useDomImages ? (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Image
                      ref={(el) => {
                        imageRefs.current[i] = el;
                      }}
                      src={work.image}
                      alt={work.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 60vw"
                      className="w-full h-full object-cover scale-[1.2]"
                    />
                  </div>
                ) : (
                  <div data-type="image" data-src={work.image} className="absolute inset-0 w-full h-full pointer-events-none" />
                )}
              </div>
              <div className="flex tablet-portrait:hidden items-center justify-between">
                <p className="js-s-lines heading-5 leading-[1.4em] font-instrument-serif">{work.name}</p>
                {work.link ? (
                  <AppLink isExternalLink href={work.link} className="js-s-lines font-instrument-serif body-lg underline">
                    {copy.seeLive}
                  </AppLink>
                ) : (
                  <AppLink isTextLink className="js-s-lines font-instrument-serif body-lg underline" onClick={() => setShowContactForm(true)}>
                    {copy.comingSoon}
                  </AppLink>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-start gap-c-24">
          <p className="js-s-lines body-md max-w-100">{copy.copy}</p>
          <AppLink href="/work">
            <Button>{copy.cta}</Button>
          </AppLink>
        </div>
      </div>

      <AppLink
        ref={stickyLinkRef}
        isExternalLink
        hasProximityHover
        href={selectedWorks[0].link ?? "#contact"}
        onClick={(e) => {
          // Projects without a live URL open the contact drawer instead.
          if (e.currentTarget.getAttribute("href")?.startsWith("#")) {
            e.preventDefault();
            setShowContactForm(true);
          }
        }}
        className="hidden tablet-portrait:block sticky w-fit top-1/2 h-fit ml-auto font-instrument-serif body-lg underline cursor-pointer overflow-hidden s-split-lines"
      >
        {copy.seeLive}
      </AppLink>
    </section>
  );
}
