'use server';

/**
 * @fileOverview AI-powered category suggestion for uncategorized expenses.
 *
 * - suggestExpenseCategory - A function that suggests a category for a given expense description.
 * - SuggestExpenseCategoryInput - The input type for the suggestExpenseCategory function.
 * - SuggestExpenseCategoryOutput - The return type for the suggestExpenseCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExpenseCategoryInputSchema = z.object({
  expenseDescription: z
    .string()
    .describe('The description of the uncategorized expense.'),
  categories: z
    .array(z.string())
    .describe('A list of existing expense categories to choose from.'),
});
export type SuggestExpenseCategoryInput = z.infer<
  typeof SuggestExpenseCategoryInputSchema
>;

const SuggestExpenseCategoryOutputSchema = z.object({
  suggestedCategory: z
    .string()
    .describe('The AI-suggested category for the expense.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'The confidence level (0 to 1) of the category suggestion, where 1 is highest confidence.'
    ),
});
export type SuggestExpenseCategoryOutput = z.infer<
  typeof SuggestExpenseCategoryOutputSchema
>;

export async function suggestExpenseCategory(
  input: SuggestExpenseCategoryInput
): Promise<SuggestExpenseCategoryOutput> {
  return suggestExpenseCategoryFlow(input);
}

const suggestExpenseCategoryPrompt = ai.definePrompt(
  {
    name: 'suggestExpenseCategoryPrompt',
    input: { schema: SuggestExpenseCategoryInputSchema },
    output: { schema: SuggestExpenseCategoryOutputSchema },
    prompt: `You are an expert financial assistant. Your task is to categorize an expense based on its description. You must choose a category from the provided list.

Expense Description: {{{expenseDescription}}}

Available Categories:
- {{#each categories}}{{{this}}}{{/each}}

Based on the description, provide the most appropriate category and a confidence score.`,
  }
);


const suggestExpenseCategoryFlow = ai.defineFlow(
  {
    name: 'suggestExpenseCategoryFlow',
    inputSchema: SuggestExpenseCategoryInputSchema,
    outputSchema: SuggestExpenseCategoryOutputSchema,
  },
  async (input) => {
    const { output } = await suggestExpenseCategoryPrompt(input);

    if (!output) {
      throw new Error('AI failed to provide a valid suggestion.');
    }

    return output;
  }
);