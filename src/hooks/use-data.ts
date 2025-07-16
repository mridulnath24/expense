'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { type AppData, type Transaction } from '@/lib/types';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const getBaseCategories = (locale: string): AppData['categories'] => {
  const t = locale === 'bn' ? bn : en;
  return {
    income: [
      "Salary",
      "Bonus",
      "Gifts",
      "Freelance"
    ],
    expense: [
      "Food",
      "Transport",
      "Utilities",
      "House Rent",
      "Entertainment",
      "Health",
      "Shopping",
      "Other",
      "Grocery",
      "DPS",
      "EMI",
      "Medical",
      "Electricity Bill",
      "Gas Bill",
      "Wifi Bill"
    ],
  }
}

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
           // Merge default categories with stored categories to ensure new categories are added
          const baseCategories = getBaseCategories('en'); // Always merge with english base
          const mergedCategories = {
            income: [...new Set([...baseCategories.income, ...(fetchedData.categories?.income || [])])],
            expense: [...new Set([...baseCategories.expense, ...(fetchedData.categories?.expense || [])])],
          };
          const sortedTransactions = (fetchedData.transactions || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const updatedData = { ...fetchedData, categories: mergedCategories, transactions: sortedTransactions };
          setData(updatedData);
        } else {
          // This case is handled by AuthProvider, which creates the document.
          // We can set default data here as a fallback while the document is being created.
          setData(defaultData);
        }
        setLoading(false);
      }, (error) => {
         console.error("Firestore snapshot error:", error);
         setData(defaultData); // Fallback to default data on error
         setLoading(false);
      });

    } else if (!user) {
      // Not logged in, reset to default data and stop loading
      setData(defaultData);
      setLoading(false);
    }
    
    // Cleanup subscription on unmount
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
        // No need to call setData here as onSnapshot will handle it
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


  return { data, loading, addTransaction, updateTransaction, deleteTransaction, addCategory };
}
