/**
 * Text chunking functionality using LangChain
 */

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Chunk types
 */
export type ChunkType = "full" | "paragraph" | "sentence";

/**
 * Text chunk with metadata
 */
export interface TextChunk {
  content: string;
  chunkType: ChunkType;
  index: number;
  totalChunks: number;
}

/**
 * Chunk text at multiple granularities
 *
 * Creates chunks at three levels:
 * 1. Full text (single chunk)
 * 2. Paragraphs (using RecursiveCharacterTextSplitter)
 * 3. Sentences (smaller chunks for fine-grained search)
 *
 * @param text - Text to chunk
 * @returns Array of text chunks with metadata
 *
 * @example
 * const chunks = await chunkText(article.content);
 * for (const chunk of chunks) {
 *   console.log(chunk.chunkType, chunk.content.slice(0, 50));
 * }
 */
export async function chunkText(text: string): Promise<TextChunk[]> {
  const chunks: TextChunk[] = [];

  // 1. Full text chunk
  chunks.push({
    content: text,
    chunkType: "full",
    index: 0,
    totalChunks: 1,
  });

  // 2. Paragraph-level chunks
  const paragraphSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const paragraphChunks = await paragraphSplitter.splitText(text);

  for (let i = 0; i < paragraphChunks.length; i++) {
    const chunk = paragraphChunks[i];
    if (chunk !== undefined) {
      chunks.push({
        content: chunk,
        chunkType: "paragraph",
        index: i,
        totalChunks: paragraphChunks.length,
      });
    }
  }

  // 3. Sentence-level chunks
  const sentenceSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
    separators: [". ", "! ", "? ", "; ", ", ", " ", ""],
  });

  const sentenceChunks = await sentenceSplitter.splitText(text);

  for (let i = 0; i < sentenceChunks.length; i++) {
    const chunk = sentenceChunks[i];
    if (chunk !== undefined) {
      chunks.push({
        content: chunk,
        chunkType: "sentence",
        index: i,
        totalChunks: sentenceChunks.length,
      });
    }
  }

  return chunks;
}
