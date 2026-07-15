-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "finance_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
