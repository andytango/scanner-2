/**
 * Hacker News API client using Node.js built-in fetch
 */

import type { HnItem } from "./types";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";

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
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (doubles on each retry)
 * @returns Result of the function
 * @throws Error if all retries are exhausted
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(
          `Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`
        );
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Fetch an item from the HN API
 *
 * @param id - HN item ID
 * @returns Item data or null if not found
 * @throws Error if the request fails after retries
 */
export async function fetchItem(id: number): Promise<HnItem | null> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch item ${id}: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as HnItem | null;
    return data;
  });
}

/**
 * Fetch the list of new story IDs
 *
 * @returns Array of story IDs (up to 500)
 * @throws Error if the request fails after retries
 */
export async function fetchNewStories(): Promise<number[]> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${HN_API_BASE}/newstories.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch new stories: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as number[];
    return data;
  });
}

/**
 * Fetch the list of top story IDs
 *
 * @returns Array of story IDs (up to 500)
 * @throws Error if the request fails after retries
 */
export async function fetchTopStories(): Promise<number[]> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${HN_API_BASE}/topstories.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch top stories: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as number[];
    return data;
  });
}

/**
 * Fetch the list of best story IDs
 *
 * @returns Array of story IDs (up to 500)
 * @throws Error if the request fails after retries
 */
export async function fetchBestStories(): Promise<number[]> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${HN_API_BASE}/beststories.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch best stories: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as number[];
    return data;
  });
}

/**
 * Fetch the maximum item ID
 *
 * @returns Maximum item ID
 * @throws Error if the request fails after retries
 */
export async function fetchMaxItem(): Promise<number> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${HN_API_BASE}/maxitem.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch max item: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as number;
    return data;
  });
}
