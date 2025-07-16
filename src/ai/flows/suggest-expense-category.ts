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

// Define the tool for the AI to use for providing the category suggestion.
const categorySuggestionTool = ai.defineTool(
  {
    name: 'provideCategorySuggestion',
    description:
      'Provides a category suggestion for the expense description.',
    inputSchema: SuggestExpenseCategoryOutputSchema,
    outputSchema: z.void(),
  },
  async () => {} // The tool itself doesn't need to do anything, it's just a data structure.
);

export async function suggestExpenseCategory(
  input: SuggestExpenseCategoryInput
): Promise<SuggestExpenseCategoryOutput> {
  return suggestExpenseCategoryFlow(input);
}

const suggestExpenseCategoryFlow = ai.defineFlow(
  {
    name: 'suggestExpenseCategoryFlow',
    inputSchema: SuggestExpenseCategoryInputSchema,
    outputSchema: SuggestExpenseCategoryOutputSchema,
  },
  async input => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      tools: [categorySuggestionTool],
      prompt: `You are an expert financial assistant. Your task is to categorize an expense based on its description. You must choose a category from the provided list.

Expense Description: ${input.expenseDescription}

Available Categories:
${input.categories.join('\n- ')}

Based on the description, call the provideCategorySuggestion tool with the most appropriate category and a confidence score.`,
    });

    const toolRequest = llmResponse.toolRequest();
    if (
      toolRequest &&
      toolRequest.name === 'provideCategorySuggestion' &&
      toolRequest.input
    ) {
      // The model correctly used the tool.
      // We can now safely parse the input to the tool.
      const suggestion = SuggestExpenseCategoryOutputSchema.parse(
        toolRequest.input
      );
      return suggestion;
    }

    // If the model fails to use the tool, we throw an error.
    throw new Error('AI failed to provide a valid suggestion.');
  }
);
