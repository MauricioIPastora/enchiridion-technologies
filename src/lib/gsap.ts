import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GsapSplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, GsapSplitText);
  gsap.ticker.lagSmoothing(0);
}

type SplitTextOptions = NonNullable<ConstructorParameters<typeof GsapSplitText>[1]>;

/**
 * SplitText wrapper that ignores proximity-hover character spans by default
 * (they are already split into per-character elements).
 */
export class SplitText extends GsapSplitText {
  constructor(target: gsap.DOMTarget, vars: SplitTextOptions) {
    super(target, {
      ...vars,
      ignore: vars.ignore ?? "[data-proximity-text]",
    });
  }
}

export { gsap, ScrollTrigger };
