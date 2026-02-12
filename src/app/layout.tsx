import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd, buildWebsiteJsonLd } from "@/components/seo/JsonLd";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | VisualClimate",
    default: "VisualClimate - Climate Intelligence for Sustainability Professionals",
  },
  description: "Open climate data platform. 200 countries. Real-time indicators.",
  keywords: ["climate data", "sustainability", "ESG", "carbon emissions", "climate intelligence"],
  authors: [{ name: "VisualClimate" }],
  openGraph: {
    title: "VisualClimate - Climate Intelligence for Sustainability Professionals",
    description: "Open climate data platform. 200 countries. Real-time indicators.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisualClimate - Climate Intelligence for Sustainability Professionals",
    description: "Open climate data platform. 200 countries. Real-time indicators.",
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-950 text-white`}>
        <JsonLd data={buildWebsiteJsonLd()} />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
