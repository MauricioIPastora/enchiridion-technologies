"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { gsap, SplitText } from "@/lib/gsap";
import AppLink from "@/components/ui/link";
import { EMAIL, MAILTO, site, works, type Work } from "@/content/site";
import { parseSlideIndex, useCarouselStore } from "@/stores/carousel-store";
import { useGlobalStore } from "@/stores/global-store";

const WorkCarousel = dynamic(() => import("@/features/work/work-carousel"), { ssr: false });

const LINES_HIDDEN = { yPercent: 320, scale: 1, rotate: 10 };
const LINES_ENTER = { yPercent: 0, scale: 1, rotate: 0, stagger: 0.07, duration: 0.4, ease: "power3.out" };
const LINES_EXIT = { yPercent: 320, scale: 1, rotate: 10, duration: 0.4, ease: "power3.in" };
const CHARS_HIDDEN = { opacity: 0 };
const CHARS_ENTER = {
  keyframes: [{ opacity: 0.4 }, { opacity: 0.6 }, { opacity: 0.8 }, { opacity: 1 }],
  stagger: 0.02,
  ease: "power1.inOut",
  duration: 0.2,
};
const CHARS_EXIT = {
  keyframes: [{ opacity: 0.8 }, { opacity: 0.6 }, { opacity: 0.4 }, { opacity: 0 }],
  ease: "power1.inOut",
  duration: 0.2,
};

/* ------------------------------------------------------------------ */
/* Rolling slide counter                                               */
/* ------------------------------------------------------------------ */

function pad(n: number) {
  return n <= 9 ? `0${n}` : String(n);
}

function SlideCounter({ index, total, className }: { index: number; total: number; className?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const shown = useRef(index);
  const ready = useRef(false);
  const tween = useRef<gsap.core.Tween | null>(null);
  // [last, 1..n, first] so wrapping in either direction can animate seamlessly.
  const items = useMemo(() => {
    if (total <= 0) return [] as string[];
    const all = Array.from({ length: total }, (_, i) => pad(i + 1));
    return [all[total - 1], ...all, all[0]];
  }, [total]);

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const rowHeight = () => {
      const w = wrapper.current;
      if (!w) return 0;
      const h = w.getBoundingClientRect().height;
      if (h > 0) return h;
      return (el.firstElementChild as HTMLElement | null)?.getBoundingClientRect().height ?? 0;
    };
    const jumpTo = (row: number) => {
      const h = rowHeight();
      if (h > 0) gsap.set(el, { y: -row * h });
    };
    if (!ready.current) {
      if (rowHeight() <= 0) return;
      jumpTo(index + 1);
      shown.current = index;
      ready.current = true;
      return;
    }
    const from = shown.current;
    if (from === index) return;
    const forward = total <= 1 || (index - from + total) % total <= (from - index + total) % total;
    let targetRow: number;
    if (forward) targetRow = index === (from + 1) % total ? from + 2 : total + 1;
    else targetRow = index === (from - 1 + total) % total ? from : 0;
    const h = rowHeight();
    if (h <= 0) return;
    tween.current?.kill();
    jumpTo(from + 1);
    tween.current = gsap.to(el, {
      y: -targetRow * h,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        jumpTo(index + 1);
        tween.current = null;
      },
    });
    shown.current = index;
    return () => {
      tween.current?.kill();
      tween.current = null;
    };
  }, [index, total]);

  if (total <= 0) return null;
  return (
    <div ref={wrapper} className={clsx("inline-block h-[1em] w-10 overflow-hidden leading-none", className)}>
      <div ref={track} className="will-change-transform">
        {items.map((label, i) => (
          <span key={`${label}-${i}`} className="block h-[1em] w-full text-right tabular-nums leading-none">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Counter() {
  const pending = useCarouselStore((s) => s.pendingSlideId);
  const current = useCarouselStore((s) => s.currentSlideId);
  const centered = useCarouselStore((s) => s.centeredSlideId);
  const active = pending !== undefined ? pending : current;
  const index = parseSlideIndex(active) ?? parseSlideIndex(centered) ?? 0;
  return (
    <div className="flex items-baseline">
      <SlideCounter index={index} total={works.length} />
      <span>/{pad(works.length)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Details panel                                                       */
/* ------------------------------------------------------------------ */

function ArrowIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3643 5.65723L12.6562 6.36328L7.70605 11.3135L6.99902 10.6064L11.4551 6.15039H0V5.15039H11.4434L7 0.707031L7.70703 0L13.3643 5.65723Z"
        fill="white"
      />
    </svg>
  );
}

function SeeLiveLink({ work, className }: { work: Work; className?: string }) {
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  if (!work.link) {
    return (
      <AppLink isTextLink className={className} onClick={() => setShowContactForm(true)}>
        {site.selectedWorks.comingSoon}
      </AppLink>
    );
  }
  return (
    <AppLink isExternalLink className={className} href={work.link}>
      <span data-work-line>{site.selectedWorks.seeLive}</span>
      <ArrowIcon />
    </AppLink>
  );
}

interface Splits {
  nameSplit: SplitText;
  lineSplits: SplitText[];
  lineElements: Element[];
  nameChars: Element[];
}

function buildSplits(container: HTMLElement, name: HTMLElement): Splits {
  const nameSplit = new SplitText(name, { type: "chars,words,lines", tag: "span" });
  const lineSplits: SplitText[] = [];
  const lineElements: Element[] = [];
  container.querySelectorAll("[data-work-line]").forEach((el) => {
    const s = new SplitText(el, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
    lineSplits.push(s);
    lineElements.push(...s.lines);
  });
  return { nameSplit, lineSplits, lineElements, nameChars: nameSplit.chars };
}

function revertSplits(s: Splits | null) {
  if (!s) return;
  s.lineSplits.forEach((x) => x.revert());
  s.nameSplit.revert();
}

function setHidden(s: Splits) {
  gsap.set(s.lineElements, LINES_HIDDEN);
  gsap.set(s.nameChars, CHARS_HIDDEN);
}

function setVisible(s: Splits) {
  gsap.set(s.lineElements, { yPercent: 0, scale: 1, rotate: 0 });
  gsap.set(s.nameChars, { opacity: 1 });
}

/**
 * Animates the details panel out / in whenever the carousel selection changes.
 */
function useWorkDetailsTransition(
  containerRef: React.RefObject<HTMLDivElement | null>,
  nameRef: React.RefObject<HTMLHeadingElement | null>,
  targetIndex: number | null,
  hasPending: boolean,
  setCurrent: (index: number | null) => void,
  commit: () => void,
  complete: () => void,
) {
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const splits = useRef<Splits | null>(null);
  const committed = useRef<number | null>(null);
  const running = useRef(false);
  const generation = useRef(0);
  const progressTween = useRef<gsap.core.Tween | null>(null);
  const cancelCurrent = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      generation.current += 1;
      running.current = false;
      cancelCurrent.current?.();
      cancelCurrent.current = null;
      progressTween.current?.kill();
      progressTween.current = null;
      revertSplits(splits.current);
      splits.current = null;
      if (containerRef.current) gsap.set(containerRef.current, { clearProps: "visibility" });
    },
    [containerRef],
  );

  useEffect(() => {
    if (!fontsLoaded || !hasPending) return;
    const container = containerRef.current;
    const name = nameRef.current;
    if (!container || !name) return;
    if (targetIndex === committed.current && !running.current) {
      commit();
      complete();
      return;
    }
    const gen = ++generation.current;
    const isStale = () => {
      if (gen !== generation.current) {
        running.current = false;
        return true;
      }
      return false;
    };
    const play = (tl: gsap.core.Timeline, onDone: () => void) =>
      new Promise<void>((resolve) => {
        tl.progress(0);
        const finish = () => {
          tl.kill();
          resolve();
          onDone();
        };
        cancelCurrent.current = finish;
        progressTween.current = gsap.to(tl, {
          progress: 1,
          duration: tl.duration(),
          ease: "none",
          overwrite: true,
          onComplete: finish,
        });
      });
    const exitTimeline = (s: Splits) => {
      const tl = gsap.timeline({ paused: true, defaults: { immediateRender: false } });
      tl.fromTo(s.lineElements, { yPercent: 0, scale: 1, rotate: 0 }, LINES_EXIT, 0);
      tl.fromTo(s.nameChars, { opacity: 1 }, CHARS_EXIT, 0);
      return tl;
    };
    const enterTimeline = (s: Splits) => {
      const tl = gsap.timeline({ paused: true, defaults: { immediateRender: false } });
      tl.fromTo(s.nameChars, CHARS_HIDDEN, CHARS_ENTER, 0);
      tl.fromTo(s.lineElements, LINES_HIDDEN, LINES_ENTER, 0);
      return tl;
    };
    const swapContent = async (index: number | null) => {
      gsap.set(container, { visibility: "hidden" });
      revertSplits(splits.current);
      splits.current = null;
      setCurrent(index);
      commit();
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    };

    (async () => {
      cancelCurrent.current?.();
      cancelCurrent.current = null;
      progressTween.current?.kill();
      progressTween.current = null;
      running.current = true;
      if (committed.current !== null) {
        splits.current ??= buildSplits(container, name);
        setVisible(splits.current);
        await play(exitTimeline(splits.current), () => {});
        if (isStale()) return;
      }
      if (targetIndex === null) {
        await swapContent(null);
        if (isStale()) return;
        committed.current = null;
        gsap.set(container, { clearProps: "visibility" });
        complete();
        running.current = false;
        return;
      }
      await swapContent(targetIndex);
      if (isStale()) return;
      const s = buildSplits(container, name);
      splits.current = s;
      setHidden(s);
      gsap.set(container, { visibility: "visible" });
      await play(enterTimeline(s), () => setVisible(s));
      if (isStale()) return;
      committed.current = targetIndex;
      complete();
      running.current = false;
    })();
  }, [fontsLoaded, hasPending, targetIndex, containerRef, nameRef, setCurrent, commit, complete]);
}

function WorkDetails() {
  const pending = useCarouselStore((s) => s.pendingSlideId);
  const commitCurrentSlideId = useCarouselStore((s) => s.commitCurrentSlideId);
  const completeSlideTransition = useCarouselStore((s) => s.completeSlideTransition);
  const containerRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const hasPending = pending !== undefined;
  const targetIndex = hasPending ? parseSlideIndex(pending ?? null) : null;
  const [current, setCurrentWork] = useState<Work | null>(null);

  useWorkDetailsTransition(
    containerRef,
    nameRef,
    targetIndex,
    hasPending,
    useCallback((i: number | null) => setCurrentWork(i !== null ? works[i] : null), []),
    useCallback(() => commitCurrentSlideId(), [commitCurrentSlideId]),
    useCallback(() => completeSlideTransition(), [completeSlideTransition]),
  );

  const liveLink = (className: string) =>
    current ? (
      <SeeLiveLink work={current} className={className} />
    ) : (
      <span className={clsx(className, "opacity-0 pointer-events-none")}>{site.selectedWorks.seeLive}</span>
    );

  return (
    <div
      ref={containerRef}
      className="h-1/3 tablet-landscape:h-1/5 flex flex-col justify-end items-start tablet-portrait:grid tablet-portrait:grid-cols-[2fr_4fr] tablet-landscape:grid-cols-[2fr_4fr_1fr] gap-c-16 tablet-portrait:items-end"
    >
      <div className="w-full flex flex-row tablet-portrait:flex-col gap-2 items-end justify-between tablet-portrait:items-start">
        <div>
          <h2 ref={nameRef} className="heading-2 font-instrument-serif">
            {current?.name ?? " "}
          </h2>
          <p className="body-xs" data-work-line>
            {current ? `Role: ${current.role}` : " "}
          </p>
        </div>
        <div className="max-tablet-landscape:block tablet-landscape:hidden">{liveLink("italic body-lg flex items-center gap-2")}</div>
      </div>
      {current ? (
        <div className="grid grid-cols-1 mobile-landscape:grid-cols-[1fr_1.5fr] tablet-portrait:grid-cols-2 gap-c-16">
          <div className="flex flex-col gap-1">
            <p className="body-xl font-instrument-serif" data-work-line>
              Services
            </p>
            <ul className="body-xs">
              {current.services.map((s) => (
                <li key={s} data-work-line>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-1 tablet-portrait:max-w-60">
            <p className="body-xl font-instrument-serif" data-work-line>
              Tools and Technologies
            </p>
            <p className="body-xs" data-work-line>
              {current.tools}
            </p>
          </div>
        </div>
      ) : null}
      <div className="hidden tablet-landscape:flex items-end justify-end">{liveLink("italic body-lg flex items-center gap-2")}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function WorkPage() {
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const isLoading = useGlobalStore((s) => s.isLoading);
  const topRef = useRef<HTMLDivElement>(null);

  // Slide the header lines in once fonts are ready and the preloader is gone.
  useEffect(() => {
    if (!fontsLoaded || isLoading) return;
    const root = topRef.current;
    if (!root) return;
    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      const lines: Element[] = [];
      root.querySelectorAll("[data-works-line]").forEach((el) => {
        const s = new SplitText(el, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
        splits.push(s);
        gsap.set(s.lines, { yPercent: 320, rotate: 10 });
        lines.push(...s.lines);
      });
      const blocks = Array.from(root.querySelectorAll("[data-works-block]"));
      gsap.set(blocks, { yPercent: 320 });
      gsap.set(root, { opacity: 1 });
      gsap.to([...lines, ...blocks], { yPercent: 0, rotate: 0, stagger: 0.07, duration: 0.4, ease: "power3.out", delay: 0.2 });
    }, root);
    return () => {
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [fontsLoaded, isLoading]);

  return (
    <main data-page-content className="relative w-screen h-screen overflow-hidden">
      <WorkCarousel />
      <div className="container fixed inset-0 z-1000 p-c-32 mobile-landscape:p-c-48 tablet-portrait:p-c-64 w-full h-full flex flex-col justify-between pointer-events-none">
        <div
          ref={topRef}
          className="h-1/4 tablet-portrait:h-fit tablet-landscape:h-1/6 flex items-end justify-between opacity-0 pt-c-16 tablet-portrait:pt-c-48 tablet-landscape:pt-0 pointer-events-auto"
        >
          <div>
            <p data-works-line>{site.about.cta}</p>
            <AppLink isExternalLink hasProximityHover href={MAILTO} data-works-line>
              {EMAIL}
            </AppLink>
          </div>
          <div className="overflow-hidden">
            <div data-works-block>
              <Counter />
            </div>
          </div>
        </div>
        <div className="pointer-events-auto">
          <WorkDetails />
        </div>
      </div>
    </main>
  );
}
