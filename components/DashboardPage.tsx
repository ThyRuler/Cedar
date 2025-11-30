
import React from 'react';
import { Transaction, BudgetSummaryData } from '../types';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import BudgetSummary from './BudgetSummary';

interface DashboardPageProps {
    transactions: Transaction[];
    budgetSummary: BudgetSummaryData;
    onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ transactions, budgetSummary, onAddTransaction }) => {
    return (
        <div className="space-y-6">
            <BudgetSummary summary={budgetSummary} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <TransactionForm onAddTransaction={onAddTransaction} />
                </div>
                <div className="lg:col-span-2">
                    <TransactionList transactions={transactions} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
