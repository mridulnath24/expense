'use server';

import { defineFunction } from 'genkit';
import { generate } from '@genkit-ai/googleai';

export const respond = defineFunction({
  name: 'respond',
  inputSchema: {
    prompt: 'string'
  },
  outputSchema: {
    response: 'string'
  },
  handler: async (input) => {
    const result = await generate({
      model: 'gemini-pro',
      prompt: input.prompt,
    });

    return { response: result.text || 'AI কিছু উত্তর দেয়নি।' };
  }
});
