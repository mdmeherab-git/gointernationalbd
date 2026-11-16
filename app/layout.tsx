import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali, Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import OfficeChatWidget from "../components/chat/OfficeChatWidget";
import MetaPixel from "../components/MetaPixel";
import VisitorTracker from "../components/VisitorTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Site-wide fonts (self-hosted by next/font): English letters come from
// Poppins; Poppins has no Bangla glyphs, so Bangla falls through to
// Noto Sans Bengali. See --font-sans in globals.css for the stack order.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GO INTERNATIONAL BD",
  description: "Official Visa Check & Immigration Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${notoBengali.variable} min-h-full flex flex-col antialiased`}
      >
        <LanguageProvider>
          {children}
          <OfficeChatWidget />
          <MetaPixel />
          <VisitorTracker />
        </LanguageProvider>
      </body>
    </html>
  );
}
