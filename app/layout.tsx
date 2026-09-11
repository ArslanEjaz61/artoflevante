import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loyalty Club",
  description: "Collect points, unlock rewards and enjoy exclusive member offers at every branch.",
  icons: {
    icon: "/lofoe.png",
    shortcut: "/lofoe.png",
    apple: "/lofoe.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loyalty Club",
  },
};

export const viewport: Viewport = {
  themeColor: "#C0392B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased selection:bg-[#C0392B] selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
