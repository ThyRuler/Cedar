export enum Currency {
  LBP = 'LBP',
  FRESH_USD = 'Fresh USD',
  LOLLAR = 'Lollar',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum ExpenseCategory {
  RENT_HOUSING = 'Rent/Housing',
  GENERATOR_FUEL = 'Generator/Fuel',
  GROCERIES = 'Groceries',
  MEDICINE = 'Medicine',
  EDUCATION = 'Education (Tuition)',
  DINING_OUT = 'Dining Out/Coffee',
  SHOPPING = 'Shopping/Retail',
  ENTERTAINMENT = 'Entertainment',
  TRANSPORT = 'Car Maintenance/Transport',
  TELECOM_INTERNET = 'Telecom/Internet',
}

export enum IncomeCategory {
  SALARY_USD = 'Salary (Fresh USD)',
  SALARY_LBP = 'Salary (LBP)',
  REMITTANCE = 'Remittance',
  FREELANCE = 'Freelance Income',
  OTHER = 'Other',
}

export type Transaction = {
  id: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  date: Date;
};

export type BudgetSummaryData = {
    totalIncome: number;
    totalExpenses: number;
    remainingBudget: number;
    topExpenses: { category: string; amount: number }[];
};

// FIX: Add ChatMessage type definition to resolve missing export error.
export type ChatMessage = {
  id: string;
  sender: 'user' | 'cedar';
  text: string;
  groundingChunks?: any[];
  isParsing?: boolean;
  parsedTransaction?: Omit<Transaction, 'id' | 'date'>;
};
