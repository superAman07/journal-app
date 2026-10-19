-- CreateTable
CREATE TABLE "saved_ai_chats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tradeId" TEXT,
    "messages" JSONB NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_ai_chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_ai_chats_userId_createdAt_idx" ON "saved_ai_chats"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "saved_ai_chats" ADD CONSTRAINT "saved_ai_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
