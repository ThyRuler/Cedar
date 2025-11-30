
import React, { useState, useMemo } from 'react';
import { Transaction, BudgetSummaryData, TransactionType, Currency } from './types';
import { LBP_TO_USD_RATE } from './constants';
import DashboardPage from './components/DashboardPage';

const App: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const handleAddTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
        const newTx: Transaction = {
            ...tx,
            id: self.crypto.randomUUID(),
            date: new Date(),
        };
        setTransactions(prev => [...prev, newTx].sort((a, b) => b.date.getTime() - a.date.getTime()));
    };

    const budgetSummary: BudgetSummaryData = useMemo(() => {
        let totalIncome = 0;
        let totalExpenses = 0;
        const expenseByCategory: { [key: string]: number } = {};

        transactions.forEach(tx => {
            let amountInUsd = tx.amount;
            if (tx.currency === Currency.LBP) {
                amountInUsd /= LBP_TO_USD_RATE;
            }
            // 'Lollar' is treated 1:1 with USD for simplicity in this context
            
            if (tx.type === TransactionType.INCOME) {
                totalIncome += amountInUsd;
            } else {
                totalExpenses += amountInUsd;
                expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + amountInUsd;
            }
        });

        const topExpenses = Object.entries(expenseByCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category, amount]) => ({ category, amount }));

        return {
            totalIncome,
            totalExpenses,
            remainingBudget: totalIncome - totalExpenses,
            topExpenses,
        };
    }, [transactions]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <DashboardPage
                        transactions={transactions}
                        budgetSummary={budgetSummary}
                        onAddTransaction={handleAddTransaction}
                    />
                </div>
            </main>
        </div>
    );
};

export default App;