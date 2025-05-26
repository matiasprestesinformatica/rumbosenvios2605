
'use server';
/**
 * @fileOverview A Genkit flow to suggest delivery options based on package details.
 *
 * - suggestDeliveryOptions - A function that uses AI to suggest delivery options.
 * - SuggestDeliveryOptionsInput - The input type for the suggestDeliveryOptions function.
 * - SuggestDeliveryOptionsOutput - The return type for the suggestDeliveryOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDeliveryOptionsInputSchema = z.object({
  packageDescription: z.string().describe('A brief description of the package including type, approximate weight, and dimensions. E.g., "Documentos urgentes", "Caja pequeña de 2kg (30x20x10cm)", "Paquete mediano frágil de 5kg".'),
  originAddress: z.string().optional().describe('The origin address for context, if available.'),
  destinationAddress: z.string().optional().describe('The destination address for context, if available.'),
  desiredSpeed: z.enum(['any', 'fast', 'standard', 'economic']).default('any').describe('The desired delivery speed preference.'),
});
export type SuggestDeliveryOptionsInput = z.infer<typeof SuggestDeliveryOptionsInputSchema>;

const DeliveryOptionSuggestionSchema = z.object({
  optionName: z.string().describe('Name of the suggested delivery option (e.g., "Moto Express", "Auto Programado", "Bici Eco").'),
  description: z.string().describe('Brief description of why this option might be suitable or its key features (e.g., "Más rápido para paquetes pequeños", "Ideal para envíos programados y voluminosos", "Opción económica para distancias cortas").'),
  estimatedTime: z.string().optional().describe('A rough estimate of delivery time if applicable (e.g., "1-2 horas", "Mismo día", "24-48 horas").'),
  iconHint: z.enum(['Truck', 'Bike', 'Zap', 'Package']).optional().describe('A hint for a relevant icon type if applicable.')
});

const SuggestDeliveryOptionsOutputSchema = z.object({
  suggestions: z.array(DeliveryOptionSuggestionSchema).describe('A list of suggested delivery options.'),
  disclaimer: z.string().optional().describe('A general disclaimer about the suggestions.'),
});
export type SuggestDeliveryOptionsOutput = z.infer<typeof SuggestDeliveryOptionsOutputSchema>;

export async function suggestDeliveryOptions(
  input: SuggestDeliveryOptionsInput
): Promise<SuggestDeliveryOptionsOutput> {
  return suggestDeliveryOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDeliveryOptionsPrompt',
  input: {schema: SuggestDeliveryOptionsInputSchema},
  output: {schema: SuggestDeliveryOptionsOutputSchema},
  prompt: `Eres un asistente experto en logística para "Rumbos Envíos" en Mar del Plata, Argentina.
Tu tarea es sugerir opciones de servicio de entrega basadas en la descripción del paquete y las preferencias del usuario.
Considera factores como urgencia, tamaño, peso y si es en Mar del Plata. No calcules precios exactos, enfócate en el tipo de servicio.

Descripción del Paquete: {{{packageDescription}}}
{{#if originAddress}}Origen: {{{originAddress}}}{{/if}}
{{#if destinationAddress}}Destino: {{{destinationAddress}}}{{/if}}
Preferencia de Velocidad: {{{desiredSpeed}}}

Basado en esto, proporciona 2-3 sugerencias de tipos de servicio. Para cada sugerencia, incluye:
- optionName: Un nombre descriptivo y corto (ej: "Moto Express", "Flete Programado", "Bici Rápida").
- description: Una breve explicación de por qué es una buena opción.
- estimatedTime: (Opcional) Una estimación muy general del tiempo de entrega (ej: "Menos de 2hs", "Durante el día", "24hs").
- iconHint: (Opcional) Sugiere un tipo de ícono: 'Truck' para vehículos grandes, 'Bike' para bicicletas/motos pequeñas, 'Zap' para velocidad, 'Package' para general.

Ejemplo de una sugerencia:
{ "optionName": "Moto Express", "description": "Ideal para documentos y paquetes pequeños que necesitan entrega rápida en la ciudad.", "estimatedTime": "1-3 horas", "iconHint": "Zap" }

Ofrece un breve descargo de responsabilidad general indicando que estas son sugerencias y los detalles finales se confirman al seleccionar el servicio.
`,
});

const suggestDeliveryOptionsFlow = ai.defineFlow(
  {
    name: 'suggestDeliveryOptionsFlow',
    inputSchema: SuggestDeliveryOptionsInputSchema,
    outputSchema: SuggestDeliveryOptionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Ensure there's always a default disclaimer if AI doesn't provide one
    if (output && !output.disclaimer) {
        output.disclaimer = "Estas son sugerencias generadas por IA. Por favor, selecciona el tipo de servicio oficial en el formulario para confirmar todos los detalles y costos.";
    }
    return output || { suggestions: [], disclaimer: "No se pudieron generar sugerencias en este momento. Por favor, selecciona manualmente un tipo de servicio." };
  }
);
