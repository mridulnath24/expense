import { createApi } from '@genkit-ai/next';
import { ai } from '@/ai/genkit';
import '@/ai/flows/suggest-expense-category';

export const { GET, POST } = createApi({ ai });
