import type { Metadata } from "next";
import "./globals.css";
import "./quote-document.css";

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
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}

