'use server';

/**
 * @fileOverview An AI flow to query transactions based on natural language.
 * - queryTransactions - a function that filters transactions based on a user's query.
 * - QueryTransactionsInput - The input type for the queryTransactions function.
 * - QueryTransactionsOutput - The return type for the queryTransactions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { type Transaction } from '@/lib/types';

const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number(),
  description: z.string(),
  category: z.string(),
  date: z.string(),
});

const QueryTransactionsInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
  transactions: z.array(TransactionSchema).describe('The list of all transactions to search through.'),
});
export type QueryTransactionsInput = z.infer<typeof QueryTransactionsInputSchema>;

const QueryTransactionsOutputSchema = z.object({
  matchingTransactionIds: z
    .array(z.string())
    .describe('A list of IDs of the transactions that match the user query.'),
});
export type QueryTransactionsOutput = z.infer<typeof QueryTransactionsOutputSchema>;

export async function queryTransactions(input: QueryTransactionsInput): Promise<QueryTransactionsOutput> {
  // If the query is empty, return no transactions.
  if (!input.query.trim()) {
    return { matchingTransactionIds: [] };
  }
  return queryTransactionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'queryTransactionsPrompt',
  input: { schema: QueryTransactionsInputSchema },
  output: { schema: QueryTransactionsOutputSchema },
  prompt: `You are an expert data analyst for a personal finance app. Your task is to analyze a user's natural language query and determine which transactions from their history match the query.

Analyze the user's query for keywords related to dates (e.g., "last week", "in July", "yesterday"), categories, descriptions, amounts (e.g., "over $50", "less than 100"), or transaction types (e.g., "income", "expenses").

Based on your analysis, return a list of transaction IDs that perfectly match the user's request.

Current Date for reference: ${new Date().toDateString()}

User Query:
"{{{query}}}"

Full Transaction List (in JSON format):
{{{json transactions}}}

Return ONLY the list of matching transaction IDs. If no transactions match, return an empty list.
`,
});

const queryTransactionsFlow = ai.defineFlow(
  {
    name: 'queryTransactionsFlow',
    inputSchema: QueryTransactionsInputSchema,
    outputSchema: QueryTransactionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("Failed to query transactions");
    }
    return output;
  }
);
