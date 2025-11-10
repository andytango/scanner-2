"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Props for ThemeProvider component
 */
export type ThemeProviderProps = React.ComponentProps<
  typeof NextThemesProvider
>;

/**
 * Theme provider component that wraps the application with next-themes
 * Enables dark mode support throughout the app
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @param props.attribute - HTML attribute to use for theme (default: "class")
 * @param props.defaultTheme - Default theme to use (default: "system")
 * @param props.enableSystem - Enable system theme detection (default: true)
 * @param props.disableTransitionOnChange - Disable CSS transitions during theme change (default: true)
 * @returns JSX element containing the theme provider
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps): React.JSX.Element {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
