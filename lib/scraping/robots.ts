/**
 * Robots.txt checking functionality
 */

import robotsParser from "robots-parser";

/**
 * Type representing a parsed robots.txt object
 */
type Robot = ReturnType<typeof robotsParser>;

const robotsCache = new Map<string, Robot>();

/**
 * Get the base URL for a given URL
 *
 * @param url - Full URL
 * @returns Base URL (protocol + host)
 */
function getBaseUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

/**
 * Fetch and parse robots.txt for a given URL
 *
 * @param url - URL to check
 * @returns Parsed robots.txt object
 */
async function fetchRobotsTxt(url: string): Promise<Robot> {
  const baseUrl = getBaseUrl(url);

  // Check cache
  if (robotsCache.has(baseUrl)) {
    return robotsCache.get(baseUrl)!;
  }

  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
    });

    let robotsTxt = "";

    if (response.ok) {
      robotsTxt = await response.text();
    }

    const robot = robotsParser(robotsUrl, robotsTxt);
    robotsCache.set(baseUrl, robot);

    return robot;
  } catch (error) {
    console.warn(`Failed to fetch robots.txt for ${baseUrl}:`, error);

    // Return a permissive robot if fetch fails
    const robot = robotsParser("", "");
    robotsCache.set(baseUrl, robot);

    return robot;
  }
}

/**
 * Check if a URL is allowed to be crawled according to robots.txt
 *
 * @param url - URL to check
 * @param userAgent - User agent string (default: "HNScraperBot")
 * @returns True if the URL is allowed to be crawled
 *
 * @example
 * const allowed = await isAllowed('https://example.com/article');
 * if (allowed) {
 *   // Proceed with scraping
 * }
 */
export async function isAllowed(
  url: string,
  userAgent = "HNScraperBot"
): Promise<boolean> {
  try {
    const robot = await fetchRobotsTxt(url);
    return robot.isAllowed(url, userAgent) ?? true;
  } catch (error) {
    console.warn(`Error checking robots.txt for ${url}:`, error);
    // Default to allowed if there's an error
    return true;
  }
}
