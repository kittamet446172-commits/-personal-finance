CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emergencyFundAccountId" TEXT,
    "monthlySalary" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_emergencyFundAccountId_fkey" FOREIGN KEY ("emergencyFundAccountId") REFERENCES "finance_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
