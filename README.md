# Hacker News Scanner

A comprehensive Hacker News scraper with vector embeddings for semantic search.

## Features

- 📰 **Fetch HN Stories & Comments** - Retrieve content from the Hacker News API with time-based or count-based filtering
- 🌐 **Article Scraping** - Extract full content from external URLs with robots.txt compliance
- 🔍 **Vector Embeddings** - Generate semantic embeddings at multiple granularities (full text, paragraphs, sentences)
- 🗄️ **Database Persistence** - Store all data in PostgreSQL with pgvector support
- 📊 **Progress Tracking** - Real-time progress bars with ETA for long-running operations
- 🛠️ **CLI Tools** - Easy-to-use command-line scripts for all operations
- 📜 **Historical Data** - Fetch and process historical HN data going back 90+ days

## Prerequisites

- **Node.js** 18+ (for built-in fetch support)
- **pnpm** (package manager)
- **Docker** (for PostgreSQL with pgvector)

## Installation

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

This starts a PostgreSQL 17 container with the pgvector extension for vector similarity search on port 5433.

### 3. Set Up Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5433/hn_scanner`)

### 4. Run Database Migrations

```bash
pnpm run db:migrate
```

This creates all necessary tables: `HnStory`, `HnComment`, `ScrapedArticle`, and `ArticleEmbedding`.

### 5. Verify Setup

```bash
# Check that the database is running
docker-compose ps

# Generate Prisma client (if needed)
pnpm run db:generate
```

## Available Scripts

### Full Pipeline

Run the complete pipeline (fetch stories, scrape articles, generate embeddings):

```bash
pnpm run run-pipeline
```

**Options:**

- `--hours=N` - Fetch stories from the last N hours (default: 24)
- `--count=N` - Fetch a specific number of stories instead of using hours
- `--scrape-limit=N` - Limit the number of articles to scrape
- `--embedding-limit=N` - Limit the number of articles to generate embeddings for
- `--embedding-concurrency=N` - Number of parallel embedding generation tasks (default: 5)

**Examples:**

```bash
# Fetch last 6 hours of stories and process everything
pnpm run run-pipeline -- --hours=6

# Fetch 100 stories with 10x embedding concurrency
pnpm run run-pipeline -- --count=100 --embedding-concurrency=10

# Fetch stories with limits on scraping and embeddings
pnpm run run-pipeline -- --hours=12 --scrape-limit=50 --embedding-limit=50
```

### Historical Data Collection

Fetch historical Hacker News data by iterating backwards through story IDs:

```bash
pnpm tsx scripts/fetch-historical-stories.ts --days=90
```

**Features:**

- Fetches stories from the last N days
- Progress bar with ETA
- Automatic article scraping and embedding generation
- Error logging to `fetch-historical-stories.log`

**Options:**

- `--days=N` - Number of days to go back (default: 30)
- `--limit=N` - Maximum number of stories to fetch
- `--batch-size=N` - Number of IDs to check per batch (default: 100)
- `--concurrency=N` - Number of parallel API requests (default: 10)
- `--delay=N` - Delay in ms between batches (default: 1000)

**Examples:**

```bash
# Fetch last 90 days of HN data
pnpm tsx scripts/fetch-historical-stories.ts --days=90

# Fetch 30 days with custom settings
pnpm tsx scripts/fetch-historical-stories.ts --days=30 --batch-size=50 --concurrency=5

# Fetch with a story limit
pnpm tsx scripts/fetch-historical-stories.ts --days=7 --limit=1000
```

### Individual Pipeline Steps

Run pipeline steps independently:

**1. Fetch Stories Only:**

```bash
pnpm tsx scripts/fetch-stories.ts --hours=24
# or
pnpm tsx scripts/fetch-stories.ts --count=100
```

**2. Scrape Articles Only:**

```bash
pnpm tsx scripts/scrape-articles.ts
# or with limit
pnpm tsx scripts/scrape-articles.ts --limit=50
```

**3. Generate Embeddings Only:**

```bash
pnpm tsx scripts/generate-embeddings.ts
# or with concurrency
pnpm tsx scripts/generate-embeddings.ts --concurrency=10 --limit=100
```

### Scheduled Collection

To run the pipeline on a schedule, you can use cron:

```bash
# Run every 6 hours
0 */6 * * * cd /path/to/scanner-2 && pnpm run run-pipeline -- --hours=6 >> pipeline.log 2>&1

# Run daily at midnight
0 0 * * * cd /path/to/scanner-2 && pnpm run run-pipeline -- --hours=24 >> pipeline.log 2>&1
```

## Database Schema

The project uses PostgreSQL with pgvector extension for storing:

### HnStory

Stores Hacker News stories with metadata.

- `id` - Story ID from HN
- `title` - Story title
- `url` - External URL (if any)
- `text` - Story text content
- `score` - Current score
- `by` - Author username
- `time` - Unix timestamp
- `descendants` - Comment count
- `deleted` - Deletion status
- `dead` - Dead status

### HnComment

Stores comment threads with hierarchical relationships.

- `id` - Comment ID from HN
- `text` - Comment content
- `by` - Author username
- `time` - Unix timestamp
- `parent` - Parent comment ID
- `storyId` - Associated story ID
- `deleted` - Deletion status
- `dead` - Dead status

### ScrapedArticle

Stores content fetched from external URLs.

- `id` - Auto-incrementing ID
- `url` - Article URL (unique)
- `title` - Extracted title
- `content` - Extracted text content
- `status` - pending, success, or failed
- `storyId` - Associated HN story

### ArticleEmbedding

Stores vector embeddings for semantic search.

- `id` - Auto-incrementing ID
- `content` - Text chunk
- `embedding` - 384-dimensional vector (pgvector)
- `chunkType` - full, paragraph, or sentence
- `chunkIndex` - Position in article
- `metadata` - Additional chunk information
- `articleId` - Associated article

### Database Management

```bash
# View data in Prisma Studio
pnpm run db:studio

# Create a new migration
pnpm run db:migrate

# Generate Prisma client
pnpm run db:generate

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
pnpm run db:migrate
```

## Development

Start the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Code Quality

Format code:

```bash
pnpm run format
```

Lint code:

```bash
pnpm run lint:fix
```

Type check:

```bash
pnpm run type-check
```

Run all checks:

```bash
pnpm run validate
```

## Project Structure

```
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/
│   ├── database/          # Prisma client and database utilities
│   ├── embeddings/        # Embedding generation logic (Xenova/all-MiniLM-L6-v2)
│   ├── hacker-news/       # HN API client with retry logic
│   └── scraping/          # Web scraping with robots.txt compliance
├── prisma/                # Database schema and migrations
└── scripts/               # CLI scripts for data collection
    ├── fetch-historical-stories.ts  # Historical data fetcher (90+ days)
    ├── fetch-stories.ts            # Fetch recent HN stories
    ├── scrape-articles.ts          # Scrape article content
    ├── generate-embeddings.ts      # Generate embeddings
    └── run-full-pipeline.ts        # Run complete pipeline
```

## Architecture Details

### Hacker News API Client

- **Retry Logic**: Exponential backoff with 3 retry attempts
- **Deduplication**: Checks existing records before fetching
- **Rate Limiting**: Respects HN API best practices
- **Comment Traversal**: Recursively fetches entire comment trees

### Scraping Service

- **Robots.txt Compliance**: Respects robot exclusion rules
- **Content Extraction**: Uses cheerio for HTML parsing
- **Error Handling**: Retries with exponential backoff
- **Timeout Handling**: 30-second timeout per request
- **Rate Limiting**: Configurable delay between requests

### Embeddings Service

- **Model**: Xenova/all-MiniLM-L6-v2 (384 dimensions, 22MB)
- **Chunking**: Uses LangChain's RecursiveCharacterTextSplitter
- **Granularities**:
  - Full text (entire article)
  - Paragraphs (1000 chars, 200 overlap)
  - Sentences (200 chars, 50 overlap)
- **Batch Processing**: Parallel embedding generation with configurable concurrency

## Troubleshooting

### Docker isn't running

```bash
# Start Docker Desktop or OrbStack, then:
docker-compose up -d
```

### Database connection errors

```bash
# Check that PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart the database
docker-compose restart postgres
```

### Prisma client not found

```bash
pnpm run db:generate
```

### Port conflicts

If port 5433 is already in use, edit `docker-compose.yml` to change the port mapping:

```yaml
ports:
  - "5434:5432" # Change 5433 to another port
```

Then update `DATABASE_URL` in `.env` to match.

### Type errors

```bash
# Regenerate Prisma client
pnpm run db:generate

# Run validation
pnpm run validate
```

## Next Steps

### Vector Search Implementation

The database is ready for vector similarity search with pgvector. To implement semantic search:

1. Create search queries using cosine similarity
2. Add API endpoints for search functionality
3. Build a web UI for browsing and searching content

### Additional Features

- **Incremental Updates**: Schedule periodic fetches with cron
- **Search API**: Semantic search over articles
- **Web UI**: Browse and search scraped content
- **Analytics**: Track trending topics and popular stories

## Contributing

Follow the TypeScript Development Guidelines in `CLAUDE.md`:

- Use strict TypeScript with no `any` types
- Add JSDoc comments for all exported functions
- Run `pnpm run validate` before committing
- No `@ts-ignore` or type assertions without validation

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [LangChain Text Splitters](https://js.langchain.com/docs/modules/indexes/text_splitters/)

## License

MIT
