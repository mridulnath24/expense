'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { type AppData, type Transaction } from '@/lib/types';

const defaultData: AppData = {
  transactions: [],
  categories: {
    income: ['Salary', 'Bonus', 'Gifts', 'Freelance'],
    expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
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
        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
          setData(JSON.parse(storedData));
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
        localStorage.setItem(storageKey, JSON.stringify(newData));
        setData(newData);
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


  return { data, loading, addTransaction, deleteTransaction, addCategory };
}
