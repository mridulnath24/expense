
export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
};

export type Category = {
    name: string;
    type: 'income' | 'expense';
};

export type AppData = {
  transactions: Transaction[];
  categories: {
    income: string[];
    expense: string[];
  };
};
