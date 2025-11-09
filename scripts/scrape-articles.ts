#!/usr/bin/env tsx

/**
 * CLI script to scrape article content from external URLs
 *
 * Usage:
 *   pnpm tsx scripts/scrape-articles.ts
 *   pnpm tsx scripts/scrape-articles.ts --limit=10
 */

import { scrapeAndPersistArticles } from "../lib/scraping";
import { prisma } from "../lib/database";

/**
 * Parse command line arguments
 *
 * @returns Parsed options
 */
function parseArgs(): { limit?: number } {
  const args = process.argv.slice(2);
  const options: { limit?: number } = {};

  for (const arg of args) {
    if (arg.startsWith("--limit=")) {
      const value = arg.split("=")[1];
      if (value !== undefined) {
        options.limit = parseInt(value, 10);
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: pnpm tsx scripts/scrape-articles.ts [options]

Options:
  --limit=N   Maximum number of articles to scrape
  --help, -h  Show this help message

Examples:
  pnpm tsx scripts/scrape-articles.ts
  pnpm tsx scripts/scrape-articles.ts --limit=20
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const options = parseArgs();

  console.log("=== Article Scraper ===\n");

  if (options.limit !== undefined) {
    console.log(`Scraping up to ${options.limit} articles...\n`);
  } else {
    console.log("Scraping all pending articles...\n");
  }

  // Create a task record
  const task = await prisma.task.create({
    data: {
      type: "scrape-articles",
      status: "running",
      startedAt: new Date(),
      metadata: options,
    },
  });

  try {
    const stats = await scrapeAndPersistArticles(options.limit);

    // Update task status
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        metadata: {
          ...options,
          result: stats,
        },
      },
    });

    console.log("\n=== Summary ===");
    console.log(`Articles scraped successfully: ${stats.success}`);
    console.log(`Articles failed: ${stats.failed}`);
    console.log(`Articles skipped: ${stats.skipped}`);
    console.log("\n✓ Done!");
  } catch (error) {
    // Update task status
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    });

    console.error("\n✗ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
