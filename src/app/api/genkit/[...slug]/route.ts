'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {defineNextJsHandler} from '@genkit-ai/next';

// Import flows so that they are registered with Genkit.
import '@/ai/flows/suggest-expense-category';

genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});

export const {GET, POST} = defineNextJsHandler();
