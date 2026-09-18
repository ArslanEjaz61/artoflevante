import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loyalty Club",
  description: "Collect points, unlock rewards and enjoy exclusive member offers at every branch.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/lofoe.png?v=2", type: "image/png" },
      { url: "/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/lofoe.png?v=2",
    apple: [
      { url: "/lofoe.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loyalty Club",
  },
};

export const viewport: Viewport = {
  themeColor: "#801313",
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
      <head>
        <link rel="icon" type="image/png" href="/lofoe.png?v=2" />
        <link rel="shortcut icon" type="image/png" href="/lofoe.png?v=2" />
        <link rel="apple-touch-icon" href="/lofoe.png?v=2" />
        {/* Display face used across the branded screens. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased selection:bg-[#801313] selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
