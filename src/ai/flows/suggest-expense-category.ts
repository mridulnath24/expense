// Implemented Genkit flow for suggesting expense categories based on transaction descriptions.

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

const prompt = ai.definePrompt({
  name: 'suggestExpenseCategoryPrompt',
  input: {schema: SuggestExpenseCategoryInputSchema},
  output: {schema: SuggestExpenseCategoryOutputSchema},
  prompt: `You are an AI assistant helping users categorize their expenses.

  Given the following expense description, suggest a category for it. Also, provide a confidence level (0 to 1) for your suggestion.

  Expense Description: {{{expenseDescription}}}
  `,
});

const suggestExpenseCategoryFlow = ai.defineFlow(
  {
    name: 'suggestExpenseCategoryFlow',
    inputSchema: SuggestExpenseCategoryInputSchema,
    outputSchema: SuggestExpenseCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
