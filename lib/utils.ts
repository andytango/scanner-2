import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and tailwind-merge for optimal Tailwind CSS class handling
 *
 * @param inputs - Array of class values to be merged
 * @returns A single merged string of class names with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
