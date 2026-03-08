import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
