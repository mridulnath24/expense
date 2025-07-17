'use server';

/**
 * @fileOverview An AI flow to suggest an expense category based on a description.
 * - suggestExpenseCategory - A function that suggests a category for a transaction.
 * - SuggestExpenseCategoryInput - The input type for the suggestExpenseCategory function.
 * - SuggestExpenseCategoryOutput - The return type for the suggestExpenseCategory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const allExpenseCategories = [
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
];

const SuggestExpenseCategoryInputSchema = z.object({
  description: z.string().describe('The description of the expense transaction.'),
  categories: z.array(z.string()).default(allExpenseCategories).describe('The list of available expense categories.'),
});
export type SuggestExpenseCategoryInput = z.infer<typeof SuggestExpenseCategoryInputSchema>;

const SuggestExpenseCategoryOutputSchema = z.object({
  category: z.string().describe('The suggested category for the expense.'),
});
export type SuggestExpenseCategoryOutput = z.infer<typeof SuggestExpenseCategoryOutputSchema>;

export async function suggestExpenseCategory(input: SuggestExpenseCategoryInput): Promise<SuggestExpenseCategoryOutput> {
  return suggestExpenseCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExpenseCategoryPrompt',
  input: { schema: SuggestExpenseCategoryInputSchema },
  output: { schema: SuggestExpenseCategoryOutputSchema },
  prompt: `You are an expert at categorizing expenses. Based on the transaction description, suggest the most appropriate category from the provided list.

Transaction Description: {{{description}}}

Available Categories:
{{#each categories}}
- {{{this}}}
{{/each}}

Only return one category from the list provided.
`,
});

const suggestExpenseCategoryFlow = ai.defineFlow(
  {
    name: 'suggestExpenseCategoryFlow',
    inputSchema: SuggestExpenseCategoryInputSchema,
    outputSchema: SuggestExpenseCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
