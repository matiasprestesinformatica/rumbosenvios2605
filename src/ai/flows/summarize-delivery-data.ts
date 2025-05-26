// SummarizeDeliveryData.ts
'use server';
/**
 * @fileOverview Summarizes delivery data and highlights key performance indicators and potential issues.
 *
 * - summarizeDeliveryData - A function that generates a summary of delivery data.
 * - SummarizeDeliveryDataInput - The input type for the summarizeDeliveryData function.
 * - SummarizeDeliveryDataOutput - The return type for the summarizeDeliveryData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDeliveryDataInputSchema = z.object({
  deliveryData: z
    .string()
    .describe(
      'Delivery data, including key performance indicators and potential issues.'
    ),
});
export type SummarizeDeliveryDataInput = z.infer<typeof SummarizeDeliveryDataInputSchema>;

const SummarizeDeliveryDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the delivery data.'),
});
export type SummarizeDeliveryDataOutput = z.infer<typeof SummarizeDeliveryDataOutputSchema>;

export async function summarizeDeliveryData(input: SummarizeDeliveryDataInput): Promise<SummarizeDeliveryDataOutput> {
  return summarizeDeliveryDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDeliveryDataPrompt',
  input: {schema: SummarizeDeliveryDataInputSchema},
  output: {schema: SummarizeDeliveryDataOutputSchema},
  prompt: `You are an AI assistant helping managers understand delivery performance.

  Please provide a concise summary of the following delivery data, highlighting key performance indicators and potential issues:

  {{deliveryData}}
  `,
});

const summarizeDeliveryDataFlow = ai.defineFlow(
  {
    name: 'summarizeDeliveryDataFlow',
    inputSchema: SummarizeDeliveryDataInputSchema,
    outputSchema: SummarizeDeliveryDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
