#!/usr/bin/env tsx

/**
 * CLI script to run the full pipeline
 *
 * This script runs all three steps in sequence:
 * 1. Fetch HN stories and comments
 * 2. Scrape article content
 * 3. Generate embeddings
 *
 * Usage:
 *   pnpm tsx scripts/run-full-pipeline.ts
 *   pnpm tsx scripts/run-full-pipeline.ts --hours=12 --limit=20
 */

import { fetchAndPersistStories } from "../lib/hacker-news";
import { scrapeAndPersistArticles } from "../lib/scraping";
import { processAllArticles } from "../lib/embeddings";
import { prisma } from "../lib/database";

/**
 * Parse command line arguments
 *
 * @returns Parsed options
 */
function parseArgs(): {
  hours?: number;
  count?: number;
  scrapeLimit?: number;
  embeddingLimit?: number;
} {
  const args = process.argv.slice(2);
  const options: {
    hours?: number;
    count?: number;
    scrapeLimit?: number;
    embeddingLimit?: number;
  } = {};

  for (const arg of args) {
    if (arg.startsWith("--hours=")) {
      const value = arg.split("=")[1];
      if (value !== undefined) {
        options.hours = parseInt(value, 10);
      }
    } else if (arg.startsWith("--count=")) {
      const value = arg.split("=")[1];
      if (value !== undefined) {
        options.count = parseInt(value, 10);
      }
    } else if (arg.startsWith("--scrape-limit=")) {
      const value = arg.split("=")[1];
      if (value !== undefined) {
        options.scrapeLimit = parseInt(value, 10);
      }
    } else if (arg.startsWith("--embedding-limit=")) {
      const value = arg.split("=")[1];
      if (value !== undefined) {
        options.embeddingLimit = parseInt(value, 10);
      }
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: pnpm tsx scripts/run-full-pipeline.ts [options]

Options:
  --hours=N             Fetch stories from the last N hours (default: 24)
  --count=N             Fetch the latest N stories
  --scrape-limit=N      Maximum number of articles to scrape
  --embedding-limit=N   Maximum number of articles to generate embeddings for
  --help, -h            Show this help message

Examples:
  pnpm tsx scripts/run-full-pipeline.ts
  pnpm tsx scripts/run-full-pipeline.ts --hours=6 --scrape-limit=10
  pnpm tsx scripts/run-full-pipeline.ts --count=30
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

  console.log("╔══════════════════════════════════╗");
  console.log("║  HN Scanner - Full Pipeline     ║");
  console.log("╚══════════════════════════════════╝\n");

  const startTime = Date.now();

  try {
    // Step 1: Fetch stories
    console.log("━━━ Step 1/3: Fetching HN Stories ━━━\n");

    const fetchResult = await fetchAndPersistStories({
      ...(options.hours !== undefined && { hours: options.hours }),
      ...(options.count !== undefined && { count: options.count }),
    });

    console.log(`✓ Fetched ${fetchResult.stories.length} stories`);
    console.log(`✓ Fetched ${fetchResult.comments.length} comments`);
    console.log(`✓ Skipped ${fetchResult.skipped} existing stories\n`);

    // Step 2: Scrape articles
    console.log("━━━ Step 2/3: Scraping Articles ━━━\n");

    const scrapeStats = await scrapeAndPersistArticles(options.scrapeLimit);

    console.log(`✓ Scraped ${scrapeStats.success} articles successfully`);
    console.log(`✗ Failed ${scrapeStats.failed} articles\n`);

    // Step 3: Generate embeddings
    console.log("━━━ Step 3/3: Generating Embeddings ━━━\n");

    const embeddingStats = await processAllArticles(options.embeddingLimit);

    console.log(`✓ Processed ${embeddingStats.processed} articles`);
    console.log(`✓ Created ${embeddingStats.embeddings} embeddings`);
    console.log(`✗ Errors: ${embeddingStats.errors}\n`);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("╔══════════════════════════════════╗");
    console.log("║         Pipeline Complete        ║");
    console.log("╚══════════════════════════════════╝\n");

    console.log("Summary:");
    console.log(`  Duration: ${duration}s`);
    console.log(
      `  Stories: ${fetchResult.stories.length} fetched, ${fetchResult.skipped} skipped`
    );
    console.log(`  Comments: ${fetchResult.comments.length} fetched`);
    console.log(
      `  Articles: ${scrapeStats.success} scraped, ${scrapeStats.failed} failed`
    );
    console.log(
      `  Embeddings: ${embeddingStats.embeddings} created for ${embeddingStats.processed} articles`
    );
    console.log("\n✓ Done!");
  } catch (error) {
    console.error("\n✗ Pipeline failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
