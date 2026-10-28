import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OdiseaCloud · CRM comercial",
  description: "Empresas, territorios y oportunidades comerciales de OdiseaCloud.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}

