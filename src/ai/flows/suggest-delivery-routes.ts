// src/ai/flows/suggest-delivery-routes.ts
'use server';
/**
 * @fileOverview AI-powered delivery route suggestion flow.
 *
 * - suggestDeliveryRoutes - A function that suggests optimal delivery routes.
 * - SuggestDeliveryRoutesInput - The input type for the suggestDeliveryRoutes function.
 * - SuggestDeliveryRoutesOutput - The return type for the suggestDeliveryRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDeliveryRoutesInputSchema = z.object({
  currentLocation: z
    .string()
    .describe('The current location of the delivery vehicle.'),
  destinations: z
    .array(z.string())
    .describe('A list of delivery destinations.'),
  trafficConditions: z
    .string()
    .describe('Real-time traffic conditions along the possible routes.'),
  weatherConditions: z
    .string()
    .describe('Current weather conditions at the locations.'),
  deliveryDeadlines: z
    .array(z.string())
    .describe(
      'A list of delivery deadlines for each destination, in ISO format.'
    ),
});
export type SuggestDeliveryRoutesInput = z.infer<
  typeof SuggestDeliveryRoutesInputSchema
>;

const SuggestDeliveryRoutesOutputSchema = z.object({
  suggestedRoutes: z
    .array(z.string())
    .describe('A list of suggested delivery routes, optimized for time.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the suggested routes.'),
});
export type SuggestDeliveryRoutesOutput = z.infer<
  typeof SuggestDeliveryRoutesOutputSchema
>;

export async function suggestDeliveryRoutes(
  input: SuggestDeliveryRoutesInput
): Promise<SuggestDeliveryRoutesOutput> {
  return suggestDeliveryRoutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDeliveryRoutesPrompt',
  input: {schema: SuggestDeliveryRoutesInputSchema},
  output: {schema: SuggestDeliveryRoutesOutputSchema},
  prompt: `You are an AI logistics expert. Your goal is to suggest the most efficient delivery routes based on real-time conditions and deadlines.

You will be provided with the current location, a list of destinations, traffic conditions, weather conditions, and delivery deadlines.

Based on this information, suggest an optimized list of delivery routes.

Consider all factors to minimize delivery times and improve efficiency.

Current Location: {{{currentLocation}}}
Destinations: {{#each destinations}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Traffic Conditions: {{{trafficConditions}}}
Weather Conditions: {{{weatherConditions}}}
Delivery Deadlines: {{#each deliveryDeadlines}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Reasoning:

Routes:
`,
});

const suggestDeliveryRoutesFlow = ai.defineFlow(
  {
    name: 'suggestDeliveryRoutesFlow',
    inputSchema: SuggestDeliveryRoutesInputSchema,
    outputSchema: SuggestDeliveryRoutesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
