/**
 * Embedding generation using Transformers.js
 */

import {
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";

let embeddingPipeline: FeatureExtractionPipeline | null = null;

/**
 * Initialize the embedding pipeline
 *
 * This loads the model on first use. The model is cached for subsequent calls.
 *
 * @returns Initialized feature extraction pipeline
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
  if (embeddingPipeline === null) {
    console.log("Loading embedding model (Xenova/all-MiniLM-L6-v2)...");
    // @ts-expect-error - Transformers.js has complex union types
    embeddingPipeline = (await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    )) as FeatureExtractionPipeline;
    console.log("✓ Embedding model loaded");
  }

  return embeddingPipeline;
}

/**
 * Generate embedding vector for a single text
 *
 * @param text - Text to embed
 * @returns 384-dimensional embedding vector
 *
 * @example
 * const embedding = await generateEmbedding("Hello world");
 * console.log(embedding.length); // 384
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();

  const result = await pipe(text, {
    pooling: "mean",
    normalize: true,
  });

  // Extract the embedding array from the result
  const embedding = Array.from(result.data as Float32Array);

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * This is more efficient than calling generateEmbedding multiple times.
 *
 * @param texts - Array of texts to embed
 * @returns Array of 384-dimensional embedding vectors
 *
 * @example
 * const embeddings = await generateEmbeddingsBatch(["Hello", "World"]);
 * console.log(embeddings.length); // 2
 * console.log(embeddings[0].length); // 384
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();

  const result = await pipe(texts, {
    pooling: "mean",
    normalize: true,
  });

  // Convert to array of arrays
  const embeddings: number[][] = [];
  const data = result.data as Float32Array;
  const embeddingSize = 384;

  for (let i = 0; i < texts.length; i++) {
    const start = i * embeddingSize;
    const end = start + embeddingSize;
    embeddings.push(Array.from(data.slice(start, end)));
  }

  return embeddings;
}
