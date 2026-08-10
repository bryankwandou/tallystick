import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://tallystick.vercel.app",
  ),
  title: "Tallystick — settlement your agent can prove",
  description:
    "Every agent payout is split in two: a signed claim and a receipt written inside the enclave. Funds move only when the halves match.",
  openGraph: {
    title: "Tallystick — settlement your agent can prove",
    description:
      "Every agent payout is split in two: a signed claim and a receipt written inside the enclave. Funds move only when the halves match.",
    url: "/",
    siteName: "Tallystick",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tallystick — settlement your agent can prove",
    description:
      "A signed claim, an enclave receipt, and a Solana escrow that only releases when the two halves match.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-primary-foreground"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
