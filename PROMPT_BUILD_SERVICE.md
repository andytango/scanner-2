Implement the following features:

1. Design a schema that can ingest posts, comments and scraped articles from the hacker news API. We want this to serve as a cache and a way to diagnose any issues with downstream processing. You will implement this using prisma.
2. Implement a service that can retrieves content from the hacker news API and persists it in the database. It should work on the basis of a time window OR number of items, so most recent N days or N items. The service should only retrieve items that are not already in the database.
3. Implement a service that can generate vector embeddings for the scraped articles using transformers-js. You will need to design a schema for this. Bear in mind that we will want to split the articles into chunks of different sizes - you will want an embedding for the entire article, then each paragraph, and each sentence.

Put each service in its own directory in the "lib" folder, so "lib/database", "lib/hacker-news", "lib/scraping", "lib/processing"
