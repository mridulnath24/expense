'use server';
/**
 * @fileOverview An AI flow to suggest a spending category based on a transaction description.
 * 
 * - suggestCategory - A function that suggests a category for a transaction.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestCategoryInputSchema = z.object({
    description: z.string().describe('The description of the transaction.'),
    categories: z.array(z.string()).describe('The list of available expense categories to choose from.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
    category: z.string().describe('The suggested category for the transaction.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
    return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
    name: 'suggestCategoryPrompt',
    input: { schema: SuggestCategoryInputSchema },
    output: { schema: SuggestCategoryOutputSchema },
    prompt: `Based on the transaction description, suggest the most appropriate category from the provided list.

Transaction Description: {{{description}}}

Available Categories:
{{#each categories}}
- {{{this}}}
{{/each}}

Only return a category that is present in the list of available categories.`,
});


const suggestCategoryFlow = ai.defineFlow(
    {
        name: 'suggestCategoryFlow',
        inputSchema: SuggestCategoryInputSchema,
        outputSchema: SuggestCategoryOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);
