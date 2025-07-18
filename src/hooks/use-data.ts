
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { type AppData, type Transaction } from '@/lib/types';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

export const getBaseCategories = (locale: string): AppData['categories'] => {
  // This function is exported to be used in the settings page for checking default categories.
  // Note: The category names here are the keys, not the translated values.
  return {
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
  };
};

const defaultData: AppData = {
  transactions: [],
  categories: getBaseCategories('en'),
};

export function useData() {
  const { user, db } = useAuth();
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    if (user && db) {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);

      unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const fetchedData = docSnap.data() as AppData;
          const sortedTransactions = (fetchedData.transactions || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setData({ ...fetchedData, transactions: sortedTransactions });
        } else {
          setData(defaultData);
        }
        setLoading(false);
      }, (error) => {
         console.error("Firestore snapshot error:", error);
         setData(defaultData);
         setLoading(false);
      });

    } else if (!user) {
      setData(defaultData);
      setLoading(false);
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, db]);

  const saveData = useCallback(async (newData: AppData) => {
    if (user && db) {
      try {
        const sortedTransactions = newData.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const dataToSave = { ...newData, transactions: sortedTransactions };
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, dataToSave, { merge: true });
      } catch (error) {
        console.error("Failed to save data to Firestore", error);
      }
    }
  }, [user, db]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    const updatedData = {
      ...data,
      transactions: [newTransaction, ...data.transactions],
    };
    saveData(updatedData);
  }, [data, saveData]);
  
  const updateTransaction = useCallback((transaction: Transaction) => {
    const updatedData = {
      ...data,
      transactions: data.transactions.map(t => t.id === transaction.id ? transaction : t),
    };
    saveData(updatedData);
  }, [data, saveData]);

  const deleteTransaction = useCallback((id: string) => {
     const updatedData = {
       ...data,
       transactions: data.transactions.filter(t => t.id !== id),
     };
     saveData(updatedData);
  }, [data, saveData]);
  
  const addCategory = useCallback((type: 'income' | 'expense', category: string) => {
    if (data.categories[type].includes(category)) return;

    const updatedData = {
      ...data,
      categories: {
        ...data.categories,
        [type]: [...data.categories[type], category],
      },
    };
    saveData(updatedData);
  }, [data, saveData]);

  const updateCategory = useCallback((type: 'income' | 'expense', oldName: string, newName: string) => {
    if (oldName === newName || !oldName || !newName) return;
    
    const updatedCategories = { ...data.categories };
    const categoryIndex = updatedCategories[type].indexOf(oldName);
    if (categoryIndex === -1) return;

    updatedCategories[type][categoryIndex] = newName;

    const updatedTransactions = data.transactions.map(t => {
      if (t.type === type && t.category === oldName) {
        return { ...t, category: newName };
      }
      return t;
    });

    saveData({
      categories: updatedCategories,
      transactions: updatedTransactions
    });

  }, [data, saveData]);

  const deleteCategory = useCallback((type: 'income' | 'expense', category: string) => {
    const updatedCategories = {
      ...data.categories,
      [type]: data.categories[type].filter(c => c !== category),
    };
  
    const updatedData = {
      ...data,
      categories: updatedCategories,
    };
  
    saveData(updatedData);
  }, [data, saveData]);


  const exportData = useCallback(() => {
    if (!data) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `expense-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }, [data]);

  const resetData = useCallback(() => {
    saveData(defaultData);
  }, [saveData]);


  return { data, loading, addTransaction, updateTransaction, deleteTransaction, addCategory, updateCategory, deleteCategory, exportData, resetData };
}
