import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MetaMap AI | Patient Risk Workflow",
  description:
    "Demo patient registration, multi-format oncology risk analysis, PDF report generation, and patient email delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${instrumentSerif.variable} ${plusJakarta.variable} antialiased min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]`}
      >
        {children}
      </body>
    </html>
  );
}
