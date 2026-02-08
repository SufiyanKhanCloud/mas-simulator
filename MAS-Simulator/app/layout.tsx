import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Queue Simulator",
  description:
    "Analyze queueing systems with Poisson arrivals, exponential service times, uniform service times, normal service times, and priority scheduling. Simulate M/M/1, M/M/S, M/G/1 and M/G/S queues with interactive Gantt charts and performance metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
