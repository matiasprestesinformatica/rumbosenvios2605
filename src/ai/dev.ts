
import { config } from 'dotenv';
config(); // Load environment variables from .env file for local development

// Import your flows here to make them available for local testing with 'genkit start'
// Example: import './flows/example-flow';

// This file is primarily used by the Genkit CLI to start the development server
// and make your flows available for testing locally (e.g., in the Genkit Developer UI).
// Ensure that any flows you want to test are imported above.

console.log("Genkit development server starting... Ensure your flows are imported in src/ai/dev.ts");
