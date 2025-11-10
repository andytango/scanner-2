"use client";

import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Navigation bar component displayed at the top of all pages
 * Includes site branding and theme toggle
 *
 * @returns JSX element containing the navigation bar
 * @example
 * <NavBar />
 */
export function NavBar(): React.JSX.Element {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 mx-auto items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Scanner</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/cluster-map"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Cluster Map
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
