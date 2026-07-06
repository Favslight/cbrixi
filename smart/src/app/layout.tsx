import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CBRIXI – Smart Devices for a Smarter Life",
  description:
    "Discover the latest smartwatches, smartphones, smart home devices, audio gear, and accessories at CBRIXI. Premium tech, fast delivery, secure payments.",
  keywords: [
    "CBRIXI",
    "smart devices",
    "smartwatch",
    "smart home",
    "wireless earbuds",
    "tech gadgets",
    "electronics store",
  ],
  openGraph: {
    title: "CBRIXI – Smart Devices for a Smarter Life",
    description: "Discover the latest smart gadgets designed to upgrade your lifestyle.",
    type: "website",
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: [{ url: "/favicon.png", type: "image/png" }],
    apple: [{ url: "/favicon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans antialiased animated-bg min-h-screen bg-white dark:bg-[#07070a] text-black dark:text-white transition-colors duration-300`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
