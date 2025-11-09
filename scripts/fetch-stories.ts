#!/usr/bin/env tsx

/**
 * CLI script to fetch HN stories and comments
 *
 * Usage:
 *   pnpm tsx scripts/fetch-stories.ts --hours=24
 *   pnpm tsx scripts/fetch-stories.ts --count=100
 */

import { fetchAndPersistStories } from "../lib/hacker-news";
import { prisma } from "../lib/database";

/**
 * Parse command line arguments
 *
 * @returns Parsed options
 */
function parseArgs(): { hours?: number; count?: number } {
  const args = process.argv.slice(2);
  const options: { hours?: number; count?: number } = {};

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
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: pnpm tsx scripts/fetch-stories.ts [options]

Options:
  --hours=N   Fetch stories from the last N hours (default: 24)
  --count=N   Fetch the latest N stories
  --help, -h  Show this help message

Examples:
  pnpm tsx scripts/fetch-stories.ts --hours=12
  pnpm tsx scripts/fetch-stories.ts --count=50
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

  console.log("=== HN Story Fetcher ===\n");

  if (options.hours !== undefined) {
    console.log(`Fetching stories from the last ${options.hours} hours...\n`);
  } else if (options.count !== undefined) {
    console.log(`Fetching the latest ${options.count} stories...\n`);
  } else {
    console.log("Fetching stories from the last 24 hours (default)...\n");
  }

  // Create a task record
  const task = await prisma.task.create({
    data: {
      type: "fetch-stories",
      status: "running",
      startedAt: new Date(),
      metadata: options,
    },
  });

  try {
    const result = await fetchAndPersistStories(options);

    // Update task status
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        metadata: {
          ...options,
          result: {
            stories: result.stories.length,
            comments: result.comments.length,
            skipped: result.skipped,
            errors: result.errors.length,
          },
        },
      },
    });

    console.log("\n=== Summary ===");
    console.log(`Stories fetched: ${result.stories.length}`);
    console.log(`Comments fetched: ${result.comments.length}`);
    console.log(`Stories skipped (already exist): ${result.skipped}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\nErrors:");
      for (const error of result.errors) {
        console.log(`  - Story ${error.id}: ${error.error}`);
      }
    }

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
