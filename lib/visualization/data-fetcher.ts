import { prisma } from "@/lib/database";
import { Prisma } from "@prisma/client";

/**
 * Embedding data point with associated metadata
 */
export interface EmbeddingDataPoint {
  id: number;
  embedding: number[];
  content: string;
  chunkType: string;
  articleId: number;
  articleTitle: string | null;
  articleUrl: string;
  metadata: unknown;
}

/**
 * Options for filtering embeddings
 */
export interface FetchEmbeddingsOptions {
  chunkTypes?: string[];
  limit?: number;
  articleIds?: number[];
}

/**
 * Fetches embeddings from the database with optional filters
 * This is a server-side only function for use in Server Components
 *
 * @param options - Optional filters for embeddings query
 * @returns Array of embedding data points
 * @example
 * const embeddings = await fetchEmbeddings({ chunkTypes: ['paragraph'], limit: 5000 });
 */
export async function fetchEmbeddings(
  options: FetchEmbeddingsOptions = {}
): Promise<EmbeddingDataPoint[]> {
  const { chunkTypes, limit = 50000, articleIds } = options;

  // Build WHERE clause conditions
  const chunkTypeCondition =
    chunkTypes !== undefined && chunkTypes.length > 0
      ? Prisma.sql`e."chunkType" IN (${Prisma.join(chunkTypes)})`
      : Prisma.sql`TRUE`;

  const articleIdCondition =
    articleIds !== undefined && articleIds.length > 0
      ? Prisma.sql`e."articleId" IN (${Prisma.join(articleIds)})`
      : Prisma.sql`TRUE`;

  // Fetch embeddings using raw SQL to access vector data
  // Prisma doesn't natively support pgvector type
  const embeddings = await prisma.$queryRaw<
    Array<{
      id: number;
      embedding: string; // pgvector returns as string representation
      content: string;
      chunkType: string;
      metadata: unknown;
      articleId: number;
      articleTitle: string | null;
      articleUrl: string;
    }>
  >`
    SELECT
      e.id,
      e.embedding::text as embedding,
      e.content,
      e."chunkType",
      e.metadata,
      e."articleId",
      a.title as "articleTitle",
      a.url as "articleUrl"
    FROM "Embedding" e
    INNER JOIN "ScrapedArticle" a ON e."articleId" = a.id
    WHERE
      ${chunkTypeCondition}
      AND ${articleIdCondition}
    ORDER BY e.id
    LIMIT ${limit}
  `;

  // Parse vector strings to arrays of numbers
  const parsedEmbeddings: EmbeddingDataPoint[] = embeddings.map((emb) => {
    // pgvector format: "[0.1,0.2,0.3,...]"
    const vectorString = emb.embedding.replace(/^\[|\]$/g, "");
    const embedding = vectorString.split(",").map((v) => parseFloat(v));

    return {
      id: emb.id,
      embedding,
      content: emb.content,
      chunkType: emb.chunkType,
      articleId: emb.articleId,
      articleTitle: emb.articleTitle,
      articleUrl: emb.articleUrl,
      metadata: emb.metadata,
    };
  });

  return parsedEmbeddings;
}

/**
 * Gets a count of embeddings by chunk type
 * Useful for displaying statistics
 *
 * @returns Object with counts by chunk type
 * @example
 * const stats = await getEmbeddingStats();
 * // { full: 500, paragraph: 15000, sentence: 21500, total: 37000 }
 */
export async function getEmbeddingStats(): Promise<{
  full: number;
  paragraph: number;
  sentence: number;
  total: number;
}> {
  const stats = await prisma.$queryRaw<
    Array<{ chunkType: string; count: bigint }>
  >`
    SELECT "chunkType", COUNT(*) as count
    FROM "Embedding"
    GROUP BY "chunkType"
  `;

  const result = {
    full: 0,
    paragraph: 0,
    sentence: 0,
    total: 0,
  };

  for (const stat of stats) {
    const count = Number(stat.count);
    result.total += count;

    if (stat.chunkType === "full") {
      result.full = count;
    } else if (stat.chunkType === "paragraph") {
      result.paragraph = count;
    } else if (stat.chunkType === "sentence") {
      result.sentence = count;
    }
  }

  return result;
}
