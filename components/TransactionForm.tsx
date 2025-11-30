
import React, { useState, useEffect } from 'react';
import { TransactionType, Currency, ExpenseCategory, IncomeCategory } from '../types';
import { expenseCategories, incomeCategories } from '../constants';

interface TransactionFormProps {
    onAddTransaction: (tx: { amount: number; currency: Currency; type: TransactionType; category: ExpenseCategory | IncomeCategory }) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
    const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<Currency>(Currency.LBP);
    const [category, setCategory] = useState<ExpenseCategory | IncomeCategory>(ExpenseCategory.GROCERIES);
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset category when type changes
        if (type === TransactionType.EXPENSE) {
            setCategory(ExpenseCategory.GROCERIES);
        } else {
            setCategory(IncomeCategory.SALARY_USD);
        }
    }, [type]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setError('');
        onAddTransaction({ amount: numAmount, currency, type, category });
        setAmount('');
    };

    const categories = type === TransactionType.EXPENSE ? expenseCategories : incomeCategories;

    return (
        <div className="bg-white dark:bg-gray-900/50 p-6 rounded-lg shadow-lg h-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Add New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <div className="mt-1 grid grid-cols-2 gap-2 rounded-md bg-gray-200 dark:bg-gray-700 p-1">
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.EXPENSE)}
                            className={`px-3 py-2 text-sm font-medium rounded ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setType(TransactionType.INCOME)}
                            className={`px-3 py-2 text-sm font-medium rounded ${type === TransactionType.INCOME ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Income
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 block w-full rounded-none rounded-l-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            placeholder="e.g., 500000"
                        />
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-sm"
                        >
                            <option value={Currency.LBP}>LBP</option>
                            <option value={Currency.FRESH_USD}>Fresh USD</option>
                            <option value={Currency.LOLLAR}>Lollar</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                        Add Transaction
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TransactionForm;
