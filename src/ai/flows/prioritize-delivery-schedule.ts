// 'use server';

/**
 * @fileOverview A flow for prioritizing the delivery schedule based on urgency, location, and driver availability.
 *
 * - prioritizeDeliverySchedule - A function that uses AI to prioritize the delivery schedule.
 * - PrioritizeDeliveryScheduleInput - The input type for the prioritizeDeliverySchedule function.
 * - PrioritizeDeliveryScheduleOutput - The return type for the prioritizeDeliverySchedule function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeDeliveryScheduleInputSchema = z.object({
  deliveries: z.array(
    z.object({
      deliveryId: z.string().describe('The unique identifier for the delivery.'),
      address: z.string().describe('The delivery address.'),
      urgency: z
        .enum(['high', 'medium', 'low'])
        .describe('The urgency level of the delivery.'),
      packageType: z.string().describe('The type of package being delivered.'),
      timeWindowStart: z.string().describe('The start of the delivery time window.'),
      timeWindowEnd: z.string().describe('The end of the delivery time window.'),
    })
  ).describe('A list of deliveries to be prioritized.'),
  drivers: z.array(
    z.object({
      driverId: z.string().describe('The unique identifier for the driver.'),
      currentLocation: z.string().describe('The current location of the driver.'),
      availabilityStart: z.string().describe('The start of the driver availability.'),
      availabilityEnd: z.string().describe('The end of the driver availability.'),
    })
  ).describe('A list of available drivers.'),
  currentConditions: z.string().describe('A description of the current conditions such as weather and traffic.')
});

export type PrioritizeDeliveryScheduleInput = z.infer<
  typeof PrioritizeDeliveryScheduleInputSchema
>;

const PrioritizeDeliveryScheduleOutputSchema = z.array(
  z.object({
    deliveryId: z.string().describe('The unique identifier for the delivery.'),
    priorityScore: z.number().describe('A score indicating the delivery priority (higher is better).'),
    reason: z.string().describe('The reason for the assigned priority score.'),
    assignedDriverId: z.string().optional().describe('The ID of the driver assigned to this delivery, if any.')
  })
).describe('A list of deliveries with assigned priority scores and reasons.');

export type PrioritizeDeliveryScheduleOutput = z.infer<
  typeof PrioritizeDeliveryScheduleOutputSchema
>;

export async function prioritizeDeliverySchedule(
  input: PrioritizeDeliveryScheduleInput
): Promise<PrioritizeDeliveryScheduleOutput> {
  return prioritizeDeliveryScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeDeliverySchedulePrompt',
  input: {schema: PrioritizeDeliveryScheduleInputSchema},
  output: {schema: PrioritizeDeliveryScheduleOutputSchema},
  prompt: `You are an expert delivery dispatcher optimizing delivery schedules.

Given the following deliveries, drivers, and current conditions, prioritize the delivery schedule based on urgency, location, and driver availability.

Deliveries:
{{#each deliveries}}
  - Delivery ID: {{this.deliveryId}}, Address: {{this.address}}, Urgency: {{this.urgency}}, Package Type: {{this.packageType}}, Time Window: {{this.timeWindowStart}} - {{this.timeWindowEnd}}
{{/each}}

Drivers:
{{#each drivers}}
  - Driver ID: {{this.driverId}}, Location: {{this.currentLocation}}, Availability: {{this.availabilityStart}} - {{this.availabilityEnd}}
{{/each}}

Current Conditions: {{currentConditions}}

Prioritize the deliveries, assigning a priority score and a reason for each score. Also attempt to assign a driver to each delivery, if possible.

Ensure that the output is a JSON array of deliveries, each with a priorityScore, reason, and optionally assignedDriverId.

Output format: 
`,
});

const prioritizeDeliveryScheduleFlow = ai.defineFlow(
  {
    name: 'prioritizeDeliveryScheduleFlow',
    inputSchema: PrioritizeDeliveryScheduleInputSchema,
    outputSchema: PrioritizeDeliveryScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
