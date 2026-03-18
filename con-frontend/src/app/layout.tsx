import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
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

import { ThemeProvider } from "@/components/theme-provider";
import GlobalLoader from "@/components/GlobalLoader";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${roboto.className} ${roboto.variable} ${geistMono.variable} antialiased transition-colors duration-300`}
      >
        <ThemeProvider>
          <GlobalLoader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
