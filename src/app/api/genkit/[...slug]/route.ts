'use server';

import {createApi} from '@genkit-ai/next/api';

// Import flows so that they are registered with Genkit.
import '@/ai/flows/suggest-expense-category';
import {ai} from '@/ai/genkit';

export const {GET, POST} = createApi({
  ai,
});
