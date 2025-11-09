/**
 * Web scraper with retry logic and robots.txt support
 */

import { prisma } from "../database";
import { extractContent } from "./extractor";
import { isAllowed } from "./robots";

/**
 * Scraping options
 */
export interface ScrapeOptions {
  /**
   * Timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Respect robots.txt
   * @default true
   */
  respectRobotsTxt?: boolean;

  /**
   * User agent string
   * @default "HNScraperBot/1.0"
   */
  userAgent?: string;
}

/**
 * Scraping result
 */
export interface ScrapeResult {
  success: boolean;
  title: string | null;
  content: string | null;
  error: string | null;
}

/**
 * Delay execution for a specified number of milliseconds
 *
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrape content from a URL
 *
 * @param url - URL to scrape
 * @param options - Scraping options
 * @returns Scrape result
 *
 * @example
 * const result = await scrapeUrl('https://example.com/article');
 * if (result.success) {
 *   console.log(result.title, result.content);
 * }
 */
export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const {
    timeout = 30000,
    maxRetries = 3,
    respectRobotsTxt = true,
    userAgent = "HNScraperBot/1.0 (+https://github.com/yourusername/hn-scanner)",
  } = options;

  // Check robots.txt
  if (respectRobotsTxt) {
    const allowed = await isAllowed(url, userAgent);

    if (!allowed) {
      return {
        success: false,
        title: null,
        content: null,
        error: "Blocked by robots.txt",
      };
    }
  }

  let lastError: string | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: {
          "User-Agent": userAgent,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}: ${response.statusText}`;

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          break;
        }

        // Retry on 5xx errors
        if (attempt < maxRetries - 1) {
          const delayMs = 1000 * Math.pow(2, attempt);
          await delay(delayMs);
          continue;
        }

        break;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("text/html") === false) {
        return {
          success: false,
          title: null,
          content: null,
          error: `Unsupported content type: ${contentType}`,
        };
      }

      const html = await response.text();
      const extracted = extractContent(html, url);

      return {
        success: true,
        title: extracted.title,
        content: extracted.content,
        error: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      // Retry on network errors
      if (attempt < maxRetries - 1) {
        const delayMs = 1000 * Math.pow(2, attempt);
        console.log(
          `Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`
        );
        await delay(delayMs);
        continue;
      }
    }
  }

  return {
    success: false,
    title: null,
    content: null,
    error: lastError ?? "Unknown error",
  };
}

/**
 * Scrape and persist articles from pending ScrapedArticle records
 *
 * @param limit - Maximum number of articles to scrape (default: no limit)
 * @param options - Scraping options
 * @returns Statistics about the scraping operation
 *
 * @example
 * const stats = await scrapeAndPersistArticles(10);
 * console.log(`Scraped ${stats.success} articles, ${stats.failed} failed`);
 */
export async function scrapeAndPersistArticles(
  limit?: number,
  options: ScrapeOptions = {}
): Promise<{ success: number; failed: number; skipped: number }> {
  // Fetch pending articles
  const pendingArticles = await prisma.scrapedArticle.findMany({
    where: {
      status: "pending",
    },
    ...(limit !== undefined && { take: limit }),
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${pendingArticles.length} pending articles to scrape`);

  const stats = {
    success: 0,
    failed: 0,
    skipped: 0,
  };

  for (const article of pendingArticles) {
    console.log(`Scraping ${article.url}...`);

    try {
      const result = await scrapeUrl(article.url, options);

      if (result.success) {
        await prisma.scrapedArticle.update({
          where: { id: article.id },
          data: {
            title: result.title,
            content: result.content,
            status: "success",
            fetchedAt: new Date(),
            error: null,
          },
        });

        console.log(`✓ Successfully scraped ${article.url}`);
        stats.success++;
      } else {
        await prisma.scrapedArticle.update({
          where: { id: article.id },
          data: {
            status: "failed",
            error: result.error,
            fetchedAt: new Date(),
          },
        });

        console.log(`✗ Failed to scrape ${article.url}: ${result.error}`);
        stats.failed++;
      }

      // Rate limiting: wait 1 second between requests
      await delay(1000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await prisma.scrapedArticle.update({
        where: { id: article.id },
        data: {
          status: "failed",
          error: errorMessage,
          fetchedAt: new Date(),
        },
      });

      console.error(`✗ Error scraping ${article.url}:`, errorMessage);
      stats.failed++;
    }
  }

  return stats;
}
