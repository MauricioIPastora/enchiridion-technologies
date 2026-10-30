"use client";

import { forwardRef, useCallback, useRef } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import VariableProximity from "@/components/ui/variable-proximity";
import { handleParticleTransitionClick } from "@/lib/page-transitions";

interface AppLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  href?: string;
  isExternalLink?: boolean;
  /** Renders a <p> that behaves like a link (used for in-page actions). */
  isTextLink?: boolean;
  noDataEvent?: boolean;
  hasProximityHover?: boolean;
  children: React.ReactNode;
}

/**
 * Site link: external links open in a new tab, internal ones run the
 * page-fade + particle-dissolve transition (or smooth-scroll to a hash),
 * and text can get the variable-weight proximity hover.
 */
const AppLink = forwardRef<HTMLAnchorElement | HTMLParagraphElement, AppLinkProps>(
  (
    {
      isExternalLink = false,
      isTextLink = false,
      noDataEvent = false,
      hasProximityHover = false,
      children,
      href,
      onClick,
      className,
      ...rest
    },
    ref,
  ) => {
    const pathname = usePathname();
    const router = useRouter();
    const proximityRef = useRef<HTMLSpanElement>(null);

    const content =
      (isTextLink || hasProximityHover) && typeof children === "string" ? (
        <span ref={proximityRef} data-proximity-text className="inline">
          <VariableProximity
            label={children}
            containerRef={proximityRef}
            fromFontVariationSettings="'wght' 400"
            toFontVariationSettings="'wght' 900"
            radius={80}
            falloff="exponential"
          />
        </span>
      ) : (
        children
      );

    const dataEvent = noDataEvent ? "simple-hover" : "hover";

    const handleInternalClick = useCallback(
      async (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
        const go = await handleParticleTransitionClick(e, target, pathname, () =>
          router.push(target),
        );
        go?.();
      },
      [pathname, router],
    );

    if (isTextLink && !href) {
      return (
        <p
          data-event={dataEvent}
          className={className ?? "inherit"}
          ref={ref as React.Ref<HTMLParagraphElement>}
          onClick={onClick as unknown as React.MouseEventHandler<HTMLParagraphElement>}
          {...(rest as React.HTMLAttributes<HTMLParagraphElement>)}
        >
          {content}
        </p>
      );
    }

    if (isExternalLink) {
      return (
        <a
          data-event={dataEvent}
          href={href}
          className={className ?? "inherit"}
          target="_blank"
          rel="noopener noreferrer"
          ref={ref as React.Ref<HTMLAnchorElement>}
          onClick={onClick}
          {...rest}
        >
          {content}
        </a>
      );
    }

    const target = href ?? "/";
    return (
      <NextLink
        data-event={dataEvent}
        href={target}
        className={className ?? "inherit"}
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={(e) => {
          void handleInternalClick(e, target);
          onClick?.(e);
        }}
        {...rest}
      >
        {content}
      </NextLink>
    );
  },
);

AppLink.displayName = "AppLink";

export default AppLink;
