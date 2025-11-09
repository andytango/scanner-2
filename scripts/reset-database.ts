#!/usr/bin/env tsx

/**
 * CLI script to reset the database to a clean state
 *
 * This script deletes all data from the database tables, keeping the schema intact.
 * Use with caution as this operation cannot be undone.
 *
 * Usage:
 *   pnpm tsx scripts/reset-database.ts
 *   pnpm tsx scripts/reset-database.ts --confirm
 */

import "dotenv/config";
import { prisma } from "../lib/database";
import * as readline from "readline";

/**
 * Parse command line arguments
 *
 * @returns Parsed options
 */
function parseArgs(): { confirm: boolean } {
  const args = process.argv.slice(2);
  return {
    confirm: args.includes("--confirm"),
  };
}

/**
 * Prompt user for confirmation
 *
 * @param question - Question to ask
 * @returns Promise that resolves to true if user confirms
 */
async function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Reset the database by deleting all data
 */
async function resetDatabase(): Promise<void> {
  console.log("🗑️  Deleting all data from database tables...\n");

  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    console.log("Deleting Embeddings...");
    const embeddingsDeleted = await prisma.embedding.deleteMany();
    console.log(`✓ Deleted ${embeddingsDeleted.count} embeddings`);

    console.log("Deleting ScrapedArticles...");
    const articlesDeleted = await prisma.scrapedArticle.deleteMany();
    console.log(`✓ Deleted ${articlesDeleted.count} articles`);

    console.log("Deleting HnComments...");
    const commentsDeleted = await prisma.hnComment.deleteMany();
    console.log(`✓ Deleted ${commentsDeleted.count} comments`);

    console.log("Deleting HnStories...");
    const storiesDeleted = await prisma.hnStory.deleteMany();
    console.log(`✓ Deleted ${storiesDeleted.count} stories`);

    console.log("Deleting Tasks...");
    const tasksDeleted = await prisma.task.deleteMany();
    console.log(`✓ Deleted ${tasksDeleted.count} tasks`);

    console.log("\n✅ Database has been reset successfully!");
    console.log("All data has been deleted, but the schema remains intact.");
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    throw error;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const options = parseArgs();

  console.log("╔═══════════════════════════════════╗");
  console.log("║     Database Reset Utility        ║");
  console.log("╚═══════════════════════════════════╝\n");

  console.log("⚠️  WARNING: This will delete ALL data from the database!");
  console.log("   - All HN stories");
  console.log("   - All comments");
  console.log("   - All scraped articles");
  console.log("   - All embeddings");
  console.log("\n   The database schema will remain intact.\n");

  // Ask for confirmation unless --confirm flag is provided
  if (!options.confirm) {
    const confirmed = await promptConfirmation(
      "Are you sure you want to continue? (y/N): "
    );

    if (!confirmed) {
      console.log("\n❌ Database reset cancelled.");
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  await resetDatabase();
  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
