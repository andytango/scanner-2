import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";

/**
 * Font configuration for the Next.js application
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
  Font configuration for the Next.js application
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * @constant Metadata configuration for the Next.js application
 */
export const metadata: Metadata = {
  title: "Scanner - HN Article Embeddings",
  description: "Visualize and explore Hacker News article embeddings",
};

/**
 * Root layout component that wraps all pages in the application
 *
 * @param props - The component props
 * @param props.children - The child components to render within the layout
 * @returns The root HTML structure with body content
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavBar />
          <main className="container mx-auto py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
