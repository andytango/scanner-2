-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "HnStory" (
    "id" INTEGER NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "text" TEXT,
    "score" INTEGER,
    "by" TEXT,
    "time" INTEGER NOT NULL,
    "descendants" INTEGER DEFAULT 0,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "dead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HnStory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HnComment" (
    "id" INTEGER NOT NULL,
    "text" TEXT,
    "by" TEXT,
    "time" INTEGER NOT NULL,
    "parent" INTEGER,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "dead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyId" INTEGER,

    CONSTRAINT "HnComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapedArticle" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "fetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "ScrapedArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(384),
    "chunkType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" INTEGER NOT NULL,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HnStory_time_idx" ON "HnStory"("time");

-- CreateIndex
CREATE INDEX "HnStory_by_idx" ON "HnStory"("by");

-- CreateIndex
CREATE INDEX "HnStory_createdAt_idx" ON "HnStory"("createdAt");

-- CreateIndex
CREATE INDEX "HnComment_storyId_idx" ON "HnComment"("storyId");

-- CreateIndex
CREATE INDEX "HnComment_parent_idx" ON "HnComment"("parent");

-- CreateIndex
CREATE INDEX "HnComment_time_idx" ON "HnComment"("time");

-- CreateIndex
CREATE INDEX "HnComment_by_idx" ON "HnComment"("by");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedArticle_url_key" ON "ScrapedArticle"("url");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedArticle_storyId_key" ON "ScrapedArticle"("storyId");

-- CreateIndex
CREATE INDEX "ScrapedArticle_status_idx" ON "ScrapedArticle"("status");

-- CreateIndex
CREATE INDEX "ScrapedArticle_fetchedAt_idx" ON "ScrapedArticle"("fetchedAt");

-- CreateIndex
CREATE INDEX "Embedding_articleId_idx" ON "Embedding"("articleId");

-- CreateIndex
CREATE INDEX "Embedding_chunkType_idx" ON "Embedding"("chunkType");

-- CreateIndex
CREATE INDEX "Task_type_idx" ON "Task"("type");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");

-- AddForeignKey
ALTER TABLE "HnComment" ADD CONSTRAINT "HnComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "HnStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapedArticle" ADD CONSTRAINT "ScrapedArticle_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "HnStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ScrapedArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
