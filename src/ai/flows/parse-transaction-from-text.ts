'use server';

/**
 * @fileOverview An AI flow to parse a transaction from a natural language string.
 * - parseTransactionFromText - A function that extracts transaction details from text.
 * - ParseTransactionFromTextInput - The input type for the parseTransactionFromText function.
 * - ParseTransactionFromTextOutput - The return type for the parseTransactionFromText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ParseTransactionFromTextInputSchema = z.object({
  text: z.string().describe('The natural language text describing a transaction.'),
  locale: z.enum(['en', 'bn']).describe('The locale of the input text.'),
});
export type ParseTransactionFromTextInput = z.infer<typeof ParseTransactionFromTextInputSchema>;

const ParseTransactionFromTextOutputSchema = z.object({
  type: z.enum(['income', 'expense']).describe('The type of the transaction.'),
  amount: z.coerce.number().describe('The numeric amount of the transaction.'),
  description: z.string().describe('A short description of the transaction.'),
});
export type ParseTransactionFromTextOutput = z.infer<typeof ParseTransactionFromTextOutputSchema>;


export async function parseTransactionFromText(input: ParseTransactionFromTextInput): Promise<ParseTransactionFromTextOutput> {
  return parseTransactionFlow(input);
}

const englishPrompt = `You are an expert at parsing transaction data from natural language. The user will provide text describing a financial transaction. Your job is to extract the amount, a clean description, and determine if it's an income or an expense.

Rules:
- If words like "salary", "got", "received", "bonus" are used, it is an income.
- If words like "paid", "for", "spent", "bought" are used, it is an expense.
- The amount will be a number.
- The description should be a concise summary of the item or service.

Text: {{{text}}}`;

const bengaliPrompt = `আপনি প্রাকৃতিক ভাষা থেকে লেনদেনের ডেটা পার্স করায় একজন বিশেষজ্ঞ। ব্যবহারকারী একটি আর্থিক লেনদেন বর্ণনা করে পাঠ্য সরবরাহ করবে। আপনার কাজ হলো পরিমাণ, একটি পরিষ্কার বিবরণ বের করা এবং এটি আয় না ব্যয় তা নির্ধারণ করা।

নিয়মাবলী:
- যদি "বেতন", "পেলাম", "গ্রহণ", "বোনাস" এর মতো শব্দ ব্যবহৃত হয়, তবে এটি একটি আয়।
- যদি "পরিশোধ", "জন্য", "খরচ", "কিনলাম" এর মতো শব্দ ব্যবহৃত হয়, তবে এটি একটি ব্যয়।
- পরিমাণটি একটি সংখ্যা হবে।
- বিবরণটি আইটেম বা পরিষেবার একটি সংক্ষিপ্ত সারসংক্ষেপ হওয়া উচিত।

পাঠ্য: {{{text}}}`;


const prompt = ai.definePrompt({
  name: 'parseTransactionPrompt',
  input: { schema: ParseTransactionFromTextInputSchema },
  output: { schema: ParseTransactionFromTextOutputSchema },
  prompt: `{{#if (eq locale "bn")}}${bengaliPrompt}{{else}}${englishPrompt}{{/if}}`,
});


const parseTransactionFlow = ai.defineFlow(
  {
    name: 'parseTransactionFlow',
    inputSchema: ParseTransactionFromTextInputSchema,
    outputSchema: ParseTransactionFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("Failed to parse transaction from text");
    }
    return output;
  }
);
