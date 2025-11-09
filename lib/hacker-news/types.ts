/**
 * Hacker News API types
 */

/**
 * HN item types
 */
export type HnItemType = "story" | "comment" | "job" | "poll" | "pollopt";

/**
 * Raw item from HN API
 */
export interface HnItem {
  id: number;
  deleted?: boolean;
  type?: HnItemType;
  by?: string;
  time: number;
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

/**
 * Fetch options for HN stories
 */
export interface FetchOptions {
  /**
   * Number of hours to look back (mutually exclusive with count)
   */
  hours?: number;

  /**
   * Number of items to fetch (mutually exclusive with hours)
   */
  count?: number;

  /**
   * Maximum depth for comment fetching
   * @default Infinity (fetch all comments)
   */
  maxCommentDepth?: number;
}

/**
 * Result of fetching HN data
 */
export interface FetchResult {
  stories: HnItem[];
  comments: HnItem[];
  skipped: number;
  errors: Array<{ id: number; error: string }>;
}
