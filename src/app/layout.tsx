import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | VisualClimate",
    default: "VisualClimate - Climate Intelligence for Sustainability Professionals",
  },
  description: "AI-powered climate data platform. 200 countries. Real-time data. One search.",
  keywords: ["climate data", "sustainability", "ESG", "carbon emissions", "climate intelligence"],
  authors: [{ name: "VisualClimate" }],
  openGraph: {
    title: "VisualClimate - Climate Intelligence for Sustainability Professionals",
    description: "AI-powered climate data platform. 200 countries. Real-time data. One search.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisualClimate - Climate Intelligence for Sustainability Professionals",
    description: "AI-powered climate data platform. 200 countries. Real-time data. One search.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-white`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
