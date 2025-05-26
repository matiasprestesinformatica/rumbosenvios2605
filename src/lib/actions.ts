'use server';

import { suggestDeliveryRoutes, type SuggestDeliveryRoutesInput, type SuggestDeliveryRoutesOutput } from '@/ai/flows/suggest-delivery-routes';
import { summarizeDeliveryData, type SummarizeDeliveryDataInput, type SummarizeDeliveryDataOutput } from '@/ai/flows/summarize-delivery-data';
import { prioritizeDeliverySchedule, type PrioritizeDeliveryScheduleInput, type PrioritizeDeliveryScheduleOutput } from '@/ai/flows/prioritize-delivery-schedule';

export async function suggestDeliveryRoutesServerAction(
  input: SuggestDeliveryRoutesInput
): Promise<SuggestDeliveryRoutesOutput> {
  try {
    console.log("Calling suggestDeliveryRoutes with input:", JSON.stringify(input, null, 2));
    const result = await suggestDeliveryRoutes(input);
    console.log("suggestDeliveryRoutes result:", JSON.stringify(result, null, 2));
    if (!result || !result.suggestedRoutes || !result.reasoning) {
      // Provide a default structure if AI returns unexpected or partial data
      return {
        suggestedRoutes: result?.suggestedRoutes || [],
        reasoning: result?.reasoning || "La IA no pudo proporcionar un razonamiento detallado.",
      };
    }
    return result;
  } catch (error) {
    console.error('Error in suggestDeliveryRoutesServerAction:', error);
    // It's important to throw an error or return a structured error object
    // that the client can understand and handle.
    throw new Error(`AI service error: ${(error as Error).message}`);
  }
}

export async function summarizeDeliveryDataServerAction(
  input: SummarizeDeliveryDataInput
): Promise<SummarizeDeliveryDataOutput> {
   try {
    const result = await summarizeDeliveryData(input);
     if (!result || typeof result.summary !== 'string') {
      return { summary: "La IA no pudo generar un resumen." };
    }
    return result;
  } catch (error) {
    console.error('Error in summarizeDeliveryDataServerAction:', error);
    throw new Error(`AI service error: ${(error as Error).message}`);
  }
}

export async function prioritizeDeliveryScheduleServerAction(
  input: PrioritizeDeliveryScheduleInput
): Promise<PrioritizeDeliveryScheduleOutput> {
  try {
    const result = await prioritizeDeliverySchedule(input);
    if (!result || !Array.isArray(result)) {
      return [];
    }
    return result;
  } catch (error) {
    console.error('Error in prioritizeDeliveryScheduleServerAction:', error);
    throw new Error(`AI service error: ${(error as Error).message}`);
  }
}
