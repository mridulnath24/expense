'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { type AppData, type Transaction } from '@/lib/types';

const defaultData: AppData = {
  transactions: [],
  categories: {
    income: ['Salary', 'Bonus', 'Gifts', 'Freelance'],
    expense: [
      'Food',
      'Transport',
      'Utilities',
      'House Rent',
      'Entertainment',
      'Health',
      'Shopping',
      'Other',
      'Grocery',
      'DPS',
      'EMI',
      'Medical',
      'Electricity Bill',
      'Gas Bill',
      'Wifi Bill',
    ],
  },
};

export function useData() {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);

  const storageKey = user ? `spendwise_data_${user}` : '';

  useEffect(() => {
    if (user) {
      setLoading(true);
      try {
        const storedDataJSON = localStorage.getItem(storageKey);
        if (storedDataJSON) {
          const storedData = JSON.parse(storedDataJSON);
          // Merge default categories with stored categories to ensure new categories are added
          const mergedCategories = {
            income: [...new Set([...defaultData.categories.income, ...(storedData.categories?.income || [])])],
            expense: [...new Set([...defaultData.categories.expense, ...(storedData.categories?.expense || [])])],
          };
          const updatedData = { ...storedData, categories: mergedCategories };
          setData(updatedData);
          // Save the updated data back to localStorage
          localStorage.setItem(storageKey, JSON.stringify(updatedData));
        } else {
          // Set default data for new user
          setData(defaultData);
          localStorage.setItem(storageKey, JSON.stringify(defaultData));
        }
      } catch (error) {
        console.error("Failed to process data from localStorage", error);
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    } else {
      setData(defaultData);
      setLoading(false);
    }
  }, [user, storageKey]);

  const saveData = useCallback((newData: AppData) => {
    if (user) {
      try {
        // Ensure transactions are sorted by date descending before saving
        const sortedTransactions = newData.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const dataToSave = { ...newData, transactions: sortedTransactions };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        setData(dataToSave);
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [user, storageKey]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    const newData = {
      ...data,
      transactions: [newTransaction, ...data.transactions],
    };
    saveData(newData);
  }, [data, saveData]);
  
  const updateTransaction = useCallback((transaction: Transaction) => {
    const newData = {
      ...data,
      transactions: data.transactions.map(t => t.id === transaction.id ? transaction : t),
    };
    saveData(newData);
  }, [data, saveData]);

  const deleteTransaction = useCallback((id: string) => {
    const newData = {
      ...data,
      transactions: data.transactions.filter(t => t.id !== id),
    };
    saveData(newData);
  }, [data, saveData]);
  
  const addCategory = useCallback((type: 'income' | 'expense', category: string) => {
    if (data.categories[type].includes(category)) return;

    const newData = {
      ...data,
      categories: {
        ...data.categories,
        [type]: [...data.categories[type], category],
      },
    };
    saveData(newData);
  }, [data, saveData]);


  return { data, loading, addTransaction, updateTransaction, deleteTransaction, addCategory };
}
