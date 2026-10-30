import { gsap } from "@/lib/gsap";

/**
 * Sizes the pill-outline SVG to the button and prepares the stroke dash so it
 * can be "drawn" with strokeDashoffset. Returns the perimeter length.
 */
export function syncButtonSvg(
  button: HTMLElement,
  svg: SVGSVGElement,
  rect: SVGRectElement,
  { preserveProgress = false }: { preserveProgress?: boolean } = {},
): number | null {
  const { width, height } = button.getBoundingClientRect();
  if (width === 0 || height === 0) return null;
  const r = height / 2;
  const perimeter = 2 * (width - 2 * r) + 2 * Math.PI * r;
  let progress = 0;
  if (preserveProgress) {
    const dash = Number(gsap.getProperty(rect, "strokeDasharray"));
    const offset = Number(gsap.getProperty(rect, "strokeDashoffset"));
    if (dash > 0) progress = 1 - offset / dash;
  }
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  rect.setAttribute("x", "0.5");
  rect.setAttribute("y", "0.5");
  rect.setAttribute("width", String(width - 1));
  rect.setAttribute("height", String(height - 1));
  rect.setAttribute("rx", String(r - 0.5));
  gsap.set(rect, {
    strokeDasharray: perimeter,
    strokeDashoffset: preserveProgress ? perimeter * (1 - progress) : perimeter,
  });
  return perimeter;
}
