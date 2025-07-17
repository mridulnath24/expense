import { createApiHandler } from '@genkit-ai/next';
import { ai } from '@/ai/genkit';

// Import flows to be exposed as API endpoints.
import '@/ai/flows/suggest-expense-category';
import '@/ai/flows/query-transactions';
import '@/ai/flows/parse-transaction-from-text';

export const { GET, POST } = createApiHandler({ ai });