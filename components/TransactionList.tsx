
import React from 'react';
import { Transaction, Currency } from '../types';
import { LBP_TO_USD_RATE } from '../constants';

interface TransactionListProps {
    transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
    
    const formatCurrency = (amount: number, currency: Currency) => {
        let usdEquivalent: string | null = null;
        if (currency === Currency.LBP) {
            usdEquivalent = (amount / LBP_TO_USD_RATE).toFixed(2);
        }

        return (
            <div className="text-right">
                <p className="font-semibold">{amount.toLocaleString()} {currency}</p>
                {usdEquivalent && <p className="text-xs text-gray-500 dark:text-gray-400">${usdEquivalent} USD</p>}
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg shadow-lg h-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Transaction History</h2>
            <div className="overflow-y-auto max-h-96">
                {transactions.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {transactions.map(tx => (
                            <li key={tx.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{tx.category}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date.toLocaleDateString()}</p>
                                </div>
                                {formatCurrency(tx.amount, tx.currency)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">Your transactions will appear here.</p>
                )}
            </div>
        </div>
    );
};

export default TransactionList;
