
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from 'genkit/googleCloud';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
    googleCloud(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
