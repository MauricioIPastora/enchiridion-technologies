import type { Metadata } from "next";
import WorkPage from "@/features/work/work-page";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `Work — ${site.name}`,
  description: "Selected projects by Enchiridion Technologies.",
};

export default function Page() {
  return <WorkPage />;
}
