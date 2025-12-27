import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Notebook",
    template: "%s | Notebook",
  },
  description:
    "AI-powered personal knowledge management. Capture thoughts, connect ideas, and let AI help you discover insights.",
  keywords: [
    "notebook",
    "notes",
    "knowledge management",
    "AI",
    "personal wiki",
    "journal",
    "second brain",
  ],
  authors: [{ name: "Notebook" }],
  creator: "Notebook",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Notebook",
    description: "AI-powered personal knowledge management",
    siteName: "Notebook",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notebook",
    description: "AI-powered personal knowledge management",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}
      >
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
