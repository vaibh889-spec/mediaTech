import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MediaFetch | Modern Media Downloader",
  description: "Download publicly accessible media easily with MediaFetch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="py-6 text-center text-sm text-muted-foreground">
          <p>(made by Sneha & Vaibh)</p>
        </footer>
      </body>
    </html>
  );
}
