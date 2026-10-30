"use client";

import dynamic from "next/dynamic";
import AppProviders from "@/components/providers/app-providers";
import Navbar from "@/components/navbar";
import Cursor from "@/components/cursor";
import ContactDrawer from "@/components/contact-drawer";
import Preloader from "@/components/preloader";

const GlBackground = dynamic(() => import("@/components/gl/gl-background"), { ssr: false });
const RigCanvas = dynamic(() => import("@/components/gl/rig-canvas"), { ssr: false });

/**
 * Client-side chrome shared by every page: smooth scroll, WebGL layers,
 * navbar + viewport frame, custom cursor, contact drawer and preloader.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <div
        className="fixed inset-0 z-[100000] pointer-events-none mix-blend-multiply"
        style={{ backgroundImage: "url(/images/noise.png)", backgroundRepeat: "repeat", backgroundPosition: "center center" }}
      />
      <RigCanvas />
      <GlBackground />
      <Navbar />
      <Cursor />
      {children}
      <ContactDrawer />
      <Preloader />
    </AppProviders>
  );
}
