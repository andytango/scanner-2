/**
 * Content extraction from external URLs
 */

import * as cheerio from "cheerio";

/**
 * Extracted content from a web page
 */
export interface ExtractedContent {
  title: string | null;
  content: string | null;
  url: string;
}

/**
 * Extract main content from HTML
 *
 * This function attempts to extract the primary text content from a web page,
 * filtering out navigation, ads, and other non-content elements.
 *
 * @param html - Raw HTML string
 * @param url - Original URL (for reference)
 * @returns Extracted content with title and text
 *
 * @example
 * const html = await fetch(url).then(r => r.text());
 * const content = extractContent(html, url);
 */
export function extractContent(html: string, url: string): ExtractedContent {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    "script, style, nav, header, footer, aside, iframe, noscript, [role='navigation'], [role='banner'], [role='complementary']"
  ).remove();

  // Try to find the title
  const ogTitle = $("meta[property='og:title']").attr("content");
  const twitterTitle = $("meta[name='twitter:title']").attr("content");
  const titleTag = $("title").text();
  const h1Tag = $("h1").first().text();

  let title: string | null =
    (ogTitle !== undefined && ogTitle.length > 0 ? ogTitle : null) ??
    (twitterTitle !== undefined && twitterTitle.length > 0
      ? twitterTitle
      : null) ??
    (titleTag.length > 0 ? titleTag : null) ??
    (h1Tag.length > 0 ? h1Tag : null);

  if (title !== null) {
    title = title.trim();
  }

  // Try to find the main content area
  let contentElement = $("article").first();

  if (contentElement.length === 0) {
    contentElement = $("main").first();
  }

  if (contentElement.length === 0) {
    contentElement = $("[role='main']").first();
  }

  if (contentElement.length === 0) {
    contentElement = $("body");
  }

  // Extract text content
  let content = contentElement.text();

  // Clean up whitespace
  content = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return {
    title,
    content: content.length > 0 ? content : null,
    url,
  };
}
