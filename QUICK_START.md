# Quick Start - Test the HN Scanner

## Start Docker First

Since Docker/OrbStack isn't currently running, you'll need to start it:

1. **Start OrbStack** (or Docker Desktop)
2. Wait for it to be ready
3. Then run the commands below

## Test Commands (Run These in Order)

```bash
# 1. Start the database
docker compose up -d

# 2. Verify database is running
docker compose ps
# Expected: hn-scanner-postgres should show "running"

# 3. Run migrations to create tables
pnpm run db:migrate

# 4. Test fetch (just 3 stories to start)
pnpm run fetch-stories -- --count=3

# 5. Check what was fetched
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner -c "SELECT COUNT(*) as story_count FROM \"HnStory\";"
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner -c "SELECT COUNT(*) as comment_count FROM \"HnComment\";"
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner -c "SELECT id, title, score FROM \"HnStory\" LIMIT 3;"

# 6. Test scraping (just 2 articles)
pnpm run scrape-articles -- --limit=2

# 7. Check scraping results
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner -c "SELECT url, status, LENGTH(content) as content_length FROM \"ScrapedArticle\" LIMIT 5;"

# 8. Test embeddings (just 1 article)
pnpm run generate-embeddings -- --limit=1

# 9. Check embeddings
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner -c "SELECT \"chunkType\", COUNT(*) FROM \"Embedding\" GROUP BY \"chunkType\";"

# 10. View all stats
docker exec -it hn-scanner-postgres psql -U postgres -d hn_scanner -c "
SELECT
    (SELECT COUNT(*) FROM \"HnStory\") as stories,
    (SELECT COUNT(*) FROM \"HnComment\") as comments,
    (SELECT COUNT(*) FROM \"ScrapedArticle\" WHERE status = 'success') as scraped,
    (SELECT COUNT(*) FROM \"Embedding\") as embeddings;
"
```

## Alternative: Use Prisma Studio (Visual Interface)

```bash
# Open Prisma Studio to browse data visually
pnpm run db:studio
```

Then open http://localhost:5555 in your browser.

## If Everything Works

You should see:

- ✅ 3 stories fetched with their comments
- ✅ 2 articles scraped (or pending if no URLs)
- ✅ 1 article with embeddings at 3 levels (full, paragraph, sentence)
- ✅ Task records tracking each operation

## Clean Up When Done

```bash
# Stop the database
docker compose down

# Or stop and delete all data
docker compose down -v
```

## What to Look For

1. **Stories**: Should have title, url (maybe), score, author
2. **Comments**: Should be linked to stories via storyId
3. **Articles**: Check status - "success" means content was extracted
4. **Embeddings**: Should have 3 types per article (full, paragraph, sentence)
5. **Tasks**: All should show status "completed" if successful
