
import React from 'react';
import { BudgetSummaryData } from '../types';
import { LBP_TO_USD_RATE } from '../constants';

interface BudgetSummaryProps {
    summary: BudgetSummaryData;
}

const StatCard: React.FC<{ title: string; amount: number; colorClass: string }> = ({ title, amount, colorClass }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</h3>
        <p className={`mt-1 text-3xl font-semibold ${colorClass}`}>
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
            ~ LBP {(amount * LBP_TO_USD_RATE).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
    </div>
);

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ summary }) => {
    return (
        <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Budget Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <StatCard title="Total Income" amount={summary.totalIncome} colorClass="text-green-500" />
                <StatCard title="Total Expenses" amount={summary.totalExpenses} colorClass="text-red-500" />
                <StatCard 
                    title="Remaining Budget" 
                    amount={summary.remainingBudget} 
                    colorClass={summary.remainingBudget >= 0 ? 'text-blue-500' : 'text-orange-500'}
                />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Top Spending Categories</h3>
                {summary.topExpenses.length > 0 ? (
                    <ul className="space-y-2">
                        {summary.topExpenses.map(({ category, amount }) => (
                            <li key={category} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                <span className="font-medium text-gray-600 dark:text-gray-300">{category}</span>
                                <span className="font-semibold text-red-500">
                                    ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses logged yet.</p>
                )}
            </div>
        </div>
    );
};

export default BudgetSummary;
