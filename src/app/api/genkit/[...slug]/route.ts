
/**
 * @fileoverview This file creates a Next.js API route handler for Genkit.
 * It allows the frontend to communicate with the Genkit flows.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';
import {NextRequest} from 'next/server';

import '@/ai/flows/suggest-category-flow';

// Initialize Genkit with plugins
genkit({
  plugins: [
    googleAI(),
    googleCloud(),
  ],
  logSinks: [],
  enableTracingAndMetrics: true,
});

// Define the route handler
async function handler(req: NextRequest) {
  const GkApi = (await import('genkit/api')).GkApi;
  const gkApi = new GkApi();
  return gkApi.handleRequest(req);
}

// Export the handler for all supported methods
export {handler as GET, handler as POST, handler as PUT, handler as DELETE};
