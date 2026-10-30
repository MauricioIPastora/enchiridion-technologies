"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import Button from "@/components/ui/button";
import { site } from "@/content/site";
import { useGlobalStore } from "@/stores/global-store";

const CTA_PENDING = "process-cta-pending";

const SPARK_PATH =
  "M28.2842 -0.000976562C28.2867 0.0402974 29.1893 15.0456 35.3555 21.2119C41.5178 27.3743 56.5082 28.2796 56.5684 28.2832C56.5082 28.2868 41.5178 29.1922 35.3555 35.3545C29.1893 41.5208 28.2867 56.5261 28.2842 56.5674C28.2816 56.5236 27.3786 41.5202 21.2129 35.3545C15.0381 29.1798 0 28.2832 0 28.2832C0 28.2832 15.0381 27.3866 21.2129 21.2119C27.3786 15.0462 28.2816 0.0428417 28.2842 -0.000976562Z";

export function SparkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="57" height="57" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d={SPARK_PATH} fill="white" />
    </svg>
  );
}

function prepareCtaOutline(button: HTMLElement, svg: SVGSVGElement, rect: SVGRectElement) {
  const { width, height } = button.getBoundingClientRect();
  const r = height / 2;
  const perimeter = 2 * (width - 2 * r) + 2 * Math.PI * r;
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  rect.setAttribute("x", "0.5");
  rect.setAttribute("y", "0.5");
  rect.setAttribute("width", String(width - 1));
  rect.setAttribute("height", String(height - 1));
  rect.setAttribute("rx", String(r - 0.5));
  return perimeter;
}

/**
 * Desktop process section: a sticky headline + CTA on the left, a growing
 * vertical line with a glowing spark, and the four steps printing in on the
 * right as the user scrolls.
 */
export default function ProcessSection() {
  const copy = site.process;
  const fontsLoaded = useGlobalStore((s) => s.fontsLoaded);
  const setShowContactForm = useGlobalStore((s) => s.setShowContactForm);
  const containerRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!fontsLoaded) return;
    const title = titleRef.current;
    const description = descriptionRef.current;
    const line = lineRef.current;
    const spark = sparkRef.current;
    const container = containerRef.current;
    const button = buttonRef.current;
    // The desktop layout is display:none on phones; nothing to animate there.
    if (!title || !description || !line || !spark || !container || container.offsetParent === null) return;

    const ctx = gsap.context(() => {
      const titleSplit = new SplitText(title, { type: "chars,words,lines", tag: "span" });
      const descSplit = new SplitText(description, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
      gsap.set(titleSplit.chars, { opacity: 0 });
      gsap.set(descSplit.lines, { yPercent: 320, rotate: 10 });
      gsap.set(spark, { scale: 0 });
      gsap.set(line, { scaleY: 0, transformOrigin: "top" });

      const tl = gsap.timeline({
        defaults: { immediateRender: false },
        scrollTrigger: { trigger: container, start: "top center", end: "bottom center", scrub: true },
      });
      tl.fromTo(line, { scaleY: 0, transformOrigin: "top" }, { scaleY: 1, transformOrigin: "bottom", duration: 8, ease: "none" }, 0);
      tl.fromTo(titleSplit.chars, { opacity: 0 }, { opacity: 1, stagger: 0.2, duration: 10 });
      tl.fromTo(descSplit.lines, { yPercent: 320, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.7, duration: 3 }, "<+=4");

      let ctaSplit: SplitText | null = null;
      let rect: SVGRectElement | null = null;
      let perimeter = 0;
      if (button) {
        const svg = button.querySelector("svg");
        rect = button.querySelector("rect");
        const label = button.querySelector("span");
        if (svg && rect && label && button.getBoundingClientRect().width > 0) {
          perimeter = prepareCtaOutline(button, svg, rect);
          ctaSplit = new SplitText(label, { type: "lines", mask: "lines", linesClass: "overflow-hidden", tag: "div" });
          gsap.set(rect, { strokeDasharray: perimeter, strokeDashoffset: perimeter });
          gsap.set(button, { backgroundColor: "rgba(255,255,255,0)" });
          if (ctaSplit.lines.length) gsap.set(ctaSplit.lines, { yPercent: 320, rotate: 10 });
          button.classList.remove(CTA_PENDING);
          tl.fromTo(rect, { strokeDashoffset: perimeter }, { strokeDashoffset: 0, duration: 4 }, "<+=0.3");
          tl.fromTo(button, { backgroundColor: "rgba(255,255,255,0)" }, { backgroundColor: "rgba(255,255,255,0.04)", duration: 4 }, "<+=0.3");
          tl.fromTo(ctaSplit.lines, { yPercent: 320, rotate: 10 }, { yPercent: 0, rotate: 0, duration: 4 }, "<+=0.3");
        }
      }
      tl.fromTo(spark, { scale: 0 }, { scale: 1, duration: 1 }, "<");
      tl.to({}, { duration: 16 });
      tl.fromTo(line, { transformOrigin: "bottom" }, { transformOrigin: "top", duration: 1.5 }, "<");
      if (button && ctaSplit && rect) {
        tl.fromTo(
          ctaSplit.lines,
          { yPercent: 0, rotate: 0 },
          { yPercent: 320, rotate: 10, duration: 2, stagger: { each: 0.07, from: "end" } },
          "+=0.35",
        );
        tl.fromTo(rect, { strokeDashoffset: 0 }, { strokeDashoffset: perimeter, duration: 2 }, "<+=0.1");
        tl.fromTo(button, { backgroundColor: "rgba(255,255,255,0.04)" }, { backgroundColor: "rgba(255,255,255,0)", duration: 2 }, "<");
      }
      tl.to(descSplit.lines, { yPercent: 320, rotate: 10, stagger: { each: 2, from: "end" }, duration: 10 }, "-=1.7");
      tl.to(titleSplit.chars, { opacity: 0, stagger: { each: 0.2, from: "end" }, duration: 10 }, "<+=0.7");
      tl.to(spark, { scale: 0, duration: 2 }, "<+=6");
      tl.fromTo(line, { scaleY: 1 }, { scaleY: 0, duration: 4, ease: "none" });
    }, container);

    return () => {
      button?.classList.add(CTA_PENDING);
      ctx.revert();
    };
  }, [fontsLoaded]);

  return (
    <section ref={containerRef} className="relative -mt-c-160 hidden tablet-portrait:block">
      <div className="absolute top-0 left-c-16 tablet-portrait:left-1/2 w-px h-full">
        <div ref={lineRef} className="absolute top-0 left-1/2 w-px h-full tablet-portrait:bg-brand-05/10" />
        <div ref={sparkRef} className="w-6 h-6 sticky top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <SparkIcon className="absolute top-1/2 left-1/2 -translate-1/2 ml-px drop-shadow-[0_0_24px_white]" />
        </div>
      </div>
      <div className="grid tablet-portrait:grid-cols-2">
        <div className="h-fit tablet-portrait:sticky top-1/2 tablet-portrait:-translate-y-1/2 -mb-45vh flex flex-col tablet-portrait:items-end items-start tablet-portrait:justify-center gap-c-16 desktop:gap-c-24 p-c-32 tablet-portrait:p-c-48">
          <h2
            ref={titleRef}
            className="heading-2 font-instrument-serif tablet-portrait:text-right max-w-80 desktop-sm:max-w-100 desktop-lg:max-w-130"
          >
            {copy.title}
          </h2>
          <p ref={descriptionRef} className="body-md max-w-90 tablet-portrait:text-right">
            {copy.description}
          </p>
          <Button ref={buttonRef} noAnimation className={CTA_PENDING} onClick={() => setShowContactForm(true)}>
            {copy.cta}
          </Button>
        </div>
        <div className="flex flex-col gap-c-120 pt-50vh px-c-48 pb-50vh">
          {copy.steps.map((step) => (
            <div key={step.id} className="js-s-fade-in-outs flex flex-col max-w-80">
              <p data-start="top center" data-end="bottom center" className="js-s-print-opacity body-xl text-brand-05/40">
                {step.id}
              </p>
              <p data-start="top center" data-end="bottom center" className="js-s-print-opacity heading-3 font-instrument-serif">
                {step.title}
              </p>
              <p data-start="top center" data-end="bottom center" className="js-s-print-opacity body-lg text-brand-05/80">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
