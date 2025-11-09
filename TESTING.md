# Testing Guide for HN Scanner

## Pre-requisites

Before testing, ensure Docker is running:

```bash
# Check if Docker is running
docker ps

# If not running, start Docker Desktop or OrbStack
```

## Step-by-Step Testing

### 1. Start the Database

```bash
# Start PostgreSQL with pgvector
docker compose up -d

# Verify it's running
docker compose ps

# Expected output: postgres container should be "running"
```

### 2. Run Database Migrations

```bash
# Create all tables
pnpm run db:migrate

# This creates: HnStory, HnComment, ScrapedArticle, Embedding, Task tables
```

### 3. Test Fetching Stories (Small Test)

```bash
# Fetch just 5 stories to test the system
pnpm run fetch-stories -- --count=5
```

**Expected output:**

- Console log showing stories being fetched
- Number of stories and comments fetched
- Any errors encountered

### 4. Verify Data in Database

```bash
# Open Prisma Studio to view data
pnpm run db:studio

# Or use psql
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner
```

**SQL queries to run:**

```sql
-- Check how many stories were fetched
SELECT COUNT(*) FROM "HnStory";

-- View the stories
SELECT id, title, score, by, descendants
FROM "HnStory"
ORDER BY time DESC
LIMIT 10;

-- Check how many comments were fetched
SELECT COUNT(*) FROM "HnComment";

-- View top-level comments
SELECT id, LEFT(text, 50) as text_preview, by, parent
FROM "HnComment"
LIMIT 10;

-- Check which stories have external URLs
SELECT id, title, url
FROM "HnStory"
WHERE url IS NOT NULL
LIMIT 10;

-- Check ScrapedArticle records (should be created automatically)
SELECT COUNT(*) FROM "ScrapedArticle";
SELECT id, url, status
FROM "ScrapedArticle"
LIMIT 10;

-- Check task tracking
SELECT id, type, status, "startedAt", "completedAt"
FROM "Task"
ORDER BY "createdAt" DESC;
```

### 5. Test Article Scraping (Small Test)

```bash
# Scrape just 3 articles to test
pnpm run scrape-articles -- --limit=3
```

**Expected output:**

- URLs being scraped
- Success/failure status for each
- Summary of scraped vs failed articles

**Verify in database:**

```sql
-- Check scraping results
SELECT url, status, LENGTH(content) as content_length, title
FROM "ScrapedArticle"
WHERE status = 'success'
LIMIT 5;

-- Check for failures
SELECT url, status, error
FROM "ScrapedArticle"
WHERE status = 'failed'
LIMIT 5;

-- See which domains were scraped
SELECT
    SUBSTRING(url FROM 'https?://([^/]+)') as domain,
    COUNT(*) as count,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful
FROM "ScrapedArticle"
GROUP BY domain
ORDER BY count DESC;
```

### 6. Test Embeddings Generation (Small Test)

```bash
# Generate embeddings for 2 articles
pnpm run generate-embeddings -- --limit=2
```

**Expected output:**

- Model loading message (first time only)
- Chunking progress
- Embedding generation progress per chunk
- Total embeddings created

**Verify in database:**

```sql
-- Check embedding counts
SELECT COUNT(*) FROM "Embedding";

-- Check embeddings by type
SELECT "chunkType", COUNT(*) as count
FROM "Embedding"
GROUP BY "chunkType";

-- View embedding metadata
SELECT
    id,
    "chunkType",
    LEFT(content, 50) as content_preview,
    metadata
FROM "Embedding"
LIMIT 10;

-- Check which articles have embeddings
SELECT
    sa.id,
    sa.title,
    COUNT(e.id) as embedding_count
FROM "ScrapedArticle" sa
LEFT JOIN "Embedding" e ON e."articleId" = sa.id
GROUP BY sa.id, sa.title
ORDER BY embedding_count DESC
LIMIT 10;
```

### 7. Test Full Pipeline (Minimal)

```bash
# Run the entire pipeline with small limits
pnpm run run-pipeline -- --count=3 --scrape-limit=2 --embedding-limit=1
```

**Expected output:**

- Step 1: Stories and comments fetched
- Step 2: Articles scraped
- Step 3: Embeddings generated
- Final summary with statistics

### 8. Performance Testing

After the basic tests work, try larger volumes:

```bash
# Fetch last hour of stories
pnpm run run-pipeline -- --hours=1

# Or fetch specific counts
pnpm run run-pipeline -- --count=30 --scrape-limit=10 --embedding-limit=5
```

## Debugging Queries

### Check Overall System Status

```sql
-- Overall statistics
SELECT
    (SELECT COUNT(*) FROM "HnStory") as total_stories,
    (SELECT COUNT(*) FROM "HnComment") as total_comments,
    (SELECT COUNT(*) FROM "ScrapedArticle" WHERE status = 'success') as scraped_articles,
    (SELECT COUNT(*) FROM "ScrapedArticle" WHERE status = 'failed') as failed_articles,
    (SELECT COUNT(*) FROM "ScrapedArticle" WHERE status = 'pending') as pending_articles,
    (SELECT COUNT(*) FROM "Embedding") as total_embeddings;
```

### Find Issues

```sql
-- Find stories with no comments
SELECT id, title, descendants
FROM "HnStory"
WHERE descendants > 0
  AND id NOT IN (SELECT DISTINCT "storyId" FROM "HnComment" WHERE "storyId" IS NOT NULL)
LIMIT 10;

-- Find articles that failed to scrape
SELECT url, error
FROM "ScrapedArticle"
WHERE status = 'failed'
ORDER BY "fetchedAt" DESC
LIMIT 10;

-- Find articles without embeddings
SELECT sa.id, sa.url, sa.title
FROM "ScrapedArticle" sa
LEFT JOIN "Embedding" e ON e."articleId" = sa.id
WHERE sa.status = 'success'
  AND sa.content IS NOT NULL
  AND e.id IS NULL
LIMIT 10;

-- Check task failures
SELECT type, status, error, metadata
FROM "Task"
WHERE status = 'failed'
ORDER BY "createdAt" DESC;
```

### Data Quality Checks

```sql
-- Check for duplicate stories
SELECT id, COUNT(*) as count
FROM "HnStory"
GROUP BY id
HAVING COUNT(*) > 1;

-- Check content lengths
SELECT
    AVG(LENGTH(content)) as avg_length,
    MIN(LENGTH(content)) as min_length,
    MAX(LENGTH(content)) as max_length
FROM "ScrapedArticle"
WHERE status = 'success' AND content IS NOT NULL;

-- Check embedding distribution
SELECT
    "chunkType",
    AVG(LENGTH(content)) as avg_chunk_length,
    MIN(LENGTH(content)) as min_chunk_length,
    MAX(LENGTH(content)) as max_chunk_length
FROM "Embedding"
GROUP BY "chunkType";
```

## Common Issues

### Issue: No stories fetched

**Diagnosis:**

```sql
SELECT * FROM "Task" WHERE type = 'fetch-stories' ORDER BY "createdAt" DESC LIMIT 1;
```

**Possible causes:**

- Network connectivity issues
- HN API rate limiting
- All stories already in database (check with `SELECT COUNT(*) FROM "HnStory"`)

### Issue: Articles fail to scrape

**Diagnosis:**

```sql
SELECT url, error FROM "ScrapedArticle" WHERE status = 'failed' LIMIT 10;
```

**Common errors:**

- Timeout (increase timeout in scraper.ts)
- Blocked by robots.txt (expected for some sites)
- 403/404 errors (dead links)
- Paywall sites

### Issue: Embeddings not created

**Diagnosis:**

```sql
-- Check if model is loading
SELECT * FROM "Task" WHERE type = 'generate-embeddings' ORDER BY "createdAt" DESC LIMIT 1;

-- Check if there's content to embed
SELECT COUNT(*) FROM "ScrapedArticle"
WHERE status = 'success' AND content IS NOT NULL;
```

**Possible causes:**

- Model download taking time (first run)
- Out of memory (reduce batch size)
- No successfully scraped articles

## Expected Timings

- **Fetching 10 stories**: ~10-30 seconds (depending on comment count)
- **Scraping 10 articles**: ~30-60 seconds (1s delay between requests)
- **Generating embeddings for 1 article**: ~5-30 seconds (model load + chunking + embedding)

## Clean Up

To reset and start fresh:

```bash
# Stop and remove database (deletes all data)
docker compose down -v

# Start fresh
docker compose up -d
pnpm run db:migrate
```

## Next Steps After Successful Testing

1. **Implement Vector Search**: Add SQL queries using pgvector for semantic search
2. **Add Cron Jobs**: Schedule periodic fetching
3. **Build API**: Expose search functionality via Next.js API routes
4. **Add UI**: Create a web interface for browsing and searching
