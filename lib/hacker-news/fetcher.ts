/**
 * Hacker News data fetcher with database persistence
 */

import { prisma } from "../database";
import { fetchItem, fetchNewStories } from "./api";
import type { FetchOptions, FetchResult, HnItem } from "./types";

/**
 * Recursively fetch comments for a story
 *
 * @param commentIds - Array of comment IDs to fetch
 * @param depth - Current depth in the comment tree
 * @param maxDepth - Maximum depth to fetch
 * @returns Array of fetched comments
 */
async function fetchComments(
  commentIds: number[],
  depth = 0,
  maxDepth = Infinity
): Promise<HnItem[]> {
  if (depth >= maxDepth || commentIds.length === 0) {
    return [];
  }

  const comments: HnItem[] = [];

  for (const commentId of commentIds) {
    try {
      const comment = await fetchItem(commentId);

      if (comment !== null && comment.type === "comment") {
        comments.push(comment);

        // Recursively fetch child comments
        if (comment.kids !== undefined && comment.kids.length > 0) {
          const childComments = await fetchComments(
            comment.kids,
            depth + 1,
            maxDepth
          );
          comments.push(...childComments);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch comment ${commentId}:`, error);
    }
  }

  return comments;
}

/**
 * Filter story IDs based on time window or count
 *
 * @param storyIds - Array of story IDs
 * @param options - Fetch options (hours or count)
 * @returns Filtered array of story IDs
 */
async function filterStoryIds(
  storyIds: number[],
  options: FetchOptions
): Promise<number[]> {
  // If count is specified, just take the first N stories
  if (options.count !== undefined) {
    return storyIds.slice(0, options.count);
  }

  // If hours is specified, filter by timestamp
  if (options.hours !== undefined) {
    const cutoffTime = Math.floor(Date.now() / 1000) - options.hours * 3600;
    const filtered: number[] = [];

    for (const storyId of storyIds) {
      try {
        const story = await fetchItem(storyId);

        if (story !== null && story.time >= cutoffTime) {
          filtered.push(storyId);
        } else if (story !== null && story.time < cutoffTime) {
          // Stories are ordered by recency, so we can stop here
          break;
        }
      } catch (error) {
        console.error(`Failed to check timestamp for story ${storyId}:`, error);
      }
    }

    return filtered;
  }

  // Default: last 24 hours
  const cutoffTime = Math.floor(Date.now() / 1000) - 24 * 3600;
  const filtered: number[] = [];

  for (const storyId of storyIds) {
    try {
      const story = await fetchItem(storyId);

      if (story !== null && story.time >= cutoffTime) {
        filtered.push(storyId);
      } else if (story !== null && story.time < cutoffTime) {
        break;
      }
    } catch (error) {
      console.error(`Failed to check timestamp for story ${storyId}:`, error);
    }
  }

  return filtered;
}

/**
 * Check if a story already exists in the database
 *
 * @param storyId - Story ID to check
 * @returns True if the story exists
 */
async function storyExists(storyId: number): Promise<boolean> {
  const existing = await prisma.hnStory.findUnique({
    where: { id: storyId },
    select: { id: true },
  });

  return existing !== null;
}

/**
 * Check if a comment already exists in the database
 *
 * @param commentId - Comment ID to check
 * @returns True if the comment exists
 */
async function commentExists(commentId: number): Promise<boolean> {
  const existing = await prisma.hnComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  return existing !== null;
}

/**
 * Persist a story to the database
 *
 * @param story - Story item to persist
 */
async function persistStory(story: HnItem): Promise<void> {
  await prisma.hnStory.upsert({
    where: { id: story.id },
    create: {
      id: story.id,
      title: story.title ?? null,
      url: story.url ?? null,
      text: story.text ?? null,
      score: story.score ?? null,
      by: story.by ?? null,
      time: story.time,
      descendants: story.descendants ?? 0,
      deleted: story.deleted ?? false,
      dead: story.dead ?? false,
    },
    update: {
      title: story.title ?? null,
      url: story.url ?? null,
      text: story.text ?? null,
      score: story.score ?? null,
      by: story.by ?? null,
      descendants: story.descendants ?? 0,
      deleted: story.deleted ?? false,
      dead: story.dead ?? false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Persist a comment to the database
 *
 * @param comment - Comment item to persist
 * @param storyId - Story ID this comment belongs to
 */
async function persistComment(comment: HnItem, storyId: number): Promise<void> {
  await prisma.hnComment.upsert({
    where: { id: comment.id },
    create: {
      id: comment.id,
      text: comment.text ?? null,
      by: comment.by ?? null,
      time: comment.time,
      parent: comment.parent ?? null,
      storyId: storyId,
      deleted: comment.deleted ?? false,
      dead: comment.dead ?? false,
    },
    update: {
      text: comment.text ?? null,
      by: comment.by ?? null,
      parent: comment.parent ?? null,
      deleted: comment.deleted ?? false,
      dead: comment.dead ?? false,
      updatedAt: new Date(),
    },
  });
}

/**
 * Fetch and persist HN stories and comments
 *
 * @param options - Fetch options (hours or count)
 * @returns Fetch result with statistics
 * @throws Error if the fetch fails
 *
 * @example
 * // Fetch stories from the last 24 hours (default)
 * const result = await fetchAndPersistStories({});
 *
 * @example
 * // Fetch stories from the last 12 hours
 * const result = await fetchAndPersistStories({ hours: 12 });
 *
 * @example
 * // Fetch the latest 50 stories
 * const result = await fetchAndPersistStories({ count: 50 });
 */
export async function fetchAndPersistStories(
  options: FetchOptions = {}
): Promise<FetchResult> {
  console.log("Fetching new story IDs from HN API...");
  const allStoryIds = await fetchNewStories();

  console.log(`Found ${allStoryIds.length} story IDs. Filtering...`);
  const storyIds = await filterStoryIds(allStoryIds, options);

  console.log(`Processing ${storyIds.length} stories...`);

  const result: FetchResult = {
    stories: [],
    comments: [],
    skipped: 0,
    errors: [],
  };

  for (const storyId of storyIds) {
    try {
      // Check if story already exists
      if (await storyExists(storyId)) {
        console.log(`Story ${storyId} already exists, skipping...`);
        result.skipped++;
        continue;
      }

      // Fetch story
      const story = await fetchItem(storyId);

      if (story?.type !== "story") {
        console.log(`Item ${storyId} is not a story, skipping...`);
        continue;
      }

      console.log(`Fetched story ${storyId}: ${story.title ?? "Untitled"}`);

      // Persist story
      await persistStory(story);
      result.stories.push(story);

      // Create ScrapedArticle record if story has a URL
      if (story.url !== undefined) {
        // Check if a ScrapedArticle with this URL already exists
        const existingArticle = await prisma.scrapedArticle.findUnique({
          where: { url: story.url },
        });

        // Only create if it doesn't exist
        if (existingArticle === null) {
          await prisma.scrapedArticle.create({
            data: {
              url: story.url,
              storyId: story.id,
              status: "pending",
            },
          });
        }
      }

      // Fetch and persist comments
      if (story.kids !== undefined && story.kids.length > 0) {
        console.log(
          `Fetching ${story.kids.length} top-level comments for story ${storyId}...`
        );

        const comments = await fetchComments(
          story.kids,
          0,
          options.maxCommentDepth
        );

        console.log(`Fetched ${comments.length} comments for story ${storyId}`);

        for (const comment of comments) {
          // Skip if comment already exists
          if (await commentExists(comment.id)) {
            continue;
          }

          await persistComment(comment, storyId);
        }

        result.comments.push(...comments);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Failed to process story ${storyId}:`, errorMessage);
      result.errors.push({ id: storyId, error: errorMessage });
    }
  }

  return result;
}
