export type AccountType = 'CASH' | 'BANK_ACCOUNT' | 'WALLET'
export type TransactionType = 'INCOME' | 'EXPENSE'
export type InvestmentType = 'STOCK' | 'ETF' | 'MUTUAL_FUND' | 'REIT'
export type LotType = 'BUY' | 'SELL'

export interface User {
  id: string
  name: string
  email: string
  image?: string | null
  createdAt: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  icon?: string
  color?: string
  isDefault: boolean
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string
  type: TransactionType
  amount: number
  date: string
  description?: string
  merchant?: string
  createdAt: string
  category?: Category
  account?: Pick<Account, 'id' | 'name' | 'type'>
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  month: number
  year: number
  category?: Category
  spent: number
  remaining: number
}

export interface Transfer {
  id: string
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  description?: string
  createdAt: string
  fromAccount?: Pick<Account, 'id' | 'name'>
  toAccount?: Pick<Account, 'id' | 'name'>
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MonthlySummary {
  month: number
  year: number
  income: number
  expense: number
  savings: number
  savingsRate: number
}

export interface CategoryBreakdown {
  category?: Pick<Category, 'id' | 'name' | 'icon' | 'color'>
  amount: number
  percentage: number
}

export interface MonthTrend {
  month: number
  income: number
  expense: number
  savings: number
}

export interface YearlyTrend {
  year: number
  months: MonthTrend[]
}

export interface DayBreakdown {
  day: number
  total: number
  categories: CategoryBreakdown[]
}

export interface InvestmentTransaction {
  id: string
  holdingId: string
  type: LotType
  quantity: number
  pricePerUnit: number
  fee: number
  date: string
  note?: string
  createdAt: string
}

export interface Dividend {
  id: string
  holdingId: string
  amount: number
  perShare?: number
  date: string
  note?: string
  createdAt: string
  holding?: { symbol: string; name: string; type: InvestmentType }
}

export interface InvestmentHolding {
  id: string
  symbol: string
  name: string
  type: InvestmentType
  exchange?: string
  sector?: string
  currency: string
  currentPrice: number
  note?: string
  createdAt: string
  updatedAt: string
  transactions: InvestmentTransaction[]
  dividends: Dividend[]
}

export interface PortfolioItem {
  id: string
  symbol: string
  name: string
  type: InvestmentType
  exchange?: string
  sector?: string
  currency: string
  currentPrice: number
  note?: string
  totalQty: number
  avgCost: number
  costBasis: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPct: number
  totalDividends: number
}

export interface PortfolioSummary {
  totalCurrentValue: number
  totalCostBasis: number
  unrealizedGain: number
  unrealizedGainPct: number
  totalDividends: number
}

export interface Portfolio {
  items: PortfolioItem[]
  summary: PortfolioSummary
}
