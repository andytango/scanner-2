/**
 * Type declarations for robots-parser
 */

declare module "robots-parser" {
  interface Robot {
    isAllowed(url: string, userAgent?: string): boolean | null;
  }

  function robotsParser(url: string, contents: string): Robot;

  export = robotsParser;
}
