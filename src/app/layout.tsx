import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Red_Hat_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/providers/app-shell";
import { site } from "@/content/site";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  variable: "--font-red-hat-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://enchiridiontech.com"),
  title: site.meta.title,
  description: site.meta.description,
  keywords: [...site.meta.keywords],
  icons: {
    icon: "/scroll-image.png",
    apple: "/scroll-image.png",
  },
  openGraph: {
    title: site.meta.title,
    description: site.meta.description,
    type: "website",
    images: ["/scroll-hd.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#120703",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${redHatDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-red-hat-display">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "history.scrollRestoration='manual';window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;",
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
