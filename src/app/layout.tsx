import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { SessionProvider } from "@/components/providers/session-provider";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "BrideGlam - Professional Makeup Artists",
  description:
    "Book appointments with professional makeup artists for any occasion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers>
          <SessionProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
            <Toaster />
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
