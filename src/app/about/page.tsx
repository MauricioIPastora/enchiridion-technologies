import type { Metadata } from "next";
import AboutPage from "@/features/about/about-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `About — ${site.name}`,
  description: site.about.paragraphs[0],
};

export default function Page() {
  return <AboutPage />;
}
