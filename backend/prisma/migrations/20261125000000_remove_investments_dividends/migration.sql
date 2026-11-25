-- Drop foreign keys
ALTER TABLE IF EXISTS "dividends" DROP CONSTRAINT IF EXISTS "dividends_holdingId_fkey";
ALTER TABLE IF EXISTS "dividends" DROP CONSTRAINT IF EXISTS "dividends_userId_fkey";
ALTER TABLE IF EXISTS "investment_transactions" DROP CONSTRAINT IF EXISTS "investment_transactions_holdingId_fkey";
ALTER TABLE IF EXISTS "investment_transactions" DROP CONSTRAINT IF EXISTS "investment_transactions_userId_fkey";
ALTER TABLE IF EXISTS "investment_holdings" DROP CONSTRAINT IF EXISTS "investment_holdings_userId_fkey";

-- Drop index
DROP INDEX IF EXISTS "investment_holdings_userId_symbol_key";

-- Drop tables
DROP TABLE IF EXISTS "dividends";
DROP TABLE IF EXISTS "investment_transactions";
DROP TABLE IF EXISTS "investment_holdings";

-- Drop enums
DROP TYPE IF EXISTS "LotType";
DROP TYPE IF EXISTS "InvestmentType";
