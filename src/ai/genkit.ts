
'use server';
/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It configures the Google AI plugin for generative models.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';

export const ai = genkit({
  plugins: [
    googleAI(),
    googleCloud(),
  ],
  logSinks: [],
  enableTracingAndMetrics: true,
});
