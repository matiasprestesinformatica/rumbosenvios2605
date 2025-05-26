
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import { firebase } from '@genkit-ai/firebase'; // Example, if you integrate Firebase Functions for Genkit flows

export const ai = genkit({
  plugins: [
    googleAI(),
    // firebase() // Example
  ],
  logLevel: 'debug', // Set to 'info' or 'warn' for production
  enableTracingAndMetrics: true,
});

// Example of defining a model explicitly if needed, though often the default in plugins is fine.
// export const geminiPro = googleAIModel('gemini-pro');
