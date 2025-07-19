
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { type AppData, type Transaction } from '@/lib/types';

export const getBaseCategories = (): AppData['categories'] => {
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
  categories: getBaseCategories(),
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
          // For a new user, set the default data
          setDoc(userDocRef, defaultData);
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

  const saveData = useCallback(async (newData: Partial<AppData>) => {
    if (user && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, newData, { merge: true });
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
    setData(currentData => {
      const updatedData = {
        ...currentData,
        transactions: [newTransaction, ...currentData.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
      saveData(updatedData);
      return updatedData;
    });
  }, [saveData]);
  
  const updateTransaction = useCallback((transaction: Transaction) => {
    setData(currentData => {
      const updatedData = {
        ...currentData,
        transactions: currentData.transactions.map(t => t.id === transaction.id ? transaction : t),
      };
      saveData(updatedData);
      return updatedData;
    });
  }, [saveData]);

  const deleteTransaction = useCallback((id: string) => {
     setData(currentData => {
       const updatedData = {
         ...currentData,
         transactions: currentData.transactions.filter(t => t.id !== id),
       };
       saveData(updatedData);
       return updatedData;
     });
  }, [saveData]);
  
  const addCategory = useCallback((type: 'income' | 'expense', category: string) => {
    setData(currentData => {
      if (currentData.categories[type].includes(category)) return currentData;
      const updatedData = {
        ...currentData,
        categories: {
          ...currentData.categories,
          [type]: [...currentData.categories[type], category],
        },
      };
      saveData(updatedData);
      return updatedData;
    });
  }, [saveData]);

  const updateCategory = useCallback((type: 'income' | 'expense', oldName: string, newName: string) => {
    if (oldName === newName || !oldName || !newName.trim()) return;
    
    setData(currentData => {
      const updatedCategories = { ...currentData.categories };
      const categoryIndex = updatedCategories[type].indexOf(oldName);
      if (categoryIndex === -1) return currentData;

      updatedCategories[type][categoryIndex] = newName.trim();

      const updatedTransactions = currentData.transactions.map(t => {
        if (t.type === type && t.category === oldName) {
          return { ...t, category: newName.trim() };
        }
        return t;
      });

      const updatedData = {
        categories: updatedCategories,
        transactions: updatedTransactions
      };
      saveData(updatedData);
      return updatedData;
    });
  }, [saveData]);

  const deleteCategory = useCallback((type: 'income' | 'expense', categoryToDelete: string) => {
    setData(currentData => {
        // Create a new categories object with the category removed.
        const newCategories = {
            ...currentData.categories,
            [type]: currentData.categories[type].filter(c => c !== categoryToDelete),
        };

        // If 'Other' doesn't exist in the new list for expenses, add it.
        // This ensures transactions have a fallback category.
        if (type === 'expense' && !newCategories.expense.includes('Other')) {
            newCategories.expense.push('Other');
        }

        // Create a new transactions array, re-assigning categories if necessary.
        const newTransactions = currentData.transactions.map(t => {
            if (t.type === type && t.category === categoryToDelete) {
                return { ...t, category: 'Other' };
            }
            return t;
        });

        // Create a completely new data object to save.
        const updatedData = {
            ...currentData,
            transactions: newTransactions,
            categories: newCategories,
        };
        
        saveData(updatedData);
        return updatedData;
    });
  }, [saveData]);


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
