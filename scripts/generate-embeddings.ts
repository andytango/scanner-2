#!/usr/bin/env tsx

/**
 * CLI script to generate embeddings for scraped articles
 *
 * Usage:
 *   pnpm tsx scripts/generate-embeddings.ts
 *   pnpm tsx scripts/generate-embeddings.ts --limit=5
 */

import { processAllArticles } from "../lib/embeddings";
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
Usage: pnpm tsx scripts/generate-embeddings.ts [options]

Options:
  --limit=N   Maximum number of articles to process
  --help, -h  Show this help message

Examples:
  pnpm tsx scripts/generate-embeddings.ts
  pnpm tsx scripts/generate-embeddings.ts --limit=10
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

  console.log("=== Embedding Generator ===\n");

  if (options.limit !== undefined) {
    console.log(`Processing up to ${options.limit} articles...\n`);
  } else {
    console.log("Processing all articles without embeddings...\n");
  }

  // Create a task record
  const task = await prisma.task.create({
    data: {
      type: "generate-embeddings",
      status: "running",
      startedAt: new Date(),
      metadata: options,
    },
  });

  try {
    const stats = await processAllArticles(options.limit);

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
    console.log(`Articles processed: ${stats.processed}`);
    console.log(`Embeddings created: ${stats.embeddings}`);
    console.log(`Errors: ${stats.errors}`);
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
