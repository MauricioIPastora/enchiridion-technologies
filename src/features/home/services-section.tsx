"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { bp, maxWidth, useMediaQuery } from "@/lib/breakpoints";
import { site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

const TITLE_HIDDEN = { yPercent: 320, scale: 1, rotate: 10 };
const TITLE_SHOW = { yPercent: 0, scale: 1, rotate: 0, stagger: 0.07, duration: 0.9, ease: "power3.out" };
const TITLE_EXIT = { yPercent: 320, scale: 1, rotate: 10, stagger: 0.07, duration: 0.9, ease: "power3.in" };
const LINES_HIDDEN = { yPercent: 320, scale: 1, rotate: 10 };
const LINES_SHOW = { yPercent: 0, scale: 1, rotate: 0, stagger: 0.07, duration: 0.9, ease: "power3.out" };
const LINES_VISIBLE = { yPercent: 0, rotate: 0 };
const LINES_EXIT = { yPercent: 320, rotate: 10, duration: 0.9, stagger: 0.07, ease: "power3.in" };
const CHARS_HIDDEN = { opacity: 0 };
const CHARS_SHOW = {
  keyframes: [{ opacity: 0.25 }, { opacity: 0.5 }, { opacity: 0.75 }, { opacity: 1 }],
  stagger: 0.02,
  ease: "power1.inOut",
  duration: 0.7,
};
const CHARS_VISIBLE = { opacity: 1 };
const CHARS_EXIT = {
  keyframes: [{ opacity: 0.75 }, { opacity: 0.5 }, { opacity: 0.25 }, { opacity: 0 }],
  stagger: { each: 0.02, from: "end" as const },
  ease: "power1.inOut",
  duration: 0.7,
};
const CARD_LINES_EXIT = { yPercent: 320, scale: 1, rotate: 10, stagger: 0, duration: 0.4, ease: "power3.in" };
const CARDS_HIDDEN = { yPercent: 100 };
const CARDS_SHOW = { yPercent: 0, stagger: 0.1, duration: 0.4, ease: "power3.out" };
const CARDS_EXIT = { yPercent: 100, stagger: 0.1, duration: 0.4, ease: "power3.in" };

function splitLines(el: Element) {
  return new SplitText(el, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
}

interface GroupParts {
  lineSplits: SplitText[];
  serviceTitleLines: Element[];
  contentLines: Element[];
  cardContentLines: Element[][];
  cards: HTMLElement[];
}

function collectGroup(group: HTMLElement): GroupParts {
  const lineSplits: SplitText[] = [];
  const serviceTitleLines: Element[] = [];
  const cardContentLines: Element[][] = [];
  const title = group.querySelector("[data-service-title]");
  if (title) {
    const s = splitLines(title);
    lineSplits.push(s);
    serviceTitleLines.push(...s.lines);
    // Rotate hidden lines about their left edge so the full-width line never
    // swings back up into the visible part of its mask.
    gsap.set(s.lines, { transformOrigin: "left center" });
  }
  const cards = Array.from(group.querySelectorAll<HTMLElement>("[data-service-card]"));
  cards.forEach((card) => {
    const lines: Element[] = [];
    card.querySelectorAll("[data-s-lines]").forEach((el) => {
      const s = splitLines(el);
      lineSplits.push(s);
      lines.push(...s.lines);
    });
    cardContentLines.push(lines);
  });
  return { lineSplits, serviceTitleLines, contentLines: cardContentLines.flat(), cardContentLines, cards };
}

function hideGroup(g: GroupParts) {
  gsap.set(g.serviceTitleLines, TITLE_HIDDEN);
  gsap.set(g.contentLines, LINES_HIDDEN);
  gsap.set(g.cards, CARDS_HIDDEN);
}

function enterCardLines(
  tl: gsap.core.Timeline,
  g: GroupParts,
  label: string,
  offset = 0,
  stagger = CARDS_SHOW.stagger,
  vars: gsap.TweenVars = LINES_SHOW,
) {
  g.cardContentLines.forEach((lines, i) => {
    if (!lines.length) return;
    tl.fromTo(lines, LINES_HIDDEN, { ...vars, immediateRender: false }, `${label}+=${offset + i * stagger}`);
  });
}

function exitCardLines(
  tl: gsap.core.Timeline,
  g: GroupParts,
  label: string,
  offset = 0,
  stagger = CARDS_EXIT.stagger,
  vars: gsap.TweenVars = CARD_LINES_EXIT,
) {
  g.cardContentLines.forEach((lines, i) => {
    if (!lines.length) return;
    tl.fromTo(lines, LINES_SHOW, { ...vars, immediateRender: false }, `${label}+=${offset + i * stagger}`);
  });
}

function swapGroups(tl: gsap.core.Timeline, from: GroupParts, to: GroupParts, index: number) {
  const label = `serviceExit-${index}`;
  tl.addLabel(label);
  tl.fromTo(from.serviceTitleLines, TITLE_SHOW, { ...TITLE_EXIT, immediateRender: false }, label);
  const cardsExit = { ...CARDS_EXIT, duration: 0.75, stagger: 0.18 };
  const cardsEnter = { ...CARDS_SHOW, duration: 0.75, stagger: 0.18 };
  const linesExit = { ...CARD_LINES_EXIT, duration: 0.75 };
  const linesEnter = { ...LINES_SHOW, duration: 0.75 };
  tl.fromTo(from.cards, { yPercent: 0, opacity: 1 }, { ...cardsExit, immediateRender: false }, label);
  exitCardLines(tl, from, label, 0, 0.18, linesExit);
  const titleExitEnd = TITLE_EXIT.duration + Math.max(0, from.serviceTitleLines.length - 1) * TITLE_EXIT.stagger - 0.1;
  const cardsExitEnd = 0.75 + Math.max(0, from.cards.length - 1) * 0.18 - 0.05;
  tl.fromTo(to.serviceTitleLines, TITLE_HIDDEN, { ...TITLE_SHOW, immediateRender: false }, `${label}+=${titleExitEnd}`);
  tl.fromTo(to.cards, CARDS_HIDDEN, { ...cardsEnter, immediateRender: false }, `${label}+=${cardsExitEnd}`);
  enterCardLines(tl, to, label, cardsExitEnd, 0.18, linesEnter);
}

/**
 * Sticky "From Ideation to Launch" section: the three service groups swap
 * in and out as the user scrolls through 600vh (tablet and up).
 */
export default function ServicesSection() {
  const copy = site.services;
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const isMobile = useMediaQuery(maxWidth(bp.mobileLandscape));
  const sectionRef = useRef<HTMLElement>(null);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!fontsLoaded || isMobile) return;
    const section = sectionRef.current;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const groups = groupRefs.current.filter((g): g is HTMLDivElement => g !== null);
    if (!section || !title || !description || !groups.length) return;

    const parts = groups.map(collectGroup);
    const titleSplit = new SplitText(title, { type: "chars,words,lines", tag: "span", linesClass: "overflow-hidden" });
    const descSplit = splitLines(description);
    const reset = () => {
      parts.forEach(hideGroup);
      gsap.set(titleSplit.chars, CHARS_HIDDEN);
      gsap.set(descSplit.lines, LINES_HIDDEN);
    };
    reset();

    const tl = gsap.timeline({
      defaults: { immediateRender: false },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onRefresh: (self) => {
          if (self.progress <= 0) reset();
        },
      },
    });
    const [first] = parts;
    tl.addLabel("firstCardsEnter");
    tl.fromTo(first.cards, CARDS_HIDDEN, CARDS_SHOW, "firstCardsEnter");
    enterCardLines(tl, first, "firstCardsEnter");
    tl.fromTo(first.serviceTitleLines, TITLE_HIDDEN, TITLE_SHOW, "-=0.4");
    tl.fromTo(titleSplit.chars, CHARS_HIDDEN, CHARS_SHOW, 0.1);
    tl.fromTo(descSplit.lines, LINES_HIDDEN, LINES_SHOW, "-=1.3");
    tl.to({}, { duration: 1 });
    for (let i = 1; i < parts.length; i++) {
      swapGroups(tl, parts[i - 1], parts[i], i);
      tl.to({}, { duration: 1 });
    }
    const last = parts[parts.length - 1];
    const exitLabel = `serviceExit-${parts.length - 1}`;
    tl.addLabel(exitLabel);
    tl.fromTo(last.serviceTitleLines, TITLE_SHOW, { ...TITLE_EXIT, immediateRender: false }, exitLabel);
    tl.fromTo(
      last.cards,
      { yPercent: 0, opacity: 1 },
      { ...CARDS_EXIT, duration: 0.75, stagger: 0.18, immediateRender: false },
      exitLabel,
    );
    exitCardLines(tl, last, exitLabel, 0, 0.18, { ...CARD_LINES_EXIT, duration: 0.75 });
    tl.fromTo(descSplit.lines, LINES_VISIBLE, { ...LINES_EXIT, stagger: { each: 0.07, from: "end" } });
    tl.fromTo(titleSplit.chars, CHARS_VISIBLE, CHARS_EXIT, "<");
    ScrollTrigger.refresh();

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      parts.forEach((p) => p.lineSplits.forEach((s) => s.revert()));
      titleSplit.revert();
      descSplit.revert();
    };
  }, [fontsLoaded, isMobile]);

  return (
    <section id="services" ref={sectionRef} className="relative z-10 h-[600vh] hidden tablet-portrait:block">
      <div className="mobile-landscape:sticky top-0 mobile-landscape:h-screen pt-20 tablet-portrait:pt-30 desktop-sm:pt-20 desktop:pt-c-160 flex flex-col justify-between max-mobile-landscape:gap-12">
        <div className="max-tablet-portrait:px-8 tablet-portrait:w-1/2 tablet-portrait:ml-auto desktop-sm:items-center">
          <div className="flex flex-col gap-c-24 w-fit! mx-auto">
            <h2
              ref={titleRef}
              className="overflow-hidden heading-2 font-instrument-serif w-full max-w-110 desktop-sm:max-w-130 desktop-lg:max-w-160 indent-20"
            >
              {copy.title}
            </h2>
            <p ref={descriptionRef} className="body-sm mobile-landscape:max-w-105 s-split-lines ml-20">
              {copy.description}
            </p>
          </div>
        </div>
        <div className="relative max-mobile-landscape:flex max-mobile-landscape:flex-col max-mobile-landscape:gap-8">
          {copy.groups.map((group, gi) => (
            <div
              key={group.title}
              ref={(el) => {
                groupRefs.current[gi] = el;
              }}
              className={clsx("max-mobile-landscape:flex max-mobile-landscape:flex-col max-mobile-landscape:gap-2", {
                "mobile-landscape:absolute inset-x-0 top-0": gi > 0,
              })}
            >
              <p
                data-service-title
                className="heading-3 mobile-landscape:heading-4 font-instrument-serif tablet-portrait:pb-3 desktop:pb-c-24 px-c-32 s-split-lines"
              >
                {group.title}
              </p>
              <div className="grid mobile-landscape:grid-cols-3 overflow-hidden max-mobile-landscape:gap-2 max-mobile-landscape:px-4">
                {group.services.map((service, si) => (
                  <div
                    key={service.title}
                    data-service-card
                    className="h-full relative p-5 desktop-sm:p-5 desktop:p-c-32 tablet-portrait:aspect-400/500 desktop-sm:aspect-480/260 flex flex-col gap-2 desktop:gap-c-16 border-t border-white/1 bg-brand-100/10 backdrop-blur-xl"
                  >
                    <p data-s-lines className="heading-6 uppercase font-black s-split-lines">
                      {service.title}
                    </p>
                    <p data-s-lines className="body-sm font-semibold s-split-lines">
                      {service.highlight}
                    </p>
                    <p data-s-lines className="body-sm s-split-lines">
                      {service.description}
                    </p>
                    {si < group.services.length - 1 && <div className="absolute top-0 right-0 w-px h-full bg-white/10" />}
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
