/**
 * Process articles and generate embeddings
 */

import { prisma } from "../database";
import { chunkText } from "./chunker";
import { generateEmbedding } from "./generator";

/**
 * Process and generate embeddings for a single article
 *
 * @param articleId - ID of the ScrapedArticle to process
 * @returns Number of embeddings created
 */
export async function processArticle(articleId: number): Promise<number> {
  // Fetch the article
  const article = await prisma.scrapedArticle.findUnique({
    where: { id: articleId },
  });

  if (article === null) {
    throw new Error(`Article ${articleId} not found`);
  }

  if (article.status !== "success" || article.content === null) {
    throw new Error(
      `Article ${articleId} has no content (status: ${article.status})`
    );
  }

  console.log(`Processing article ${articleId}: ${article.title}`);

  // Check if embeddings already exist
  const existingCount = await prisma.embedding.count({
    where: { articleId },
  });

  if (existingCount > 0) {
    console.log(
      `Article ${articleId} already has ${existingCount} embeddings, skipping...`
    );
    return 0;
  }

  // Chunk the text
  console.log(`Chunking text for article ${articleId}...`);
  const chunks = await chunkText(article.content);
  console.log(`Created ${chunks.length} chunks`);

  let embeddingsCreated = 0;

  // Generate and store embeddings for each chunk
  for (const chunk of chunks) {
    console.log(
      `Generating embedding for ${chunk.chunkType} chunk ${chunk.index + 1}/${chunk.totalChunks}...`
    );

    // Generate embedding vector
    const embeddingVector = await generateEmbedding(chunk.content);

    // Convert array to PostgreSQL vector format: '[1,2,3,...]'
    const vectorString = `[${embeddingVector.join(",")}]`;

    // Store in database using raw SQL to insert the vector
    // We use raw SQL because Prisma doesn't support the vector type natively
    await prisma.$executeRaw`
      INSERT INTO "Embedding" (content, embedding, "chunkType", metadata, "articleId", "createdAt")
      VALUES (
        ${chunk.content},
        ${vectorString}::vector,
        ${chunk.chunkType},
        ${JSON.stringify({
          index: chunk.index,
          totalChunks: chunk.totalChunks,
        })}::jsonb,
        ${articleId},
        NOW()
      )
    `;

    embeddingsCreated++;
  }

  console.log(
    `✓ Created ${embeddingsCreated} embeddings for article ${articleId}`
  );

  return embeddingsCreated;
}

/**
 * Process all articles without embeddings
 *
 * @param limit - Maximum number of articles to process (default: no limit)
 * @returns Statistics about the processing operation
 *
 * @example
 * const stats = await processAllArticles(10);
 * console.log(`Processed ${stats.processed} articles, created ${stats.embeddings} embeddings`);
 */
export async function processAllArticles(
  limit?: number
): Promise<{ processed: number; embeddings: number; errors: number }> {
  // Find articles without embeddings
  const articles = await prisma.scrapedArticle.findMany({
    where: {
      status: "success",
      content: {
        not: null,
      },
      embeddings: {
        none: {},
      },
    },
    ...(limit !== undefined && { take: limit }),
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Found ${articles.length} articles to process`);

  const stats = {
    processed: 0,
    embeddings: 0,
    errors: 0,
  };

  for (const article of articles) {
    try {
      const embeddingsCreated = await processArticle(article.id);
      stats.processed++;
      stats.embeddings += embeddingsCreated;
    } catch (error) {
      console.error(
        `Error processing article ${article.id}:`,
        error instanceof Error ? error.message : String(error)
      );
      stats.errors++;
    }
  }

  return stats;
}
