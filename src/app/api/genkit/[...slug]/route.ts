import { createApi } from '@genkit-ai/next';
import { ai } from '@/ai/genkit';

// Import flows to be exposed as API endpoints.
import '@/ai/flows/suggest-expense-category';
import '@/ai/flows/query-transactions';

export const { GET, POST } = createApi({ ai });
