import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conduit- CI/CD pipelines visualized",
  description: "CI/CD pipelines visualized",
  icons: {
    icon: "/globe.svg",
  },
  openGraph: {
    title: "Conduit- CI/CD pipelines visualized",
    type: "website",
    url: "https://conduit.vedpatil.in",
    description: "CI/CD pipelines visualized",
    images: [
      {
        url: "/globe.svg",
        width: 1280,
        height: 720,
        alt: "Conduit- CI/CD pipelines visualized",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
