-- CreateTable
CREATE TABLE "strategy_rule_compliance" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "ruleText" TEXT NOT NULL,
    "followed" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "strategy_rule_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "strategy_rule_compliance_tradeId_idx" ON "strategy_rule_compliance"("tradeId");

-- AddForeignKey
ALTER TABLE "strategy_rule_compliance" ADD CONSTRAINT "strategy_rule_compliance_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
