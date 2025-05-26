// This file is being deprecated in favor of entity-specific action files
// in the src/lib/actions/ directory.
// Please import actions from their respective files, e.g.,
// import { addClienteAction } from '@/lib/actions/clientes.actions';

// For Genkit related actions, they remain in their flow files.
// For example, suggestDeliveryRoutesServerAction will be called directly by components
// and it, in turn, calls the Genkit flow.

'use server';

// The Genkit flow related actions that were previously here are now directly
// handled by components or other specific action files that might wrap them.
// For example, components using `suggestDeliveryRoutes` will directly call
// the server action that wraps the Genkit flow.

// Example of how a Genkit flow might be structured if it were here (for reference):
/*
import { suggestDeliveryRoutes, type SuggestDeliveryRoutesInput, type SuggestDeliveryRoutesOutput } from '@/ai/flows/suggest-delivery-routes';

export async function suggestDeliveryRoutesServerAction(
  input: SuggestDeliveryRoutesInput
): Promise<SuggestDeliveryRoutesOutput> {
  try {
    // ... logic ...
    const result = await suggestDeliveryRoutes(input);
    // ... logic ...
    return result;
  } catch (error) {
    console.error('Error in suggestDeliveryRoutesServerAction:', error);
    throw new Error(`AI service error: ${(error as Error).message}`);
  }
}
*/

// The existing Genkit flow wrappers (suggestDeliveryRoutesServerAction, etc.) are now
// directly within the respective UI components or their specific action files if needed for more complex logic.
// If you need generic wrappers, they can be placed here, but it's cleaner to keep them co-located.
// For now, this file is kept to avoid breaking existing imports immediately, but it should be phased out.

export {}; // Add an empty export to make it a module

