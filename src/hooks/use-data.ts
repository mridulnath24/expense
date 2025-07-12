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

  const storageKey = user ? `expense_tracker_data_${user.uid}` : '';

  useEffect(() => {
    if (user && storageKey) {
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
          // Save the updated data back to localStorage if it was changed
          if(JSON.stringify(updatedData) !== JSON.stringify(storedData)) {
            localStorage.setItem(storageKey, JSON.stringify(updatedData));
          }
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
    } else if (!user) {
      setData(defaultData);
      setLoading(false);
    }
  }, [user, storageKey]);

  const saveData = useCallback((newData: AppData) => {
    if (user && storageKey) {
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
    setData((prevData) => {
      const newData = {
        ...prevData,
        transactions: [newTransaction, ...prevData.transactions],
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);
  
  const updateTransaction = useCallback((transaction: Transaction) => {
    setData((prevData) => {
      const newData = {
        ...prevData,
        transactions: prevData.transactions.map(t => t.id === transaction.id ? transaction : t),
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  const deleteTransaction = useCallback((id: string) => {
     setData((prevData) => {
      const newData = {
        ...prevData,
        transactions: prevData.transactions.filter(t => t.id !== id),
      };
      saveData(newData);
      return newData;
     });
  }, [saveData]);
  
  const addCategory = useCallback((type: 'income' | 'expense', category: string) => {
    setData((prevData) => {
      if (prevData.categories[type].includes(category)) return prevData;

      const newData = {
        ...prevData,
        categories: {
          ...prevData.categories,
          [type]: [...prevData.categories[type], category],
        },
      };
      saveData(newData);
      return newData;
    });
  }, [saveData]);


  return { data, loading, addTransaction, updateTransaction, deleteTransaction, addCategory };
}
